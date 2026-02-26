"use client";

import { Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  onBallBack: (taskId: string) => Promise<void>;
}

export default function MobileWaitingLane({ tasks, onBallBack }: Props) {
  return (
    <section className="rounded-xl border border-dashed p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Clock size={15} className="text-muted-foreground" />
        <h2 className="font-semibold text-muted-foreground">他者待ち</h2>
        {tasks.length > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">
          他者待ちのタスクはありません
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <MobileWaitingCard key={task.id} task={task} onBallBack={onBallBack} />
          ))}
        </div>
      )}
    </section>
  );
}

function MobileWaitingCard({
  task,
  onBallBack,
}: {
  task: Task;
  onBallBack: (taskId: string) => Promise<void>;
}) {
  const deadline = new Date(task.deadline);
  const isPast = deadline < new Date();

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.name}</p>
        <p className={cn("mt-0.5 text-xs", isPast ? "text-red-500" : "text-muted-foreground")}>
          期限: {format(deadline, "M/d(EEE) HH:mm", { locale: ja })}
        </p>
      </div>
      <button
        onClick={() => void onBallBack(task.id)}
        className="flex shrink-0 items-center gap-1 rounded-md bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
      >
        <ArrowRight size={12} />
        返却
      </button>
    </div>
  );
}
