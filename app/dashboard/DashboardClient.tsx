"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, RefreshCw, Calendar } from "lucide-react";

import { sortTasksByScore } from "@/lib/scoring";
import type { Task } from "@/types";
import TaskCard from "@/components/task/TaskCard";
import TaskInputModal from "@/components/task/TaskInputModal";
import WaitingLane from "@/components/waiting-lane/WaitingLane";
import Timeline from "@/components/timeline/Timeline";

// Supabase の snake_case レスポンスを Task 型にマッピング
function mapTask(raw: Record<string, unknown>): Task {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    name: raw.name as string,
    deadline: new Date(raw.deadline as string),
    notes: raw.notes as string | undefined,
    estimatedMinutes: raw.estimated_minutes as number,
    leadTimeMinutes: raw.lead_time_minutes as number,
    ballHolder: raw.ball_holder as 0 | 1,
    score: raw.score as number,
    subtasks: [],
    gcalEventId: raw.gcal_event_id as string | undefined,
    isLocked: raw.is_locked as boolean,
    scheduledStart: raw.scheduled_start
      ? new Date(raw.scheduled_start as string)
      : undefined,
    scheduledEnd: raw.scheduled_end
      ? new Date(raw.scheduled_end as string)
      : undefined,
    createdAt: new Date(raw.created_at as string),
    updatedAt: new Date(raw.updated_at as string),
  };
}

// ドラッグ可能なタスクカード
function DraggableCard({
  task,
  onDelete,
}: {
  task: Task;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id, disabled: task.isLocked });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} draggable={!task.isLocked} onDelete={onDelete} />
    </div>
  );
}

interface DashboardClientProps {
  userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success) {
        setTasks((json.data as Record<string, unknown>[]).map(mapTask));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const slotId = over.id as string; // "slot-{hour}-{minute}"
    const match = slotId.match(/^slot-(\d+)-(\d+)$/);
    if (!match) return;

    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.isLocked) return;

    const scheduledStart = new Date();
    scheduledStart.setHours(hour, minute, 0, 0);
    const scheduledEnd = new Date(
      scheduledStart.getTime() + task.estimatedMinutes * 60 * 1000
    );

    // 楽観的更新
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, scheduledStart, scheduledEnd } : t
      )
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledStart: scheduledStart.toISOString(),
          scheduledEnd: scheduledEnd.toISOString(),
        }),
      });
    } catch {
      fetchTasks(); // エラー時はリフレッシュ
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("このタスクを削除しますか？")) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch {
      fetchTasks();
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      await fetchTasks();
    } finally {
      setIsSyncing(false);
    }
  };

  const { activeTasks, waitingTasks } = sortTasksByScore(tasks);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <main className="min-h-screen p-6">
        {/* ヘッダー */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">FluxWork</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              {isSyncing ? "同期中..." : "GCal同期"}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black/80"
            >
              <Plus className="h-4 w-4" />
              タスクを追加
            </button>
            <span className="ml-2 text-sm text-muted-foreground">{userEmail}</span>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            読み込み中...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* タイムライン */}
            <section className="rounded-lg border p-4">
              <h2 className="mb-4 text-sm font-semibold">タイムライン</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                タスクリストからドラッグ&amp;ドロップして配置
              </p>
              <Timeline tasks={tasks} />
            </section>

            {/* サイドパネル */}
            <div className="space-y-4">
              {/* タスクリスト（スコア順） */}
              <section className="rounded-lg border p-4">
                <h2 className="mb-3 text-sm font-semibold">
                  タスクリスト ({activeTasks.length})
                </h2>
                {activeTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    タスクがありません。右上から追加してください。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeTasks.map((task) => (
                      <DraggableCard
                        key={task.id}
                        task={task}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* ウェイティングレーン */}
              <WaitingLane tasks={waitingTasks} />
            </div>
          </div>
        )}
      </main>

      {isModalOpen && (
        <TaskInputModal
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchTasks();
          }}
        />
      )}
    </DndContext>
  );
}
