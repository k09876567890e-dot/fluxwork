"use client";

import { Task } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Lock, Clock, ChevronRight, Trash2 } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  draggable?: boolean;
}

function getUrgencyStyle(score: number) {
  if (!isFinite(score) && score > 0)
    return { border: "border-red-500", bg: "bg-red-50", badge: "bg-red-500 text-white", label: "期限切れ" };
  if (score > 0.5)
    return { border: "border-orange-400", bg: "bg-orange-50", badge: "bg-orange-400 text-white", label: "緊急" };
  if (score > 0.1)
    return { border: "border-yellow-400", bg: "bg-yellow-50", badge: "bg-yellow-400 text-white", label: "要注意" };
  return { border: "border-green-400", bg: "bg-green-50", badge: "bg-green-500 text-white", label: "余裕あり" };
}

export default function TaskCard({ task, onEdit, onDelete, draggable }: TaskCardProps) {
  const urgency = getUrgencyStyle(task.score);
  const deadlineText = formatDistanceToNow(new Date(task.deadline), {
    addSuffix: true,
    locale: ja,
  });

  return (
    <div
      className={`relative rounded-lg border-l-4 p-3 shadow-sm ${urgency.border} ${urgency.bg} ${draggable ? "cursor-grab active:cursor-grabbing" : ""} transition-shadow hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${urgency.badge}`}>
              {urgency.label}
            </span>
            {task.isLocked && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                GCal
              </span>
            )}
          </div>
          <p className="truncate text-sm font-medium leading-snug">{task.name}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes}分
            </span>
            <span>{deadlineText}</span>
          </div>
        </div>

        {!task.isLocked && (
          <div className="flex shrink-0 items-center gap-0.5">
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="rounded p-1 hover:bg-black/5"
                aria-label="編集"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="rounded p-1 hover:bg-red-50"
                aria-label="削除"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
