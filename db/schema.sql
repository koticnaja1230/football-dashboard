-- ============================================================
-- Football Dashboard - SQLite Database Schema
-- Cache Strategy: Store API responses + parsed data
-- ============================================================

PRAGMA journal_mode = WAL;   -- Better concurrency
PRAGMA foreign_keys = ON;
PRAGMA cache_size = -32000;  -- 32MB cache

-- ------------------------------------------------------------
-- 1. LEAGUES
--    TTL: 7 days (rarely changes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leagues (
  id            INTEGER PRIMARY KEY,   -- from API (e.g. league_id)
  name          TEXT    NOT NULL,
  country       TEXT,
  logo_url      TEXT,
  season        INTEGER,               -- e.g. 2024
  raw_json      TEXT,                  -- full API response (JSON)
  fetched_at    INTEGER NOT NULL,      -- Unix timestamp
  expires_at    INTEGER NOT NULL       -- Unix timestamp
);

-- ------------------------------------------------------------
-- 2. TEAMS
--    TTL: 3 days
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id            INTEGER PRIMARY KEY,
  league_id     INTEGER REFERENCES leagues(id),
  name          TEXT    NOT NULL,
  short_name    TEXT,
  logo_url      TEXT,
  venue_name    TEXT,
  raw_json      TEXT,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL
);

-- ------------------------------------------------------------
-- 3. FIXTURES / MATCHES
--    TTL: 30 minutes (live/upcoming), 24 hours (finished)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fixtures (
  id            INTEGER PRIMARY KEY,
  league_id     INTEGER REFERENCES leagues(id),
  season        INTEGER,
  round         TEXT,                  -- e.g. "Regular Season - 12"
  home_team_id  INTEGER REFERENCES teams(id),
  away_team_id  INTEGER REFERENCES teams(id),
  home_score    INTEGER,
  away_score    INTEGER,
  status        TEXT,                  -- 'NS','1H','HT','2H','FT','PST','CANC'
  match_date    INTEGER,               -- Unix timestamp of kickoff
  venue         TEXT,
  raw_json      TEXT,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fixtures_league    ON fixtures(league_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_date      ON fixtures(match_date);
CREATE INDEX IF NOT EXISTS idx_fixtures_status    ON fixtures(status);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON fixtures(home_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON fixtures(away_team_id);

-- ------------------------------------------------------------
-- 4. STANDINGS
--    TTL: 1 hour (updates after each match)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS standings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id     INTEGER NOT NULL REFERENCES leagues(id),
  season        INTEGER NOT NULL,
  team_id       INTEGER REFERENCES teams(id),
  rank          INTEGER,
  points        INTEGER,
  played        INTEGER,
  won           INTEGER,
  drawn         INTEGER,
  lost          INTEGER,
  goals_for     INTEGER,
  goals_against INTEGER,
  goal_diff     INTEGER,
  form          TEXT,                  -- e.g. "WWDLW"
  raw_json      TEXT,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  UNIQUE(league_id, season, team_id)
);

CREATE INDEX IF NOT EXISTS idx_standings_league ON standings(league_id, season);

-- ------------------------------------------------------------
-- 5. PLAYERS
--    TTL: 24 hours
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id            INTEGER PRIMARY KEY,
  team_id       INTEGER REFERENCES teams(id),
  name          TEXT    NOT NULL,
  nationality   TEXT,
  position      TEXT,                  -- 'Goalkeeper','Defender','Midfielder','Attacker'
  photo_url     TEXT,
  age           INTEGER,
  raw_json      TEXT,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);

-- ------------------------------------------------------------
-- 6. MATCH STATISTICS
--    TTL: 30 min (live), 24 hours (finished)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_statistics (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  fixture_id    INTEGER NOT NULL REFERENCES fixtures(id),
  team_id       INTEGER NOT NULL REFERENCES teams(id),
  stat_key      TEXT    NOT NULL,      -- e.g. 'Shots on Goal', 'Ball Possession'
  stat_value    TEXT,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  UNIQUE(fixture_id, team_id, stat_key)
);

CREATE INDEX IF NOT EXISTS idx_stats_fixture ON match_statistics(fixture_id);

-- ------------------------------------------------------------
-- 7. TOP SCORERS / ASSISTS
--    TTL: 6 hours
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS top_scorers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  league_id     INTEGER NOT NULL REFERENCES leagues(id),
  season        INTEGER NOT NULL,
  player_id     INTEGER REFERENCES players(id),
  player_name   TEXT,
  team_name     TEXT,
  goals         INTEGER DEFAULT 0,
  assists       INTEGER DEFAULT 0,
  yellow_cards  INTEGER DEFAULT 0,
  red_cards     INTEGER DEFAULT 0,
  raw_json      TEXT,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL,
  UNIQUE(league_id, season, player_id)
);

-- ------------------------------------------------------------
-- 8. GENERIC API CACHE (fallback สำหรับ endpoint อื่นๆ)
--    เก็บ raw response ที่ยังไม่ได้ parse
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_cache (
  cache_key     TEXT    PRIMARY KEY,   -- hash ของ URL + params
  endpoint      TEXT    NOT NULL,      -- เก็บ URL เพื่อ debug
  response_json TEXT    NOT NULL,
  status_code   INTEGER,
  fetched_at    INTEGER NOT NULL,
  expires_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON api_cache(expires_at);

-- ------------------------------------------------------------
-- 9. CACHE METADATA (tracking + stats)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cache_meta (
  key           TEXT PRIMARY KEY,
  value         TEXT
);

INSERT OR IGNORE INTO cache_meta VALUES
  ('schema_version', '1'),
  ('created_at',     CAST(strftime('%s','now') AS TEXT));
