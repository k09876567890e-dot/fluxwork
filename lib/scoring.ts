import type { Task, BallHolder } from "@/types";

/**
 * 優先順位スコアを計算する
 *
 * @param A - 納期までの時間（時間単位）
 * @param B - 実作業ボリューム（分単位）
 * @param C - 他者関与のリードタイム（分単位）
 * @param D - ボールの所在（1=自分, 0=他者待ち）
 * @returns スコア（高いほど優先度が高い）。D=0 の場合は 0 を返す
 */
export function calcScore(
  A: number,
  B: number,
  C: number,
  D: BallHolder
): number {
  if (D === 0) return 0; // 他者待ちはウェイティングレーンへ退避
  if (A <= 0) return Infinity; // 期限切れは最高優先
  return (B + C) / A;
}

/**
 * タスクのスコアを再計算する
 */
export function recalcTaskScore(task: Pick<Task, "deadline" | "estimatedMinutes" | "leadTimeMinutes" | "ballHolder">): number {
  const now = new Date();
  const deadlineHours = (task.deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  return calcScore(
    deadlineHours,
    task.estimatedMinutes,
    task.leadTimeMinutes,
    task.ballHolder
  );
}

/**
 * タスクリストをスコア降順でソートする
 * D=0 のタスク（ウェイティングレーン行き）は除外する
 */
export function sortTasksByScore(tasks: Task[]): {
  activeTasks: Task[];
  waitingTasks: Task[];
} {
  const activeTasks = tasks
    .filter((t) => t.ballHolder === 1)
    .sort((a, b) => b.score - a.score);

  const waitingTasks = tasks.filter((t) => t.ballHolder === 0);

  return { activeTasks, waitingTasks };
}
