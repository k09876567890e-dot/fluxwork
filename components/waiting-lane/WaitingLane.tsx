"use client";

import { Task } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock } from "lucide-react";

interface WaitingLaneProps {
  tasks: Task[];
}

export default function WaitingLane({ tasks }: WaitingLaneProps) {
  return (
    <section className="rounded-lg border border-dashed p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Clock className="h-4 w-4" />
        他者待ち ({tasks.length})
      </h2>
      {tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground">待ちタスクはありません</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-md bg-gray-50 px-3 py-2 text-sm"
            >
              <p className="truncate font-medium">{task.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                期限: {formatDistanceToNow(new Date(task.deadline), { addSuffix: true, locale: ja })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
