import { describe, it, expect } from "vitest";
import { getWorkingDays, formatMinutes, allocateSubtasks } from "@/lib/schedule";

// ============================================================
// getWorkingDays
// ============================================================

describe("getWorkingDays", () => {
  it("月〜金のみを返し、土日を除外する", () => {
    // 2026-02-23(月) 〜 2026-03-01(日) = 月・火・水・木・金 の 5日
    const from = new Date("2026-02-23T00:00:00");
    const to = new Date("2026-03-01T00:00:00");
    const days = getWorkingDays(from, to);
    expect(days).toHaveLength(5);
    for (const d of days) {
      expect(d.getDay()).not.toBe(0); // 日曜NG
      expect(d.getDay()).not.toBe(6); // 土曜NG
    }
  });

  it("from と to が同じ平日（月曜）の場合 1 日を返す", () => {
    const d = new Date("2026-02-23T00:00:00"); // 月曜
    expect(getWorkingDays(d, d)).toHaveLength(1);
  });

  it("from と to が同じ土曜の場合 0 日を返す", () => {
    const d = new Date("2026-02-28T00:00:00"); // 土曜
    expect(getWorkingDays(d, d)).toHaveLength(0);
  });

  it("from と to が同じ日曜の場合 0 日を返す", () => {
    const d = new Date("2026-03-01T00:00:00"); // 日曜
    expect(getWorkingDays(d, d)).toHaveLength(0);
  });

  it("週をまたいだ 2 週間分で 10 営業日を返す", () => {
    const from = new Date("2026-02-23T00:00:00"); // 月曜
    const to = new Date("2026-03-06T00:00:00");   // 金曜
    const days = getWorkingDays(from, to);
    expect(days).toHaveLength(10);
  });
});

// ============================================================
// formatMinutes
// ============================================================

describe("formatMinutes", () => {
  it("60 分未満は「N分」表示", () => {
    expect(formatMinutes(1)).toBe("1分");
    expect(formatMinutes(30)).toBe("30分");
    expect(formatMinutes(59)).toBe("59分");
  });

  it("ちょうど 60 分は「1時間」表示", () => {
    expect(formatMinutes(60)).toBe("1時間");
  });

  it("ちょうど 120 分は「2時間」表示", () => {
    expect(formatMinutes(120)).toBe("2時間");
  });

  it("時間と分が混在する場合は「X時間Y分」表示", () => {
    expect(formatMinutes(90)).toBe("1時間30分");
    expect(formatMinutes(75)).toBe("1時間15分");
    expect(formatMinutes(125)).toBe("2時間5分");
  });
});

// ============================================================
// allocateSubtasks
// ============================================================

describe("allocateSubtasks", () => {
  /** 現在から N 日後の ISO 文字列を返すヘルパー */
  function daysLater(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString();
  }

  it("サブタスクが 1 つの場合、1 ブロックを返す", () => {
    const result = allocateSubtasks(
      [{ name: "作業A", estimatedMinutes: 60 }],
      8,
      daysLater(7)
    );
    expect(result.allBlocks).toHaveLength(1);
    expect(result.allBlocks[0].name).toBe("作業A");
    expect(result.allBlocks[0].estimatedMinutes).toBe(60);
  });

  it("空のサブタスクリストは空の結果を返す", () => {
    const result = allocateSubtasks([], 8, daysLater(7));
    expect(result.allBlocks).toHaveLength(0);
    expect(result.dayPlans).toHaveLength(0);
    expect(result.fitsInDeadline).toBe(true);
  });

  it("1 日の容量（5h=300min）を超えた場合は翌営業日に分割される", () => {
    // A=300min, B=200min → A は 1 日目に収まる、B は超過するので 2 日目へ
    const result = allocateSubtasks(
      [
        { name: "A", estimatedMinutes: 300 },
        { name: "B", estimatedMinutes: 200 },
      ],
      5, // 1日5時間=300分
      daysLater(14)
    );
    expect(result.dayPlans.length).toBeGreaterThanOrEqual(2);
    expect(result.allBlocks).toHaveLength(2);
  });

  it("allBlocks の scheduledStart < scheduledEnd が保証される", () => {
    const result = allocateSubtasks(
      [
        { name: "X", estimatedMinutes: 30 },
        { name: "Y", estimatedMinutes: 45 },
      ],
      8,
      daysLater(7)
    );
    for (const block of result.allBlocks) {
      expect(new Date(block.scheduledStart).getTime()).toBeLessThan(
        new Date(block.scheduledEnd).getTime()
      );
    }
  });

  it("全ブロックの estimatedMinutes 合計が入力と一致する", () => {
    const subtasks = [
      { name: "A", estimatedMinutes: 60 },
      { name: "B", estimatedMinutes: 45 },
      { name: "C", estimatedMinutes: 90 },
    ];
    const result = allocateSubtasks(subtasks, 8, daysLater(7));
    const totalMinutes = result.allBlocks.reduce(
      (sum, b) => sum + b.estimatedMinutes,
      0
    );
    expect(totalMinutes).toBe(195);
  });
});
