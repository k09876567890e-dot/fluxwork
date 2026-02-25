"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  topPx: number;
  heightPx: number;
}

function scoreColorClass(score: number): string {
  if (!isFinite(score) || score > 3) return "border-red-400 bg-red-50 text-red-700";
  if (score > 1.5) return "border-orange-300 bg-orange-50 text-orange-700";
  if (score > 0.5) return "border-yellow-300 bg-yellow-50 text-yellow-700";
  return "border-blue-300 bg-blue-50 text-blue-700";
}

export default function TimelineTask({ task, topPx, heightPx }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    top: topPx,
    height: Math.max(heightPx, 24),
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };

  const start = task.scheduledStart ? new Date(task.scheduledStart) : null;
  const end = task.scheduledEnd ? new Date(task.scheduledEnd) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "absolute left-1 right-1 cursor-grab overflow-hidden rounded border px-2 py-1 active:cursor-grabbing",
        scoreColorClass(task.score),
        isDragging && "opacity-50 shadow-lg"
      )}
      title={task.name}
    >
      <p className="truncate text-xs font-medium">{task.name}</p>
      {heightPx >= 40 && start && end && (
        <p className="mt-0.5 text-xs opacity-70">
          {format(start, "HH:mm", { locale: ja })}–{format(end, "HH:mm", { locale: ja })}
        </p>
      )}
    </div>
  );
}
