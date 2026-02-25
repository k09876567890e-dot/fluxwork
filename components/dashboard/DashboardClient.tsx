"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { RefreshCw, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Task, Subtask, BallHolder } from "@/types";
import { sortTasksByScore } from "@/lib/scoring";
import { mapTaskRow } from "@/lib/mappers";
import TaskList from "@/components/task/TaskList";
import TaskFormModal from "@/components/task/TaskFormModal";
import WaitingLane from "@/components/waiting-lane/WaitingLane";
import Timeline from "@/components/timeline/Timeline";

interface Props {
  initialActiveTasks: Task[];
  initialWaitingTasks: Task[];
  userEmail: string;
}

export interface TaskFormData {
  name: string;
  deadline: string;
  notes?: string;
  estimatedMinutes: number;
  leadTimeMinutes: number;
  ballHolder: BallHolder;
  subtasks?: Pick<Subtask, "name" | "estimatedMinutes" | "isDelegatable" | "dependsOnOthers">[];
}

function rebuildLists(
  allTasks: Task[],
  setActive: (t: Task[]) => void,
  setWaiting: (t: Task[]) => void
) {
  const { activeTasks, waitingTasks } = sortTasksByScore(allTasks);
  setActive(activeTasks);
  setWaiting(waitingTasks);
}

export default function DashboardClient({
  initialActiveTasks,
  initialWaitingTasks,
  userEmail,
}: Props) {
  const [activeTasks, setActiveTasks] = useState<Task[]>(initialActiveTasks);
  const [waitingTasks, setWaitingTasks] = useState<Task[]>(initialWaitingTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  function allTasks() {
    return [...activeTasks, ...waitingTasks];
  }

  async function handleCreate(data: TaskFormData) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    if (json.success) {
      const newTask = mapTaskRow(json.data);
      rebuildLists([...allTasks(), newTask], setActiveTasks, setWaitingTasks);
    }
    setIsModalOpen(false);
  }

  async function handleUpdate(id: string, data: Partial<TaskFormData> & { scheduledStart?: string; scheduledEnd?: string }) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    if (json.success) {
      const updated = mapTaskRow(json.data);
      rebuildLists(
        allTasks().map((t) => (t.id === id ? updated : t)),
        setActiveTasks,
        setWaitingTasks
      );
    }
    setEditingTask(null);
    setIsModalOpen(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    rebuildLists(
      allTasks().filter((t) => t.id !== id),
      setActiveTasks,
      setWaitingTasks
    );
  }

  async function handleGCalSync() {
    setIsSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      window.location.reload();
    } finally {
      setIsSyncing(false);
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const slotId = String(over.id);
    if (!slotId.startsWith("slot-")) return;

    const taskId = String(active.id);
    const timeStr = slotId.replace("slot-", ""); // "08:00"
    const [hoursStr, minsStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const mins = parseInt(minsStr, 10);

    const task = allTasks().find((t) => t.id === taskId);
    if (!task) return;

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, mins);
    const end = new Date(start.getTime() + task.estimatedMinutes * 60_000);

    void handleUpdate(taskId, {
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b px-6 py-3">
          <h1 className="text-xl font-bold">FluxWork</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <button
              onClick={handleGCalSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
              GCal同期
            </button>
            <button
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <LogOut size={13} />
              ログアウト
            </button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-r">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <TaskList
                tasks={activeTasks}
                onAddNew={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                onEdit={(task) => {
                  setEditingTask(task);
                  setIsModalOpen(true);
                }}
                onDelete={handleDelete}
              />
              <WaitingLane
                tasks={waitingTasks}
                onBallBack={(taskId) => void handleUpdate(taskId, { ballHolder: 1 })}
              />
            </div>
          </aside>

          {/* Timeline */}
          <main className="flex-1 overflow-y-auto">
            <Timeline
              allTasks={[...activeTasks, ...waitingTasks]}
            />
          </main>
        </div>

        {/* Task Form Modal */}
        {isModalOpen && (
          <TaskFormModal
            task={editingTask}
            onSave={(data) => {
              if (editingTask) {
                void handleUpdate(editingTask.id, data);
              } else {
                void handleCreate(data);
              }
            }}
            onClose={() => {
              setIsModalOpen(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </DndContext>
  );
}
