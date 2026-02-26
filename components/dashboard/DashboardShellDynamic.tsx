"use client";

/**
 * DashboardShell の dynamic ラッパー。
 *
 * @dnd-kit/core は SSR 時に aria-describedby 用の連番 ID (DndDescribedBy-N) を
 * サーバーとクライアントで異なる値で生成するため Hydration エラーが発生する。
 * `ssr: false` は Server Component 内では使用不可なので、この Client Component
 * ラッパーを挟んで対処する。
 */

import dynamic from "next/dynamic";
import type { UITask } from "@/lib/api-client";

const DashboardShellInner = dynamic(
  () =>
    import("@/components/dashboard/DashboardShell").then(
      (m) => m.DashboardShell
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        読み込み中…
      </div>
    ),
  }
);

interface Props {
  initialActiveTasks: UITask[];
  initialWaitingTasks: UITask[];
  userEmail: string;
}

export function DashboardShellDynamic(props: Props) {
  return <DashboardShellInner {...props} />;
}
