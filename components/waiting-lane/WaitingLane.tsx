"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
  onBallBack: (taskId: string) => void;
}

export default function WaitingLane({ tasks, onBallBack }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <Clock size={13} />
          ウェイティングレーン
          {tasks.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal">
              {tasks.length}
            </span>
          )}
        </span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {isOpen && (
        <div className="mt-2">
          {tasks.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              他者待ちのタスクはありません
            </p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((task) => (
                <WaitingCard key={task.id} task={task} onBallBack={onBallBack} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function WaitingCard({ task, onBallBack }: { task: Task; onBallBack: (id: string) => void }) {
  const deadline = new Date(task.deadline);
  const isPast = deadline < new Date();

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{task.name}</p>
          <p
            className={cn(
              "mt-0.5 text-xs",
              isPast ? "text-red-500" : "text-muted-foreground"
            )}
          >
            期限: {format(deadline, "M/d HH:mm", { locale: ja })}
          </p>
        </div>
        <button
          onClick={() => onBallBack(task.id)}
          className="flex shrink-0 items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
          title="ボールが戻ってきた"
        >
          <ArrowRight size={11} />
          返却
        </button>
      </div>
    </div>
  );
}
