"use client";

import { Lock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Task } from "@/types";

interface Props {
  task: Task;
  topPx: number;
  heightPx: number;
}

export default function TimeBlock({ task, topPx, heightPx }: Props) {
  const start = task.scheduledStart ? new Date(task.scheduledStart) : null;
  const end = task.scheduledEnd ? new Date(task.scheduledEnd) : null;

  return (
    <div
      style={{ top: topPx, height: Math.max(heightPx, 24) }}
      className="absolute left-1 right-1 overflow-hidden rounded border border-gray-300 bg-gray-100 px-2 py-1"
      title={task.name}
    >
      <div className="flex items-center gap-1">
        <Lock size={10} className="shrink-0 text-gray-400" />
        <span className="truncate text-xs font-medium text-gray-600">{task.name}</span>
      </div>
      {heightPx >= 40 && start && end && (
        <p className="mt-0.5 text-xs text-gray-400">
          {format(start, "HH:mm", { locale: ja })}–{format(end, "HH:mm", { locale: ja })}
        </p>
      )}
    </div>
  );
}
