"use client";

import { useDroppable } from "@dnd-kit/core";
import { Task } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const START_HOUR = 8;
const END_HOUR = 22;

// タスクをタイムラインスロットに表示するブロック
function ScheduledBlock({ task }: { task: Task }) {
  const start = new Date(task.scheduledStart!);
  const minuteOffset = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
  const topPx = (minuteOffset / 30) * 32; // 30分 = 32px
  const heightPx = Math.max((task.estimatedMinutes / 30) * 32, 28);

  const colorClass = task.isLocked
    ? "bg-gray-400 text-white"
    : "bg-blue-500 text-white";

  return (
    <div
      className={`absolute left-0 right-1 rounded px-2 py-0.5 text-xs font-medium overflow-hidden ${colorClass}`}
      style={{ top: topPx, height: heightPx }}
      title={task.name}
    >
      <span className="block truncate">{task.name}</span>
      <span className="opacity-75">{task.estimatedMinutes}分</span>
    </div>
  );
}

// 30分スロット（ドロップゾーン）
function TimeSlot({
  hour,
  minute,
  isHalfHour,
}: {
  hour: number;
  minute: number;
  isHalfHour: boolean;
}) {
  const id = `slot-${hour}-${minute}`;
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-8 items-start border-gray-100 transition-colors ${
        isHalfHour ? "border-b border-dashed" : "border-b"
      } ${isOver ? "bg-blue-50" : ""}`}
    >
      <span className="w-14 shrink-0 pr-2 pt-0.5 text-right text-xs text-muted-foreground">
        {!isHalfHour ? `${hour}:00` : ""}
      </span>
      <div className="flex-1" />
    </div>
  );
}

interface TimelineProps {
  tasks: Task[];
}

export default function Timeline({ tasks }: TimelineProps) {
  // scheduledStart があるタスクをタイムラインに表示
  const scheduledTasks = tasks.filter(
    (t) => t.scheduledStart && new Date(t.scheduledStart).getHours() >= START_HOUR
  );

  const slots: { hour: number; minute: number; isHalfHour: boolean }[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push({ hour: h, minute: 0, isHalfHour: false });
    slots.push({ hour: h, minute: 30, isHalfHour: true });
  }

  const totalSlots = (END_HOUR - START_HOUR) * 2; // 28 slots × 32px

  return (
    <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
      <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">
        {format(new Date(), "M月d日（E）", { locale: ja })}のスケジュール
      </p>
      <div className="relative">
        {/* スロット */}
        {slots.map(({ hour, minute, isHalfHour }) => (
          <TimeSlot
            key={`${hour}-${minute}`}
            hour={hour}
            minute={minute}
            isHalfHour={isHalfHour}
          />
        ))}

        {/* 配置済みタスクブロック（スロットの上にオーバーレイ） */}
        <div
          className="pointer-events-none absolute left-14 right-0 top-0"
          style={{ height: totalSlots * 32 }}
        >
          {scheduledTasks.map((task) => (
            <ScheduledBlock key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}
