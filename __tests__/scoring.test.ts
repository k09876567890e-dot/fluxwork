import { describe, it, expect } from "vitest";
import { calcScore, sortTasksByScore } from "@/lib/scoring";
import type { Task } from "@/types";

// ============================================================
// calcScore
// ============================================================

describe("calcScore", () => {
  it("他者待ち(D=0)は 0 を返す", () => {
    expect(calcScore(10, 60, 30, 0)).toBe(0);
    expect(calcScore(0, 0, 0, 0)).toBe(0); // 期限切れでも D=0 なら 0
  });

  it("期限切れ(A<=0)かつ D=1 は Infinity を返す", () => {
    expect(calcScore(0, 60, 30, 1)).toBe(Infinity);
    expect(calcScore(-5, 60, 30, 1)).toBe(Infinity);
  });

  it("スコアを正しく計算する: (B+C)/A", () => {
    // A=24h, B=60min, C=30min → 90/24 = 3.75
    expect(calcScore(24, 60, 30, 1)).toBeCloseTo(3.75);
    // A=8h, B=120min, C=0min → 120/8 = 15
    expect(calcScore(8, 120, 0, 1)).toBeCloseTo(15);
    // A=1h, B=30min, C=30min → 60/1 = 60（タイトな締切）
    expect(calcScore(1, 30, 30, 1)).toBeCloseTo(60);
  });

  it("リードタイムが 0 でも正しく計算する", () => {
    expect(calcScore(10, 100, 0, 1)).toBeCloseTo(10);
  });

  it("作業量とリードタイムが両方 0 の場合はスコア 0", () => {
    expect(calcScore(10, 0, 0, 1)).toBe(0);
  });
});

// ============================================================
// sortTasksByScore
// ============================================================

describe("sortTasksByScore", () => {
  /** テスト用の最小 Task オブジェクトを生成 */
  const makeTask = (id: string, ballHolder: 0 | 1, score: number): Task =>
    ({ id, ballHolder, score } as unknown as Task);

  it("ballHolder=1 を activeTasks、ballHolder=0 を waitingTasks に分類する", () => {
    const tasks = [makeTask("a", 1, 5), makeTask("b", 0, 3)];
    const { activeTasks, waitingTasks } = sortTasksByScore(tasks);
    expect(activeTasks).toHaveLength(1);
    expect(activeTasks[0].id).toBe("a");
    expect(waitingTasks).toHaveLength(1);
    expect(waitingTasks[0].id).toBe("b");
  });

  it("activeTasks はスコア降順でソートされる", () => {
    const tasks = [
      makeTask("low", 1, 2),
      makeTask("high", 1, 10),
      makeTask("mid", 1, 5),
    ];
    const { activeTasks } = sortTasksByScore(tasks);
    expect(activeTasks.map((t) => t.id)).toEqual(["high", "mid", "low"]);
  });

  it("Infinity スコアのタスクが最上位になる", () => {
    const tasks = [
      makeTask("normal", 1, 5),
      makeTask("overdue", 1, Infinity),
    ];
    const { activeTasks } = sortTasksByScore(tasks);
    expect(activeTasks[0].id).toBe("overdue");
  });

  it("空リストを渡しても空を返す", () => {
    const { activeTasks, waitingTasks } = sortTasksByScore([]);
    expect(activeTasks).toHaveLength(0);
    expect(waitingTasks).toHaveLength(0);
  });

  it("全員 waiting の場合 activeTasks は空", () => {
    const tasks = [makeTask("a", 0, 0), makeTask("b", 0, 0)];
    const { activeTasks, waitingTasks } = sortTasksByScore(tasks);
    expect(activeTasks).toHaveLength(0);
    expect(waitingTasks).toHaveLength(2);
  });

  it("全員 active の場合 waitingTasks は空", () => {
    const tasks = [makeTask("a", 1, 3), makeTask("b", 1, 7)];
    const { activeTasks, waitingTasks } = sortTasksByScore(tasks);
    expect(waitingTasks).toHaveLength(0);
    expect(activeTasks).toHaveLength(2);
  });
});
