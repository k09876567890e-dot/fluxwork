import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { decomposeTask } from "@/lib/ai-prompt";
import type { ApiResponse, AIDecomposeRequest, AIDecomposeResponse } from "@/types";

// POST /api/ai/decompose — Gemini API でタスクをサブタスクに分解
export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AIDecomposeResponse>>> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as AIDecomposeRequest;
  const { taskName, deadline, notes } = body;

  if (!taskName || !deadline) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: taskName, deadline" },
      { status: 400 }
    );
  }

  const result = await decomposeTask({ taskName, deadline, notes });
  return NextResponse.json({ success: true, data: result });
}
