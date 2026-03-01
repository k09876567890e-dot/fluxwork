import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIDecomposeRequest, AIDecomposeResponse } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `あなたは業務タスク分解の専門家です。
以下の入力から、具体的なサブタスクリストを生成してください。

出力形式（JSONのみ返すこと）:
{
  "subtasks": [
    {
      "name": "サブタスク名",
      "estimatedMinutes": 45,
      "isDelegatable": false,
      "dependsOnOthers": false
    }
  ],
  "totalMinutes": 120,
  "notes": "AIからの補足コメント（任意）"
}

制約:
- 見積もりは必ず15分刻みにすること
- 1サブタスクの最大時間は120分。それ以上になる場合はさらに分割すること
- 出力はJSONのみ。説明文・マークダウン記法は不要`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
  },
});

/**
 * Gemini API を使ってタスクをサブタスクに分解する
 */
export async function decomposeTask(
  request: AIDecomposeRequest
): Promise<AIDecomposeResponse> {
  const userMessage = `タスク名: ${request.taskName}
最終期限: ${request.deadline}
補足メモ: ${request.notes ?? "なし"}`;

  const result = await model.generateContent(userMessage);
  const parsed = JSON.parse(result.response.text()) as AIDecomposeResponse;
  return parsed;
}
