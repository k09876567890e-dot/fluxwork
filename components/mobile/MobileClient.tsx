"use client";

import { useState } from "react";
import { LogOut, Plus } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Task, BallHolder } from "@/types";
import { sortTasksByScore } from "@/lib/scoring";
import { mapTaskRow } from "@/lib/mappers";
import MobileTaskForm from "./MobileTaskForm";
import FeasibilityCheck from "./FeasibilityCheck";
import MobileWaitingLane from "./MobileWaitingLane";

interface Props {
  initialActiveTasks: Task[];
  initialWaitingTasks: Task[];
  userEmail: string;
}

interface CreateData {
  name: string;
  deadline: string;
  notes?: string;
  estimatedMinutes: number;
  leadTimeMinutes: number;
  ballHolder: BallHolder;
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

export default function MobileClient({
  initialActiveTasks,
  initialWaitingTasks,
  userEmail,
}: Props) {
  const [activeTasks, setActiveTasks] = useState<Task[]>(initialActiveTasks);
  const [waitingTasks, setWaitingTasks] = useState<Task[]>(initialWaitingTasks);
  const [isCreating, setIsCreating] = useState(false);

  function allTasks() {
    return [...activeTasks, ...waitingTasks];
  }

  async function handleCreate(data: CreateData) {
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
    setIsCreating(false);
  }

  async function handleBallBack(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ballHolder: 1 }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    if (json.success) {
      const updated = mapTaskRow(json.data);
      rebuildLists(
        allTasks().map((t) => (t.id === taskId ? updated : t)),
        setActiveTasks,
        setWaitingTasks
      );
    }
  }

  return (
    <main className="min-h-screen bg-background pb-10">
      {/* ヘッダー */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h1 className="text-xl font-bold">FluxWork</h1>
        <div className="flex items-center gap-2">
          <span className="max-w-[120px] truncate text-xs text-muted-foreground">
            {userEmail}
          </span>
          <button
            onClick={() => void signOut({ callbackUrl: "/" })}
            className="rounded-md border p-1.5 hover:bg-accent"
            title="ログアウト"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <div className="space-y-4 p-4">
        {/* タスク追加セクション */}
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">タスクを追加</h2>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus size={13} />
                新規
              </button>
            )}
          </div>
          {isCreating ? (
            <MobileTaskForm
              onSave={handleCreate}
              onCancel={() => setIsCreating(false)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              「新規」ボタンでタスクを追加できます
            </p>
          )}
        </section>

        {/* 破綻判定 */}
        <FeasibilityCheck activeTasks={activeTasks} />

        {/* ウェイティングレーン */}
        <MobileWaitingLane
          tasks={waitingTasks}
          onBallBack={handleBallBack}
        />
      </div>
    </main>
  );
}
