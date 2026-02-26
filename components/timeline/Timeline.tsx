"use client";

import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Task } from "@/types";
import TimelineTask from "./TimelineTask";
import TimeBlock from "./TimeBlock";
import { cn } from "@/lib/utils";

interface Props {
  allTasks: Task[];
}

const TIMELINE_START_HOUR = 8;  // 8am
const TIMELINE_END_HOUR = 22;   // 10pm
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 56;      // height per 30-min slot

function minutesToTop(date: Date): number {
  const mins = (date.getHours() - TIMELINE_START_HOUR) * 60 + date.getMinutes();
  return (mins / SLOT_MINUTES) * SLOT_HEIGHT_PX;
}

function durationToHeight(minutes: number): number {
  return (minutes / SLOT_MINUTES) * SLOT_HEIGHT_PX;
}

const TIME_SLOTS = Array.from(
  { length: ((TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60) / SLOT_MINUTES },
  (_, i) => {
    const totalMinutes = i * SLOT_MINUTES;
    const hours = TIMELINE_START_HOUR + Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return {
      id: `slot-${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
      hours,
      minutes,
      label: minutes === 0 ? `${String(hours).padStart(2, "0")}:00` : null,
    };
  }
);

function TimeSlot({ slot }: { slot: (typeof TIME_SLOTS)[number] }) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

  return (
    <div
      ref={setNodeRef}
      style={{ height: SLOT_HEIGHT_PX }}
      className={cn(
        "border-b border-dashed border-border/50 transition-colors",
        slot.minutes === 0 && "border-border",
        isOver && "bg-primary/5"
      )}
    />
  );
}

export default function Timeline({ allTasks }: Props) {
  const today = new Date();
  const todayStr = today.toDateString();

  // 今日の日付でスケジュール済みのタスクを抽出
  const scheduledTasks = allTasks.filter(
    (t) =>
      t.scheduledStart &&
      new Date(t.scheduledStart).toDateString() === todayStr
  );

  const totalHeight = TIME_SLOTS.length * SLOT_HEIGHT_PX;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-semibold">タイムライン</h2>
        <span className="text-sm text-muted-foreground">
          {format(today, "M月d日(EEE)", { locale: ja })}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          タスクをここにドロップしてスケジュール
        </span>
      </div>

      {/* Grid */}
      <div className="flex">
        {/* Time labels column */}
        <div className="w-14 shrink-0">
          {TIME_SLOTS.map((slot) => (
            <div
              key={slot.id}
              style={{ height: SLOT_HEIGHT_PX }}
              className="flex items-start justify-end pr-2 pt-0.5"
            >
              {slot.label && (
                <span className="text-xs text-muted-foreground">{slot.label}</span>
              )}
            </div>
          ))}
        </div>

        {/* Droppable slots + scheduled blocks */}
        <div className="relative flex-1" style={{ height: totalHeight }}>
          {/* Slot rows */}
          {TIME_SLOTS.map((slot) => (
            <TimeSlot key={slot.id} slot={slot} />
          ))}

          {/* Scheduled task blocks (absolute positioned) */}
          {scheduledTasks.map((task) => {
            const start = new Date(task.scheduledStart!);
            const topPx = minutesToTop(start);
            const heightPx = durationToHeight(task.estimatedMinutes);

            return task.isLocked ? (
              <TimeBlock
                key={task.id}
                task={task}
                topPx={topPx}
                heightPx={heightPx}
              />
            ) : (
              <TimelineTask
                key={task.id}
                task={task}
                topPx={topPx}
                heightPx={heightPx}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
