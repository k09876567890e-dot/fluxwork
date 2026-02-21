# CLAUDE.md — 業務整理・タスク管理アプリ

このファイルはClaude Codeがプロジェクトを理解し、一貫した判断で開発を進めるための指示書です。

---

## プロジェクト概要

**目的**: タスクの分解・見積もり・優先順位付けが苦手なユーザーの思考コストをAIとシステムが代替する。Googleカレンダーと双方向連携し、物理的な可処分時間を可視化する。

**ターゲット**: 「すべてが優先に見える」「着手点が決まらない」ユーザー。他者からの突発依頼に対し、事実ベースで可否を伝えるための防御壁として機能させる。

---

## 技術スタック（仮。着手前に確認すること）

| 層 | 技術候補 | 備考 |
|---|---|---|
| フロントエンド | Next.js (App Router) + TypeScript | PC・スマホ共通 |
| スタイリング | Tailwind CSS + shadcn/ui | |
| バックエンド | Next.js API Routes / Edge Functions | |
| DB | Supabase (PostgreSQL) | Auth も Supabase を使用 |
| 認証 | NextAuth.js + Google OAuth | GCal スコープも同時取得 |
| AI | Google Gemini API (gemini-2.5-flash-preview-04-17) | タスク分解・スコアリング |
| カレンダー連携 | Google Calendar API v3 | 双方向同期 |
| デプロイ | Vercel | |

> ⚠ スタックを変更する場合は必ずユーザーに確認してから着手すること。

---

## ディレクトリ構成（想定）

```
/
├── app/
│   ├── (auth)/          # ログイン・OAuth コールバック
│   ├── dashboard/       # メイン画面（PC版タイムライン）
│   ├── mobile/          # スマホ版（入力・破綻判定のみ）
│   └── api/
│       ├── tasks/       # タスク CRUD
│       ├── ai/          # Gemini API 呼び出し
│       └── calendar/    # GCal 同期ロジック
├── components/
│   ├── timeline/        # タイムライン・ドラッグ関連
│   ├── task/            # タスクカード・モーダル
│   └── waiting-lane/    # ウェイティングレーン
├── lib/
│   ├── scoring.ts       # 優先順位スコアリングロジック
│   ├── gcal.ts          # Google Calendar API ラッパー
│   └── ai-prompt.ts     # Gemini へのプロンプト定義
├── types/
│   └── index.ts         # 共通型定義
└── CLAUDE.md            # このファイル
```

---

## コア機能仕様

### 優先順位スコアリング

```typescript
// A: 納期までの時間（時間単位）
// B: 実作業ボリューム（分単位）
// C: 他者関与のリードタイム（分単位）
// D: ボールの所在（1=自分, 0=他者待ち）

function calcScore(A: number, B: number, C: number, D: number): number {
  if (D === 0) return 0; // 他者待ちはウェイティングレーンへ退避
  return (B + C) / A;
}
```

スコアの高い順にリストを強制ソート。D=0のタスクは実行リストから除外し「ウェイティングレーン」に表示する。

### AIタスク分解プロンプト（`lib/ai-prompt.ts`）

Gemini API に渡すシステムプロンプトの骨格：

```
あなたは業務タスク分解の専門家です。
以下の入力から、具体的なサブタスクリストを生成してください。

入力:
- タスク名: {taskName}
- 最終期限: {deadline}
- 補足メモ: {notes}

出力形式（JSONのみ返すこと）:
{
  "subtasks": [
    {
      "name": "サブタスク名",
      "estimatedMinutes": 45,      // 15分刻みで見積もる
      "isDelegatable": false,       // 他者への移譲が可能か
      "dependsOnOthers": false      // 他者の作業待ちが発生するか
    }
  ],
  "totalMinutes": 120,
  "notes": "AIからの補足コメント（任意）"
}

制約:
- 見積もりは必ず15分刻みにすること
- 1サブタスクの最大時間は120分。それ以上になる場合はさらに分割すること
- 出力はJSONのみ。説明文・マークダウン記法は不要
```

### Googleカレンダー同期ルール

詳細は `docs/conflict-resolution-rules.md` を参照。

基本原則:
1. **固定ブロック（GCalインポート）はGCal絶対優先**。App側での編集不可（UIでロック）
2. **作業予定（Appエクスポート）はApp一次情報**。GCal側の変更は次回同期時に差分通知→ユーザー承認で反映
3. **削除はカスケード**。固定ブロック削除時、衝突により自動分割されたタスク断片は「未割当リスト」へ戻す

---

## デバイス別UI仕様

| 機能 | PC版 | スマホ版 |
|---|---|---|
| タスク入力 | ✅ | ✅ |
| AI分解・編集 | ✅ | 閲覧のみ |
| タイムライン配置（D&D） | ✅ | ❌ |
| 破綻判定（組込み可否確認） | ✅ | ✅ |
| ウェイティングレーン | ✅ | ✅（簡易表示） |
| GCal書き出し | ✅ | ❌ |

---

## 開発フェーズ

### Phase 1（MVP）— 最初に完成させるもの

- [ ] Google OAuth + GCalスコープ取得
- [ ] タスクのCRUD（タスク名・期限・補足メモ）
- [ ] Gemini APIによるサブタスク自動生成
- [ ] スコアリングロジック実装
- [ ] タイムラインUI（PC版）+ ドラッグ&ドロップ
- [ ] GCal双方向同期（固定ブロックインポート / 作業予定エクスポート）
- [ ] ウェイティングレーン（D=0のタスク退避）
- [ ] スマホ版（入力 + 破綻判定）

### Phase 2 — 後続機能

- [ ] Slack連携（タスク取り込み）
- [ ] ポモドーロタイマー + 実績記録
- [ ] 突発依頼の防御テキスト自動生成
- [ ] ルーティン業務の自動挿入

---

## コーディング規約

- **TypeScript strict モード**を使用すること
- `any` 型の使用を原則禁止（やむを得ない場合はコメントで理由を明記）
- API Routeのレスポンスは必ず型定義すること
- GCal APIやGemini APIの呼び出しはすべて `lib/` 以下に集約し、コンポーネントから直接呼ばない
- エラーハンドリングを必ず実装すること（特に外部API呼び出し）
- コンポーネントは `app/` ではなく `components/` に置くこと

---

## 環境変数（`.env.local`）

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

GEMINI_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 未確定事項（開発前に要確認）

- [ ] GCal同期のWebhook vs ポーリング選択（API制限・コスト考慮）
- [ ] 複数Googleカレンダーが存在する場合のインポート対象設定
- [ ] 作業予定のエクスポート先カレンダーの初期設定
- [ ] オフライン時の競合処理方針
