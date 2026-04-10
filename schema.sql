-- Baseline — Additional tables for BM Supabase
-- Run in: https://supabase.com/dashboard/project/ltpivkqahvplapyagljt/sql

-- ============================================================
-- BRIEFINGS (cached daily digests)
-- ============================================================
CREATE TABLE IF NOT EXISTS bl_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date DATE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  summary TEXT,
  sections JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bl_briefings_date ON bl_briefings(briefing_date DESC);

-- ============================================================
-- ACTION ITEMS (persistent cross-channel tasks)
-- ============================================================
CREATE TABLE IF NOT EXISTS bl_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID REFERENCES bl_briefings(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('urgent','high','medium','low')),
  channel TEXT,
  business TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','in_progress','done','dismissed')),
  due_date DATE,
  source_ref JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bl_action_items_status ON bl_action_items(status);

-- ============================================================
-- SYNC STATE (track last sync per channel per business)
-- ============================================================
CREATE TABLE IF NOT EXISTS bl_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  business TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_history_id TEXT,
  token_data JSONB,
  UNIQUE(channel, business)
);

-- ============================================================
-- PREFERENCES (user settings key/value)
-- ============================================================
CREATE TABLE IF NOT EXISTS bl_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE bl_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bl_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bl_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE bl_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth full access bl_briefings" ON bl_briefings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access bl_action_items" ON bl_action_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access bl_sync_state" ON bl_sync_state FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth full access bl_preferences" ON bl_preferences FOR ALL TO authenticated USING (true) WITH CHECK (true);
