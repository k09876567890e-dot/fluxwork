import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase";
import { recalcTaskScore } from "@/lib/scoring";
import type { ApiResponse, Task, Subtask } from "@/types";

type SubtaskInput = Pick<Subtask, "name" | "estimatedMinutes" | "isDelegatable" | "dependsOnOthers"> & {
  isCompleted?: boolean;
};

interface PatchTaskBody extends Omit<Partial<Task>, "subtasks"> {
  subtasks?: SubtaskInput[];
}

type Params = { params: Promise<{ id: string }> };

// PATCH /api/tasks/:id — タスク更新
export async function PATCH(
  req: NextRequest,
  { params }: Params
): Promise<NextResponse<ApiResponse<Task>>> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as PatchTaskBody;

  const db = createServiceClient();

  // 既存タスクを取得してオーナー確認
  const { data: existing, error: fetchError } = await db
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.email)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
  }

  if (existing.is_locked) {
    return NextResponse.json(
      { success: false, error: "Cannot edit a locked task (Google Calendar import)" },
      { status: 403 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.deadline !== undefined) updateData.deadline = body.deadline;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.estimatedMinutes !== undefined) updateData.estimated_minutes = body.estimatedMinutes;
  if (body.leadTimeMinutes !== undefined) updateData.lead_time_minutes = body.leadTimeMinutes;
  if (body.ballHolder !== undefined) updateData.ball_holder = body.ballHolder;
  if (body.scheduledStart !== undefined) updateData.scheduled_start = body.scheduledStart;
  if (body.scheduledEnd !== undefined) updateData.scheduled_end = body.scheduledEnd;

  // スコア再計算
  const merged = {
    deadline: new Date(body.deadline ?? existing.deadline),
    estimatedMinutes: body.estimatedMinutes ?? existing.estimated_minutes,
    leadTimeMinutes: body.leadTimeMinutes ?? existing.lead_time_minutes,
    ballHolder: body.ballHolder ?? existing.ball_holder,
  };
  updateData.score = recalcTaskScore(merged);

  const { error: updateError } = await db
    .from("tasks")
    .update(updateData)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  // サブタスクの更新（指定された場合のみ）
  if (body.subtasks !== undefined) {
    await db.from("subtasks").delete().eq("task_id", id);
    if (body.subtasks.length > 0) {
      const subtaskRows = body.subtasks.map((s) => ({
        task_id: id,
        name: s.name,
        estimated_minutes: s.estimatedMinutes,
        is_delegatable: s.isDelegatable,
        depends_on_others: s.dependsOnOthers,
        is_completed: s.isCompleted ?? false,
      }));
      await db.from("subtasks").insert(subtaskRows);
    }
  }

  const { data, error } = await db
    .from("tasks")
    .select("*, subtasks(*)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

// DELETE /api/tasks/:id — タスク削除
export async function DELETE(
  _req: NextRequest,
  { params }: Params
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = createServiceClient();

  const { error } = await db
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.email);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { id } });
}
