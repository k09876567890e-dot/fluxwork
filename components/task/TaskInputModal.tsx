"use client";

import { useState } from "react";
import { X, Sparkles, Plus, Trash2 } from "lucide-react";
import type { AIDecomposeResponse } from "@/types";

interface SubtaskDraft {
  name: string;
  estimatedMinutes: number;
  isDelegatable: boolean;
  dependsOnOthers: boolean;
}

interface TaskInputModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskInputModal({ onClose, onSaved }: TaskInputModalProps) {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [aiNotes, setAiNotes] = useState("");
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleDecompose = async () => {
    if (!name || !deadline) {
      setError("タスク名と期限は必須です");
      return;
    }
    setError("");
    setIsDecomposing(true);
    try {
      const res = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: name, deadline, notes }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as AIDecomposeResponse;
        setSubtasks(data.subtasks);
        if (data.notes) setAiNotes(data.notes);
      } else {
        setError(json.error ?? "AI分解に失敗しました");
      }
    } catch {
      setError("AI分解中にエラーが発生しました");
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleSave = async () => {
    if (!name || !deadline) {
      setError("タスク名と期限は必須です");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const estimatedMinutes =
        subtasks.length > 0
          ? subtasks.reduce((s, t) => s + t.estimatedMinutes, 0)
          : 60;
      const leadTimeMinutes = subtasks
        .filter((s) => s.dependsOnOthers)
        .reduce((s, t) => s + t.estimatedMinutes, 0);

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          deadline: new Date(deadline).toISOString(),
          notes,
          estimatedMinutes,
          leadTimeMinutes,
          ballHolder: 1,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onSaved();
      } else {
        setError(json.error ?? "保存に失敗しました");
      }
    } catch {
      setError("保存中にエラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSubtask = (i: number, patch: Partial<SubtaskDraft>) => {
    setSubtasks((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* ヘッダー */}
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-lg font-semibold">タスクを追加</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* フォーム */}
        <div className="space-y-4 p-6">
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-500">{error}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">タスク名 *</label>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：四半期報告書の作成"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">期限 *</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">補足メモ</label>
            <textarea
              className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="関係者・依存関係など"
            />
          </div>

          <button
            onClick={handleDecompose}
            disabled={isDecomposing || !name || !deadline}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isDecomposing ? "AIが分解中..." : "AIでサブタスクに分解"}
          </button>

          {subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  サブタスク（合計 {subtasks.reduce((s, t) => s + t.estimatedMinutes, 0)}分）
                </p>
                <button
                  onClick={() =>
                    setSubtasks([
                      ...subtasks,
                      { name: "", estimatedMinutes: 15, isDelegatable: false, dependsOnOthers: false },
                    ])
                  }
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  追加
                </button>
              </div>
              {aiNotes && (
                <p className="rounded bg-gray-50 px-2 py-1 text-xs text-muted-foreground">{aiNotes}</p>
              )}
              {subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
                    value={st.name}
                    onChange={(e) => updateSubtask(i, { name: e.target.value })}
                    placeholder="サブタスク名"
                  />
                  <select
                    className="rounded border bg-white px-1 py-0.5 text-xs"
                    value={st.estimatedMinutes}
                    onChange={(e) => updateSubtask(i, { estimatedMinutes: Number(e.target.value) })}
                  >
                    {[15, 30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>{m}分</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSubtasks(subtasks.filter((_, j) => j !== i))}
                    className="rounded p-0.5 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 flex gap-3 border-t bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name || !deadline}
            className="flex-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
