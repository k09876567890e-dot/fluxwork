"use client";

import { Trash2, Loader2 } from "lucide-react";
import type { Subtask } from "@/types";

type SubtaskDraft = Pick<Subtask, "name" | "estimatedMinutes" | "isDelegatable" | "dependsOnOthers">;

interface Props {
  subtasks: SubtaskDraft[];
  onChange: (subtasks: SubtaskDraft[]) => void;
  isLoading: boolean;
}

export default function SubtaskPanel({ subtasks, onChange, isLoading }: Props) {
  function update(index: number, patch: Partial<SubtaskDraft>) {
    onChange(subtasks.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function remove(index: number) {
    onChange(subtasks.filter((_, i) => i !== index));
  }

  const total = subtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        AI分解中...
      </div>
    );
  }

  if (subtasks.length === 0) return null;

  return (
    <div className="mt-1 space-y-1">
      {subtasks.map((st, i) => (
        <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5">
          {/* Name */}
          <input
            type="text"
            value={st.name}
            onChange={(e) => update(i, { name: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
          {/* Minutes */}
          <input
            type="number"
            value={st.estimatedMinutes}
            min={15}
            step={15}
            onChange={(e) => update(i, { estimatedMinutes: parseInt(e.target.value, 10) || 15 })}
            className="w-14 rounded border bg-background px-1.5 py-0.5 text-center text-xs"
          />
          <span className="shrink-0 text-xs text-muted-foreground">分</span>
          {/* Delegatable */}
          <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={st.isDelegatable}
              onChange={(e) => update(i, { isDelegatable: e.target.checked })}
              className="h-3 w-3"
            />
            委譲可
          </label>
          {/* Depends */}
          <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={st.dependsOnOthers}
              onChange={(e) => update(i, { dependsOnOthers: e.target.checked })}
              className="h-3 w-3"
            />
            他者待ち
          </label>
          {/* Delete */}
          <button
            onClick={() => remove(i)}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="pt-1 text-right text-xs text-muted-foreground">
        合計: <span className="font-medium text-foreground">{total}分</span>
      </div>
    </div>
  );
}
