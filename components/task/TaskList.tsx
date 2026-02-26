"use client";

import { Plus } from "lucide-react";
import type { Task } from "@/types";
import TaskCard from "./TaskCard";

interface Props {
  tasks: Task[];
  onAddNew: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onAddNew, onEdit, onDelete }: Props) {
  // ロックされていないタスクのみサイドバーに表示
  const visibleTasks = tasks.filter((t) => !t.isLocked);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          アクティブ
          {visibleTasks.length > 0 && (
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
              {visibleTasks.length}
            </span>
          )}
        </h2>
        <button
          onClick={onAddNew}
          className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus size={12} />
          追加
        </button>
      </div>

      {visibleTasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          タスクがありません
        </p>
      ) : (
        <div className="space-y-2">
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
