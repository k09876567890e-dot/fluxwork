"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import type { Task, Subtask } from "@/types";
import type { TaskFormData } from "@/components/dashboard/DashboardClient";
import SubtaskPanel from "./SubtaskPanel";
import { cn } from "@/lib/utils";

type SubtaskDraft = Pick<Subtask, "name" | "estimatedMinutes" | "isDelegatable" | "dependsOnOthers">;

interface Props {
  task: Task | null;
  onSave: (data: TaskFormData) => void;
  onClose: () => void;
}

function toLocalDatetimeStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskFormModal({ task, onSave, onClose }: Props) {
  const isEdit = task !== null;

  const [name, setName] = useState(task?.name ?? "");
  const [deadline, setDeadline] = useState(
    task ? toLocalDatetimeStr(new Date(task.deadline)) : ""
  );
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task?.estimatedMinutes ?? 30
  );
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(
    task?.leadTimeMinutes ?? 0
  );
  const [ballHolder, setBallHolder] = useState<0 | 1>(task?.ballHolder ?? 1);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>(
    task?.subtasks.map((s) => ({
      name: s.name,
      estimatedMinutes: s.estimatedMinutes,
      isDelegatable: s.isDelegatable,
      dependsOnOthers: s.dependsOnOthers,
    })) ?? []
  );
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleDecompose() {
    if (!name || !deadline) return;
    setIsDecomposing(true);
    try {
      const res = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: name, deadline, notes }),
      });
      if (!res.ok) return;
      const json = (await res.json()) as {
        success: boolean;
        data: {
          subtasks: SubtaskDraft[];
          totalMinutes: number;
        };
      };
      if (json.success) {
        setSubtasks(json.data.subtasks);
        setEstimatedMinutes(json.data.totalMinutes);
      }
    } finally {
      setIsDecomposing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !deadline) return;
    setIsSaving(true);
    try {
      onSave({
        name,
        deadline: new Date(deadline).toISOString(),
        notes: notes || undefined,
        estimatedMinutes,
        leadTimeMinutes,
        ballHolder,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">
            {isEdit ? "タスクを編集" : "タスクを追加"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                タスク名 <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="タスク名を入力"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                期限 <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-sm font-medium">補足メモ</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="追加情報があれば記入"
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Estimated / Lead time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">実作業見積もり（分）</label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  min={15}
                  step={15}
                  onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 15)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">他者リードタイム（分）</label>
                <input
                  type="number"
                  value={leadTimeMinutes}
                  min={0}
                  step={15}
                  onChange={(e) => setLeadTimeMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Ball holder */}
            <div>
              <label className="mb-1 block text-sm font-medium">ボール所在</label>
              <div className="flex gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="ballHolder"
                    value="1"
                    checked={ballHolder === 1}
                    onChange={() => setBallHolder(1)}
                  />
                  自分（実行可能）
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="ballHolder"
                    value="0"
                    checked={ballHolder === 0}
                    onChange={() => setBallHolder(0)}
                  />
                  他者待ち
                </label>
              </div>
            </div>

            {/* AI Decompose */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">
                  サブタスク
                  {subtasks.length > 0 && (
                    <span className="ml-1.5 text-muted-foreground">({subtasks.length}件)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={handleDecompose}
                  disabled={isDecomposing || !name || !deadline}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                    "bg-violet-100 text-violet-700 hover:bg-violet-200",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  <Sparkles size={12} />
                  AI分解
                </button>
              </div>
              <SubtaskPanel
                subtasks={subtasks}
                onChange={setSubtasks}
                isLoading={isDecomposing}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving || !name || !deadline}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "保存中..." : isEdit ? "更新" : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
