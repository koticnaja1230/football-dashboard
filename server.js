import "dotenv/config";
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { withCache, TTL, standingsCache } from "./db/cache.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

const API_KEY = process.env.FOOTBALL_API_KEY;
const BASE = "https://v3.football.api-sports.io";
const SEASON = 2024;

const LEAGUE_IDS = { PL: 39, PD: 140, BL1: 78, SA: 135, FL1: 61 };

// ── SQLite Cache ──────────────────────────────────────────────────
const db = new Database("database.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    key       TEXT PRIMARY KEY,
    data      TEXT NOT NULL,
    cached_at INTEGER NOT NULL
  )
`);

const CACHE_TTL = 5 * 60 * 1000; // 5 นาที

const getCache = (key) => {
  const row = db.prepare("SELECT * FROM cache WHERE key = ?").get(key);
  if (!row) return null;
  if (Date.now() - row.cached_at > CACHE_TTL) {
    db.prepare("DELETE FROM cache WHERE key = ?").run(key);
    return null;
  }
  return JSON.parse(row.data);
};

const setCache = (key, data) => {
  db.prepare(
    `
    INSERT OR REPLACE INTO cache (key, data, cached_at) VALUES (?, ?, ?)
  `,
  ).run(key, JSON.stringify(data), Date.now());
};

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));

// ── Fetch helper ─────────────────────────────────────────────────
async function fetchAPI(path) {
  const cached = getCache(path);
  if (cached) {
    console.log(`[CACHE] ${path}`);
    return cached;
  }

  console.log(`[FETCH] ${path}`);
  const res = await fetch(`${BASE}${path}`, {
    headers: { "x-apisports-key": API_KEY },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length > 0)
    throw new Error(JSON.stringify(data.errors));

  setCache(path, data);
  return data;
}

app.use(express.static(join(__dirname, "dist")));
// ── Routes ───────────────────────────────────────────────────────

// ตารางคะแนน
app.get("/api/standings/:code", async (req, res) => {
  try {
    const leagueId = LEAGUE_IDS[req.params.code];
    if (!leagueId) return res.status(400).json({ error: "Unknown league" });
    const data = await fetchAPI(
      `/standings?league=${leagueId}&season=${SEASON}`,
    );
    const table = data.response?.[0]?.league?.standings?.[0] || [];
    res.json({
      standings: [
        {
          table: table.map((t) => ({
            position: t.rank,
            team: {
              id: t.team.id,
              name: t.team.name,
              shortName: t.team.name,
              crest: t.team.logo,
            },
            playedGames: t.all.played,
            won: t.all.win,
            draw: t.all.draw,
            lost: t.all.lose,
            goalsFor: t.all.goals.for,
            goalsAgainst: t.all.goals.against,
            goalDifference: t.goalsDiff,
            points: t.points,
          })),
        },
      ],
    });
  } catch (e) {
    console.error("[standings]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ผลและโปรแกรม
app.get("/api/matches/:code", async (req, res) => {
  try {
    const leagueId = LEAGUE_IDS[req.params.code];
    if (!leagueId) return res.status(400).json({ error: "Unknown league" });

    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    const to = new Date(today);
    to.setDate(to.getDate() + 14);
    const fmt = (d) => d.toISOString().split("T")[0];

    const data = await fetchAPI(
      `/fixtures?league=${leagueId}&season=${SEASON}&from=${fmt(from)}&to=${fmt(to)}`,
    );
    const fixtures = data.response || [];

    const statusMap = {
      FT: "FINISHED",
      AET: "FINISHED",
      PEN: "FINISHED",
      "1H": "IN_PLAY",
      "2H": "IN_PLAY",
      ET: "IN_PLAY",
      HT: "PAUSED",
      NS: "SCHEDULED",
      TBD: "TIMED",
    };

    res.json({
      matches: fixtures.map((f) => ({
        id: f.fixture.id,
        utcDate: f.fixture.date,
        status: statusMap[f.fixture.status.short] || "SCHEDULED",
        matchday: f.league.round?.replace("Regular Season - ", ""),
        homeTeam: {
          id: f.teams.home.id,
          name: f.teams.home.name,
          shortName: f.teams.home.name,
        },
        awayTeam: {
          id: f.teams.away.id,
          name: f.teams.away.name,
          shortName: f.teams.away.name,
        },
        score: { fullTime: { home: f.goals.home, away: f.goals.away } },
      })),
    });
  } catch (e) {
    console.error("[matches]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ดาวซัลโว
app.get("/api/scorers/:code", async (req, res) => {
  try {
    const leagueId = LEAGUE_IDS[req.params.code];
    if (!leagueId) return res.status(400).json({ error: "Unknown league" });
    const data = await fetchAPI(
      `/players/topscorers?league=${leagueId}&season=${SEASON}`,
    );
    const scorers = (data.response || []).slice(0, 10).map((s) => ({
      player: {
        id: s.player.id,
        name: s.player.name,
        nationality: s.player.nationality,
        age: s.player.age,
        photo: s.player.photo,
      },
      team: {
        id: s.statistics[0]?.team?.id,
        name: s.statistics[0]?.team?.name,
        logo: s.statistics[0]?.team?.logo,
      },
      goals: s.statistics[0]?.goals?.total || 0,
      assists: s.statistics[0]?.goals?.assists || 0,
      games: s.statistics[0]?.games?.appearences || 0,
    }));
    res.json({ scorers });
  } catch (e) {
    console.error("[scorers]", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/assists/:code", async (req, res) => {
  try {
    const leagueId = LEAGUE_IDS[req.params.code];
    if (!leagueId) return res.status(400).json({ error: "Unknown league" });

    const data = await fetchAPI(
      `/players/topassists?league=${leagueId}&season=${SEASON}`,
    );

    const assisters = (data.response || []).slice(0, 10).map((s) => ({
      player: {
        id: s.player.id,
        name: s.player.name,
        nationality: s.player.nationality,
        age: s.player.age,
        photo: s.player.photo,
      },
      team: {
        id: s.statistics[0]?.team?.id,
        name: s.statistics[0]?.team?.name,
        logo: s.statistics[0]?.team?.logo,
      },
      assists: s.statistics[0]?.goals?.assists || 0,
      goals: s.statistics[0]?.goals?.total || 0,
      games: s.statistics[0]?.games?.appearences || 0,
    }));

    res.json({ assisters });
  } catch (e) {
    console.error("[assists]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Squad
app.get("/api/squad/:teamId", async (req, res) => {
  try {
    const data = await fetchAPI(`/players/squads?team=${req.params.teamId}`);
    const players = data.response?.[0]?.players || [];
    const POS_ORDER = {
      Goalkeeper: 0,
      Defender: 1,
      Midfielder: 2,
      Attacker: 3,
    };
    const squad = players
      .map((p) => ({
        id: p.id,
        name: p.name,
        number: p.number,
        position: p.position,
        age: p.age,
        photo: p.photo,
      }))
      .sort(
        (a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9),
      );
    res.json({ squad });
  } catch (e) {
    console.error("[squad]", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Head Coach
app.get("/api/coach/:teamId", async (req, res) => {
  try {
    const data = await fetchAPI(`/coachs?team=${req.params.teamId}`);
    const coaches = data.response || [];
    const active =
      coaches.find((c) =>
        c.career?.some(
          (career) => career.team?.id == req.params.teamId && !career.end,
        ),
      ) || coaches[0];
    if (!active) return res.json({ coach: null });
    const career =
      active.career?.find((c) => c.team?.id == req.params.teamId && !c.end) ||
      active.career?.[0];
    res.json({
      coach: {
        id: active.id,
        name: active.name,
        nationality: active.nationality,
        age: active.age,
        photo: active.photo,
        career: { contract: { start: career?.start || null } },
      },
    });
  } catch (e) {
    console.error("[coach]", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () =>
  console.log(`✅  Backend ready →  http://localhost:${PORT}`),
);
