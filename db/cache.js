// db/cache.js  —  ES Module version
// ติดตั้ง: npm install better-sqlite3

import Database from "better-sqlite3";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ------------------------------------------------------------
// TTL config (วินาที)
// ------------------------------------------------------------
export const TTL = {
  LEAGUES:        7 * 24 * 60 * 60,  // 7 วัน
  TEAMS:          3 * 24 * 60 * 60,  // 3 วัน
  STANDINGS:          60 * 60,        // 1 ชั่วโมง
  FIXTURES_LIVE:      30 * 60,        // 30 นาที
  FIXTURES_DONE:  24 * 60 * 60,       // 24 ชั่วโมง
  PLAYERS:        24 * 60 * 60,       // 24 ชั่วโมง
  STATS:              30 * 60,        // 30 นาที
  TOP_SCORERS:     6 * 60 * 60,       // 6 ชั่วโมง
  GENERIC:            60 * 60,        // 1 ชั่วโมง
};

// ------------------------------------------------------------
// DB singleton
// ------------------------------------------------------------
let _db = null;

export function getDB() {
  if (_db) return _db;

  const dbPath = process.env.DB_PATH ?? "./database.db";
  _db = new Database(dbPath);

  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.pragma("cache_size = -32000");

  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  _db.exec(schema);

  return _db;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const now = () => Math.floor(Date.now() / 1000);

function makeKey(endpoint, params = {}) {
  const str = endpoint + JSON.stringify(params);
  return createHash("sha256").update(str).digest("hex").slice(0, 32);
}

function isExpired(row) {
  return !row || row.expires_at < now();
}

// ------------------------------------------------------------
// Generic cache
// ------------------------------------------------------------
export const cache = {
  get(endpoint, params = {}) {
    const db = getDB();
    const key = makeKey(endpoint, params);
    const row = db.prepare(
      "SELECT response_json, expires_at FROM api_cache WHERE cache_key = ?"
    ).get(key);

    if (isExpired(row)) return null;
    try { return JSON.parse(row.response_json); } catch { return null; }
  },

  set(endpoint, params = {}, data, ttl = TTL.GENERIC) {
    const db = getDB();
    const key = makeKey(endpoint, params);
    const ts = now();
    db.prepare(`
      INSERT INTO api_cache (cache_key, endpoint, response_json, fetched_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        response_json = excluded.response_json,
        fetched_at    = excluded.fetched_at,
        expires_at    = excluded.expires_at
    `).run(key, endpoint, JSON.stringify(data), ts, ts + ttl);
  },

  invalidate(endpoint, params = {}) {
    const db = getDB();
    db.prepare("DELETE FROM api_cache WHERE cache_key = ?").run(
      makeKey(endpoint, params)
    );
  },

  cleanup() {
    const db = getDB();
    const { changes } = db.prepare(
      "DELETE FROM api_cache WHERE expires_at < ?"
    ).run(now());
    console.log(`[Cache] Cleaned up ${changes} expired entries`);
    return changes;
  },
};

// ------------------------------------------------------------
// Standings
// ------------------------------------------------------------
export const standingsCache = {
  upsert(leagueId, season, rows) {
    const db = getDB();
    const ts = now();
    const upsertOne = db.prepare(`
      INSERT INTO standings
        (league_id, season, team_id, rank, points, played, won, drawn, lost,
         goals_for, goals_against, goal_diff, form, raw_json, fetched_at, expires_at)
      VALUES
        (@league_id,@season,@team_id,@rank,@points,@played,@won,@drawn,@lost,
         @goals_for,@goals_against,@goal_diff,@form,@raw_json,@fetched_at,@expires_at)
      ON CONFLICT(league_id, season, team_id) DO UPDATE SET
        rank=excluded.rank, points=excluded.points, played=excluded.played,
        won=excluded.won, drawn=excluded.drawn, lost=excluded.lost,
        goals_for=excluded.goals_for, goals_against=excluded.goals_against,
        goal_diff=excluded.goal_diff, form=excluded.form,
        raw_json=excluded.raw_json, fetched_at=excluded.fetched_at,
        expires_at=excluded.expires_at
    `);
    db.transaction((items) => {
      for (const item of items) {
        upsertOne.run({
          league_id: leagueId, season, ...item,
          raw_json: JSON.stringify(item),
          fetched_at: ts, expires_at: ts + TTL.STANDINGS,
        });
      }
    })(rows);
  },

  get(leagueId, season) {
    const db = getDB();
    return db.prepare(`
      SELECT s.*, t.name as team_name, t.logo_url as team_logo
      FROM standings s LEFT JOIN teams t ON t.id = s.team_id
      WHERE s.league_id=? AND s.season=? AND s.expires_at>?
      ORDER BY s.rank
    `).all(leagueId, season, now());
  },

  isStale(leagueId, season) {
    const db = getDB();
    const row = db.prepare(
      "SELECT expires_at FROM standings WHERE league_id=? AND season=? LIMIT 1"
    ).get(leagueId, season);
    return isExpired(row);
  },
};

// ------------------------------------------------------------
// Fixtures
// ------------------------------------------------------------
export const fixturesCache = {
  upsert(fixtureData) {
    const db = getDB();
    const ts = now();
    const isDone = ["FT","AET","PEN"].includes(fixtureData.status);
    const ttl = isDone ? TTL.FIXTURES_DONE : TTL.FIXTURES_LIVE;

    db.prepare(`
      INSERT INTO fixtures
        (id,league_id,season,round,home_team_id,away_team_id,
         home_score,away_score,status,match_date,venue,raw_json,fetched_at,expires_at)
      VALUES
        (@id,@league_id,@season,@round,@home_team_id,@away_team_id,
         @home_score,@away_score,@status,@match_date,@venue,@raw_json,@fetched_at,@expires_at)
      ON CONFLICT(id) DO UPDATE SET
        home_score=excluded.home_score, away_score=excluded.away_score,
        status=excluded.status, raw_json=excluded.raw_json,
        fetched_at=excluded.fetched_at, expires_at=excluded.expires_at
    `).run({
      ...fixtureData,
      raw_json: JSON.stringify(fixtureData),
      fetched_at: ts, expires_at: ts + ttl,
    });
  },

  getByLeague(leagueId, season) {
    const db = getDB();
    return db.prepare(`
      SELECT f.*,
        ht.name as home_team_name, ht.logo_url as home_logo,
        at.name as away_team_name, at.logo_url as away_logo
      FROM fixtures f
      LEFT JOIN teams ht ON ht.id=f.home_team_id
      LEFT JOIN teams at ON at.id=f.away_team_id
      WHERE f.league_id=? AND f.season=? AND f.expires_at>?
      ORDER BY f.match_date
    `).all(leagueId, season, now());
  },
};

// ------------------------------------------------------------
// withCache — pattern หลัก ใช้แทนการเรียก API ตรงๆ
// ------------------------------------------------------------
export async function withCache(endpoint, params, apiFetcher, ttl = TTL.GENERIC) {
  const cached = cache.get(endpoint, params);
  if (cached !== null) {
    console.log(`[Cache HIT]  ${endpoint}`, params);
    return cached;
  }

  console.log(`[Cache MISS] ${endpoint}`, params);
  const data = await apiFetcher();
  cache.set(endpoint, params, data, ttl);
  return data;
}
