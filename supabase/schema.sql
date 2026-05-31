-- ============================================================
-- PRODE MUNDIAL 2026 — Schema Supabase
-- Correr en el SQL Editor de Supabase (Project > SQL Editor)
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: matches
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_match_id   INTEGER UNIQUE,
  home_team      TEXT NOT NULL,
  away_team      TEXT NOT NULL,
  match_date     TIMESTAMPTZ NOT NULL,
  phase          TEXT NOT NULL CHECK (phase IN (
                   'group','round_of_32','round_of_16',
                   'quarter_final','semi_final','third_place','final'
                 )),
  group_name     TEXT,
  home_score     INTEGER,
  away_score     INTEGER,
  status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (
                   status IN ('scheduled','live','finished','postponed')
                 ),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: initial_predictions (Capa 1 — INMUTABLE tras cierre)
-- ============================================================
CREATE TABLE IF NOT EXISTS initial_predictions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home   INTEGER NOT NULL CHECK (predicted_home >= 0),
  predicted_away   INTEGER NOT NULL CHECK (predicted_away >= 0),
  predicted_winner TEXT NOT NULL CHECK (predicted_winner IN ('home','away','draw')),
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

-- ============================================================
-- TABLA: initial_bracket (predicción de cruces de eliminatorias)
-- ============================================================
CREATE TABLE IF NOT EXISTS initial_bracket (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phase          TEXT NOT NULL CHECK (phase IN (
                   'round_of_32','round_of_16','quarter_final',
                   'semi_final','final'
                 )),
  slot           INTEGER NOT NULL,
  predicted_team TEXT NOT NULL,
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, phase, slot)
);

-- ============================================================
-- TABLA: champion_prediction (INMUTABLE tras cierre)
-- ============================================================
CREATE TABLE IF NOT EXISTS champion_prediction (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  team       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: live_predictions (Capa 2 — actualizables hasta lock)
-- ============================================================
CREATE TABLE IF NOT EXISTS live_predictions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predicted_home   INTEGER NOT NULL CHECK (predicted_home >= 0),
  predicted_away   INTEGER NOT NULL CHECK (predicted_away >= 0),
  predicted_winner TEXT NOT NULL CHECK (predicted_winner IN ('home','away','draw')),
  locked           BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

-- ============================================================
-- TABLA: scoring_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS scoring_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name   TEXT NOT NULL UNIQUE,
  points      INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: scores (totales por usuario)
-- ============================================================
CREATE TABLE IF NOT EXISTS scores (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  base_points         INTEGER NOT NULL DEFAULT 0,
  chain_bonus_points  INTEGER NOT NULL DEFAULT 0,
  streak_bonus        INTEGER NOT NULL DEFAULT 0,
  total_points        INTEGER NOT NULL DEFAULT 0,
  exact_results       INTEGER NOT NULL DEFAULT 0,
  correct_winners     INTEGER NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: chain_bonus_log
-- ============================================================
CREATE TABLE IF NOT EXISTS chain_bonus_log (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id       UUID REFERENCES matches(id) ON DELETE SET NULL,
  bonus_type     TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: activity_log
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action      TEXT NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES RPC
-- ============================================================

-- Sumar puntos base a un usuario
CREATE OR REPLACE FUNCTION add_base_points(
  p_user_id   UUID,
  p_match_id  UUID,
  p_points    INTEGER,
  p_is_exact  BOOLEAN,
  p_is_winner BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO scores (user_id, base_points, total_points, exact_results, correct_winners)
  VALUES (p_user_id, p_points, p_points,
          CASE WHEN p_is_exact THEN 1 ELSE 0 END,
          CASE WHEN p_is_winner THEN 1 ELSE 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    base_points    = scores.base_points + p_points,
    total_points   = scores.base_points + scores.chain_bonus_points + scores.streak_bonus + p_points,
    exact_results  = scores.exact_results + (CASE WHEN p_is_exact THEN 1 ELSE 0 END),
    correct_winners = scores.correct_winners + (CASE WHEN p_is_winner THEN 1 ELSE 0 END),
    updated_at     = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sumar bonus de cadena
CREATE OR REPLACE FUNCTION add_chain_bonus(
  p_user_id UUID,
  p_points  INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO scores (user_id, chain_bonus_points, total_points)
  VALUES (p_user_id, p_points, p_points)
  ON CONFLICT (user_id) DO UPDATE SET
    chain_bonus_points = scores.chain_bonus_points + p_points,
    total_points       = scores.base_points + scores.chain_bonus_points + scores.streak_bonus + p_points,
    updated_at         = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE initial_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE initial_bracket     ENABLE ROW LEVEL SECURITY;
ALTER TABLE champion_prediction ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_predictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_bonus_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log        ENABLE ROW LEVEL SECURITY;

-- profiles: cada uno ve el suyo; admin ve todos
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- matches: todos pueden leer; solo admin escribe
CREATE POLICY "matches_select_all" ON matches FOR SELECT USING (TRUE);
CREATE POLICY "matches_admin_write" ON matches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- initial_predictions: el propio usuario lee/escribe; admin todo
CREATE POLICY "init_pred_own" ON initial_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "init_pred_admin" ON initial_predictions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- initial_bracket
CREATE POLICY "bracket_own" ON initial_bracket FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "bracket_admin" ON initial_bracket FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- champion_prediction
CREATE POLICY "champ_own" ON champion_prediction FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "champ_admin" ON champion_prediction FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- live_predictions: todos leen los ajenos (para estadísticas); solo el dueño escribe
CREATE POLICY "live_pred_select_all" ON live_predictions FOR SELECT USING (TRUE);
CREATE POLICY "live_pred_own_write" ON live_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "live_pred_own_update" ON live_predictions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "live_pred_admin" ON live_predictions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- scoring_rules: todos leen; solo admin escribe
CREATE POLICY "rules_select" ON scoring_rules FOR SELECT USING (TRUE);
CREATE POLICY "rules_admin" ON scoring_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- scores: todos leen (ranking público)
CREATE POLICY "scores_select" ON scores FOR SELECT USING (TRUE);
CREATE POLICY "scores_admin" ON scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- chain_bonus_log: el dueño lee; admin todo
CREATE POLICY "chain_log_own" ON chain_bonus_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chain_log_admin" ON chain_bonus_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- settings: todos leen; solo admin escribe
CREATE POLICY "settings_select" ON settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_admin" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- activity_log: admin lee todo
CREATE POLICY "activity_admin" ON activity_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Reglas de puntuación con valores por defecto
INSERT INTO scoring_rules (rule_name, points, active) VALUES
  ('correct_winner',          2,  TRUE),
  ('exact_result',            3,  TRUE),
  ('knockout_advance',        3,  TRUE),
  ('champion',               10,  TRUE),
  ('streak_bonus',            1,  TRUE),
  ('chain_group_classifier',  2,  TRUE),
  ('chain_r32_matchup',       3,  TRUE),
  ('chain_r16_matchup',       4,  TRUE),
  ('chain_qf_matchup',        5,  TRUE),
  ('chain_sf_matchup',        6,  TRUE),
  ('chain_final_matchup',     8,  TRUE),
  ('chain_knockout_winner',   3,  TRUE),
  ('chain_full_path',         5,  TRUE)
ON CONFLICT (rule_name) DO NOTHING;

-- Settings por defecto
INSERT INTO settings (key, value) VALUES
  ('registration_enabled',         'true'),
  ('initial_prediction_deadline',  '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_matches_status       ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_phase        ON matches(phase);
CREATE INDEX IF NOT EXISTS idx_matches_date         ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_live_pred_user       ON live_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_pred_match      ON live_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_init_pred_user       ON initial_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_total         ON scores(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_chain_log_user       ON chain_bonus_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created     ON activity_log(created_at DESC);
