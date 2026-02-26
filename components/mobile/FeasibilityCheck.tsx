"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  activeTasks: Task[];
}

const DAILY_CAPACITY_MINUTES = 480; // 8時間

type FeasibilityStatus = "ok" | "tight" | "overloaded";

function getStatus(total: number): FeasibilityStatus {
  if (total <= DAILY_CAPACITY_MINUTES * 0.8) return "ok";   // ~384分
  if (total <= DAILY_CAPACITY_MINUTES) return "tight";       // ~480分
  return "overloaded";
}

const STATUS_CONFIG = {
  ok: {
    Icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    bar: "bg-green-500",
    label: "余裕あり",
  },
  tight: {
    Icon: Clock,
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-200",
    bar: "bg-orange-400",
    label: "タイト",
  },
  overloaded: {
    Icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50 border-red-200",
    bar: "bg-red-500",
    label: "破綻",
  },
} as const;

export default function FeasibilityCheck({ activeTasks }: Props) {
  // GCal固定ブロックも実時間を占有するため合計に含める
  const totalMinutes = activeTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const remaining = DAILY_CAPACITY_MINUTES - totalMinutes;
  const usedPercent = Math.min(100, Math.round((totalMinutes / DAILY_CAPACITY_MINUTES) * 100));

  const status = getStatus(totalMinutes);
  const { Icon, color, bg, bar, label } = STATUS_CONFIG[status];

  const nonLockedCount = activeTasks.filter((t) => !t.isLocked).length;
  const lockedCount = activeTasks.filter((t) => t.isLocked).length;

  return (
    <section className={cn("rounded-xl border p-4", bg)}>
      {/* ヘッダー */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">今日の余裕</h2>
        <div className={cn("flex items-center gap-1.5 text-sm font-medium", color)}>
          <Icon size={16} />
          {label}
        </div>
      </div>

      {/* プログレスバー */}
      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={cn("h-full rounded-full transition-all duration-300", bar)}
          style={{ width: `${usedPercent}%` }}
        />
      </div>

      {/* 数値 */}
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">
          合計{" "}
          <span className={cn("font-semibold", color)}>{totalMinutes}分</span>
          {" / "}
          {DAILY_CAPACITY_MINUTES}分（8時間）
        </span>
        <span className="text-muted-foreground">
          {remaining >= 0 ? (
            <>
              残り{" "}
              <span className="font-medium text-foreground">{remaining}分</span>
            </>
          ) : (
            <span className="font-medium text-red-500">{Math.abs(remaining)}分超過</span>
          )}
        </span>
      </div>

      {/* タスク件数 */}
      <p className="mt-1 text-xs text-muted-foreground">
        アクティブタスク {nonLockedCount} 件
        {lockedCount > 0 && <>（固定ブロック {lockedCount} 件含む）</>}
      </p>

      {/* 破綻時の警告メッセージ */}
      {status === "overloaded" && (
        <p className="mt-2 text-xs text-red-600">
          本日の予定が8時間を超えています。タスクを翌日以降に移すか、他者に委譲することを検討してください。
        </p>
      )}
    </section>
  );
}
