"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Lock,
  CheckSquare,
  Square,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function scoreColor(score: number): string {
  if (!isFinite(score) || score > 3) return "bg-red-100 text-red-700";
  if (score > 1.5) return "bg-orange-100 text-orange-700";
  if (score > 0.5) return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
}

function scoreLabel(score: number): string {
  if (!isFinite(score)) return "期限超過";
  return score.toFixed(1);
}

export default function TaskCard({ task, onEdit, onDelete }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: task.isLocked,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const deadline = new Date(task.deadline);
  const remaining = formatDistanceToNow(deadline, { locale: ja, addSuffix: true });
  const isPastDeadline = deadline < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-3 text-card-foreground shadow-sm",
        isDragging && "opacity-50 shadow-lg",
        task.isLocked && "border-dashed opacity-75"
      )}
    >
      {/* Drag handle + title */}
      <div className="flex items-start gap-2">
        <div
          {...listeners}
          {...attributes}
          className={cn(
            "mt-0.5 flex-1 cursor-grab active:cursor-grabbing",
            task.isLocked && "cursor-default"
          )}
        >
          <div className="flex items-center gap-1.5">
            {task.isLocked && <Lock size={12} className="shrink-0 text-muted-foreground" />}
            <span className="text-sm font-medium leading-tight">{task.name}</span>
          </div>
        </div>

        {/* Score badge */}
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold",
            scoreColor(task.score)
          )}
        >
          {scoreLabel(task.score)}
        </span>
      </div>

      {/* Deadline */}
      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={cn(
            "text-xs",
            isPastDeadline ? "text-red-500 font-medium" : "text-muted-foreground"
          )}
        >
          {format(deadline, "M/d(EEE) HH:mm", { locale: ja })} · {remaining}
        </span>
        <span className="text-xs text-muted-foreground">
          {task.estimatedMinutes}分
        </span>
      </div>

      {/* Actions */}
      {!task.isLocked && (
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            サブタスク {task.subtasks.length > 0 ? `(${task.subtasks.length})` : ""}
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(task)}
              className="rounded p-1 hover:bg-accent"
              title="編集"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="削除"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Subtask list */}
      {isExpanded && task.subtasks.length > 0 && (
        <ul className="mt-2 space-y-1 border-t pt-2">
          {task.subtasks.map((st) => (
            <li key={st.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {st.isCompleted ? (
                <CheckSquare size={12} className="text-green-500" />
              ) : (
                <Square size={12} />
              )}
              <span className={cn(st.isCompleted && "line-through")}>
                {st.name}
              </span>
              <span className="ml-auto shrink-0">{st.estimatedMinutes}分</span>
            </li>
          ))}
        </ul>
      )}
      {isExpanded && task.subtasks.length === 0 && (
        <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
          サブタスクなし
        </p>
      )}
    </div>
  );
}
