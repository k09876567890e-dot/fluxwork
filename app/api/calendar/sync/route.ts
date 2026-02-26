import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchCalendarEvents, createCalendarEvent, createEmptySyncResult } from "@/lib/gcal";
import { createServiceClient } from "@/lib/supabase";
import type { ApiResponse, CalendarSyncResult } from "@/types";

// POST /api/calendar/sync — Google Calendar との同期
export async function POST(): Promise<NextResponse<ApiResponse<CalendarSyncResult>>> {
  const session = await auth();
  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ success: false, error: "Unauthorized or missing Google token" }, { status: 401 });
  }

  const result = createEmptySyncResult();
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // GCal から固定ブロックをインポート
  const events = await fetchCalendarEvents(
    session.accessToken,
    "primary",
    now,
    twoWeeksLater
  );

  const db = createServiceClient();

  for (const event of events) {
    const startStr = "dateTime" in event.start ? event.start.dateTime : event.start.date;
    const endStr = "dateTime" in event.end ? event.end.dateTime : event.end.date;

    // 既存レコードの確認
    const { data: existing } = await db
      .from("tasks")
      .select("id")
      .eq("gcal_event_id", event.id)
      .eq("user_id", session.user!.email)
      .maybeSingle();

    if (!existing) {
      await db.from("tasks").insert({
        user_id: session.user!.email,
        name: event.summary ?? "（タイトルなし）",
        deadline: endStr,
        scheduled_start: startStr,
        scheduled_end: endStr,
        gcal_event_id: event.id,
        is_locked: true,
        ball_holder: 1,
        estimated_minutes: 0,
        lead_time_minutes: 0,
        score: 0,
      });
      result.imported++;
    }
  }

  // App → GCal エクスポート
  // scheduled_start/end があり、gcal_event_id がなく、is_locked=false のタスクを書き出す
  const { data: exportCandidates, error: exportQueryError } = await db
    .from("tasks")
    .select("id, name, notes, scheduled_start, scheduled_end")
    .eq("user_id", session.user!.email)
    .eq("is_locked", false)
    .not("scheduled_start", "is", null)
    .not("scheduled_end", "is", null)
    .is("gcal_event_id", null);

  if (!exportQueryError && exportCandidates) {
    for (const task of exportCandidates) {
      try {
        const eventId = await createCalendarEvent(
          session.accessToken,
          "primary",
          {
            summary: task.name as string,
            description: (task.notes as string | null) ?? undefined,
            start: new Date(task.scheduled_start as string),
            end: new Date(task.scheduled_end as string),
          }
        );
        await db
          .from("tasks")
          .update({ gcal_event_id: eventId })
          .eq("id", task.id as string);
        result.exported++;
      } catch {
        // 個別失敗はスキップ（他のエクスポートをブロックしない）
      }
    }
  }

  return NextResponse.json({ success: true, data: result });
}
