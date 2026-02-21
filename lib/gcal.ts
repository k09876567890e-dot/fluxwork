import { google } from "googleapis";
import type { GCalEvent, CalendarSyncResult } from "@/types";

/**
 * アクセストークンから Google Calendar クライアントを生成する
 */
export function createCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

/**
 * 指定期間のカレンダーイベントを取得する
 */
export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date
): Promise<GCalEvent[]> {
  const calendar = createCalendarClient(accessToken);

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items ?? []) as GCalEvent[];
}

/**
 * カレンダーにイベントを作成する
 */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
  }
): Promise<string> {
  const calendar = createCalendarClient(accessToken);

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString(), timeZone: "Asia/Tokyo" },
      end: { dateTime: event.end.toISOString(), timeZone: "Asia/Tokyo" },
    },
  });

  if (!response.data.id) {
    throw new Error("Failed to create calendar event: no ID returned");
  }

  return response.data.id;
}

/**
 * カレンダーのイベントを削除する
 */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const calendar = createCalendarClient(accessToken);

  await calendar.events.delete({
    calendarId,
    eventId,
  });
}

/**
 * 同期結果の空オブジェクトを生成するヘルパー
 */
export function createEmptySyncResult(): CalendarSyncResult {
  return { imported: 0, exported: 0, conflicts: [] };
}
