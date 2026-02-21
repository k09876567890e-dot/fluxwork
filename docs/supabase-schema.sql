-- FluxWork Supabase Schema
-- Supabase SQL Editor で実行してください

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  deadline        TIMESTAMPTZ NOT NULL,
  notes           TEXT,
  estimated_minutes INTEGER NOT NULL DEFAULT 0,
  lead_time_minutes INTEGER NOT NULL DEFAULT 0,
  ball_holder     SMALLINT NOT NULL DEFAULT 1 CHECK (ball_holder IN (0, 1)),
  score           NUMERIC NOT NULL DEFAULT 0,
  gcal_event_id   TEXT,
  is_locked       BOOLEAN NOT NULL DEFAULT false,
  scheduled_start TIMESTAMPTZ,
  scheduled_end   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- サブタスクテーブル
CREATE TABLE IF NOT EXISTS subtasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  estimated_minutes   INTEGER NOT NULL DEFAULT 15,
  is_delegatable      BOOLEAN NOT NULL DEFAULT false,
  depends_on_others   BOOLEAN NOT NULL DEFAULT false,
  is_completed        BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: 自分のタスクのみ操作可
CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  USING (user_id = auth.email());

CREATE POLICY "Users can manage their own subtasks"
  ON subtasks FOR ALL
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.email()
    )
  );

-- インデックス
CREATE INDEX IF NOT EXISTS tasks_user_id_score_idx ON tasks(user_id, score DESC);
CREATE INDEX IF NOT EXISTS tasks_gcal_event_id_idx ON tasks(gcal_event_id) WHERE gcal_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS subtasks_task_id_idx ON subtasks(task_id);
