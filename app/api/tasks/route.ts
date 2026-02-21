import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { recalcTaskScore } from "@/lib/scoring";
import type { ApiResponse, Task } from "@/types";

// GET /api/tasks — ユーザーのタスク一覧を取得
export async function GET(): Promise<NextResponse<ApiResponse<Task[]>>> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("user_id", session.user.email)
    .order("score", { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

// POST /api/tasks — 新規タスク作成
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Task>>> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Partial<Task>;
  const { name, deadline, notes, estimatedMinutes, leadTimeMinutes, ballHolder } = body;

  if (!name || !deadline || estimatedMinutes == null || leadTimeMinutes == null || ballHolder == null) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: name, deadline, estimatedMinutes, leadTimeMinutes, ballHolder" },
      { status: 400 }
    );
  }

  const score = recalcTaskScore({
    deadline: new Date(deadline),
    estimatedMinutes,
    leadTimeMinutes,
    ballHolder,
  });

  const db = createServiceClient();
  const { data, error } = await db
    .from("tasks")
    .insert({
      user_id: session.user.email,
      name,
      deadline,
      notes,
      estimated_minutes: estimatedMinutes,
      lead_time_minutes: leadTimeMinutes,
      ball_holder: ballHolder,
      score,
      is_locked: false,
    })
    .select("*, subtasks(*)")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
