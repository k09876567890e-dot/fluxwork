import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchCalendarEvents, createEmptySyncResult } from "@/lib/gcal";
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

  return NextResponse.json({ success: true, data: result });
}
