import type { Task, Subtask, BallHolder } from "@/types";

export function mapSubtaskRow(row: Record<string, unknown>): Subtask {
  return {
    id: row.id as string,
    name: row.name as string,
    estimatedMinutes: row.estimated_minutes as number,
    isDelegatable: row.is_delegatable as boolean,
    dependsOnOthers: row.depends_on_others as boolean,
    isCompleted: row.is_completed as boolean,
  };
}

export function mapTaskRow(row: Record<string, unknown>): Task {
  const subtaskRows = (row.subtasks ?? []) as Record<string, unknown>[];
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    deadline: new Date(row.deadline as string),
    notes: (row.notes as string) ?? undefined,
    estimatedMinutes: row.estimated_minutes as number,
    leadTimeMinutes: row.lead_time_minutes as number,
    ballHolder: row.ball_holder as BallHolder,
    score: Number(row.score),
    subtasks: subtaskRows.map(mapSubtaskRow),
    gcalEventId: (row.gcal_event_id as string) ?? undefined,
    isLocked: row.is_locked as boolean,
    scheduledStart: row.scheduled_start
      ? new Date(row.scheduled_start as string)
      : undefined,
    scheduledEnd: row.scheduled_end
      ? new Date(row.scheduled_end as string)
      : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
