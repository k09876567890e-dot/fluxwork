import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { recalcTaskScore } from "@/lib/scoring";
import type { ApiResponse, Task, Subtask } from "@/types";

type SubtaskInput = Pick<Subtask, "name" | "estimatedMinutes" | "isDelegatable" | "dependsOnOthers">;

interface CreateTaskBody {
  name: string;
  deadline: string;
  notes?: string;
  estimatedMinutes: number;
  leadTimeMinutes: number;
  ballHolder: 0 | 1;
  subtasks?: SubtaskInput[];
}

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

  const body = await req.json() as CreateTaskBody;
  const { name, deadline, notes, estimatedMinutes, leadTimeMinutes, ballHolder, subtasks } = body;

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
  const { data: task, error } = await db
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
    .select("*")
    .single();

  if (error || !task) {
    return NextResponse.json({ success: false, error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  // サブタスクの挿入
  if (subtasks && subtasks.length > 0) {
    const subtaskRows = subtasks.map((s) => ({
      task_id: task.id as string,
      name: s.name,
      estimated_minutes: s.estimatedMinutes,
      is_delegatable: s.isDelegatable,
      depends_on_others: s.dependsOnOthers,
      is_completed: false,
    }));
    await db.from("subtasks").insert(subtaskRows);
  }

  // サブタスク込みで再取得
  const { data, error: fetchError } = await db
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("id", task.id as string)
    .single();

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
