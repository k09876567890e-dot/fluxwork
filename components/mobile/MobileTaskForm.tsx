"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { BallHolder } from "@/types";

interface FormData {
  name: string;
  deadline: string;
  notes?: string;
  estimatedMinutes: number;
  leadTimeMinutes: number;
  ballHolder: BallHolder;
}

interface Props {
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

function toLocalDatetimeStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function MobileTaskForm({ onSave, onCancel }: Props) {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(0);
  const [ballHolder, setBallHolder] = useState<BallHolder>(1);
  const [isSaving, setIsSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // デフォルト期限: 翌日18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    setDeadline(toLocalDatetimeStr(tomorrow));
    nameRef.current?.focus();
  }, []);

  const canSubmit = name.trim().length > 0 && deadline.length > 0 && !isSaving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        deadline: new Date(deadline).toISOString(),
        notes: notes.trim() || undefined,
        estimatedMinutes,
        leadTimeMinutes,
        ballHolder,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* タスク名 */}
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
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* 期限 */}
      <div>
        <label className="mb-1 block text-sm font-medium">
          期限 <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* 補足メモ */}
      <div>
        <label className="mb-1 block text-sm font-medium">補足メモ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="追加情報（任意）"
          className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* 実作業見積もり */}
      <div>
        <label className="mb-1 block text-sm font-medium">実作業見積もり（分）</label>
        <input
          type="number"
          value={estimatedMinutes}
          min={15}
          step={15}
          onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 15)}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* 他者リードタイム */}
      <div>
        <label className="mb-1 block text-sm font-medium">他者リードタイム（分）</label>
        <input
          type="number"
          value={leadTimeMinutes}
          min={0}
          step={15}
          onChange={(e) => setLeadTimeMinutes(parseInt(e.target.value, 10) || 0)}
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* ボール所在 */}
      <div>
        <label className="mb-1 block text-sm font-medium">ボール所在</label>
        <div className="flex gap-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="ballHolder"
              checked={ballHolder === 1}
              onChange={() => setBallHolder(1)}
            />
            自分（実行可能）
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="ballHolder"
              checked={ballHolder === 0}
              onChange={() => setBallHolder(0)}
            />
            他者待ち
          </label>
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-accent"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              追加中...
            </>
          ) : (
            "追加"
          )}
        </button>
      </div>
    </form>
  );
}
