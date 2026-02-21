// ============================================================
// タスク関連型定義
// ============================================================

export type BallHolder = 1 | 0; // 1=自分, 0=他者待ち

export interface Subtask {
  id: string;
  name: string;
  estimatedMinutes: number;
  isDelegatable: boolean;
  dependsOnOthers: boolean;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  deadline: Date;
  notes?: string;
  estimatedMinutes: number;    // B: 実作業ボリューム（分）
  leadTimeMinutes: number;     // C: 他者関与のリードタイム（分）
  ballHolder: BallHolder;      // D: ボールの所在
  score: number;               // calcScore の結果
  subtasks: Subtask[];
  gcalEventId?: string;        // Google Calendar イベントID
  isLocked: boolean;           // GCalインポートの固定ブロックはtrue
  scheduledStart?: Date;       // タイムライン配置時刻
  scheduledEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitingTask extends Task {
  ballHolder: 0;
  waitingFor: string;          // 誰待ちか
  waitingSince: Date;
}

// ============================================================
// Google Calendar 関連型定義
// ============================================================

export interface GCalEvent {
  id: string;
  summary: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
  description?: string;
}

export interface CalendarSyncResult {
  imported: number;
  exported: number;
  conflicts: ConflictItem[];
}

export interface ConflictItem {
  taskId: string;
  taskName: string;
  conflictType: "overlap" | "deleted_block";
  affectedSlot: { start: Date; end: Date };
}

// ============================================================
// AI 関連型定義
// ============================================================

export interface AIDecomposeRequest {
  taskName: string;
  deadline: string;   // ISO 8601
  notes?: string;
}

export interface AIDecomposeResponse {
  subtasks: Pick<Subtask, "name" | "estimatedMinutes" | "isDelegatable" | "dependsOnOthers">[];
  totalMinutes: number;
  notes?: string;
}

// ============================================================
// API レスポンス共通型
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
