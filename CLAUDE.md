# Football Dashboard — CLAUDE.md

## Project Overview

Euro5 Dashboard — เว็บแสดงข้อมูลฟุตบอล 5 ลีกใหญ่ในยุโรป (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) แบบเรียลไทม์ ดึงข้อมูลจาก [api-football.com](https://www.api-football.com) ผ่าน Express.js backend ที่มี SQLite cache

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Vite 8, CSS (dark theme)  |
| Backend   | Express.js (Node.js), ES Modules    |
| Database  | SQLite via `better-sqlite3`         |
| Data API  | api-football.com v3 (Free tier)     |
| Deploy    | Render (backend) + Vercel (frontend)|

---

## Project Structure

```
football-dashboard/
├── server.js                        # Express API server + SQLite cache
├── db/
│   ├── cache.js                     # SQLite singleton, withCache(), TTL constants, standingsCache, fixturesCache
│   └── schema.sql                   # DB schema: leagues, teams, fixtures, standings, players, api_cache
├── src/
│   ├── App.jsx                      # Root layout: header, league nav, main
│   ├── App.css                      # Global dark theme styles (CSS variables)
│   ├── main.jsx                     # React entry point + ErrorBoundary
│   ├── data.js                      # Static data: LEAGUES array, CHAMPIONS object
│   ├── hooks/
│   │   └── useLeagueData.js         # Fetches standings + matches concurrently
│   └── components/
│       ├── LeagueView.jsx           # Tab container: ตารางคะแนน/ผลล่าสุด/โปรแกรม/ดาวซัลโว/แอสซิสต์/แชมป์
│       ├── StandingsTable.jsx       # ตารางคะแนน + คลิกเปิด SquadModal
│       ├── SquadModal.jsx           # Modal: Head Coach + รายชื่อนักเตะแยกตำแหน่ง
│       ├── Topscorers.jsx           # ดาวซัลโว top 10 (CSS Grid layout)
│       ├── Topassists.jsx           # ท็อปแอสซิสต์ top 10 (CSS Grid layout)
│       ├── MatchCard.jsx            # การ์ดผลการแข่งขัน (live/finished/scheduled)
│       ├── ChampionHall.jsx         # ทำเนียบแชมป์ประจำฤดูกาล (ข้อมูลจาก data.js)
│       ├── PositionBadge.jsx        # Badge อันดับ สี CL/EL/ตกชั้น
│       ├── LogoImage.jsx            # img พร้อม fallback
│       └── ErrorBoundary.jsx        # React class error boundary
├── index.html                       # HTML entry point
├── vite.config.js                   # Vite + react plugin + proxy /api → :3001
├── package.json
├── .env                             # FOOTBALL_API_KEY, DB_PATH (ห้าม commit)
├── vercel.json                      # Deploy config สำหรับ Vercel
└── render.yaml                      # Deploy config สำหรับ Render (persistent disk)
```

---

## Environment Variables

```env
FOOTBALL_API_KEY=your_key_here   # จาก api-football.com (Free: 100 calls/day)
DB_PATH=./database.db             # path ของ SQLite (Render ใช้ /data/database.db)
PORT=3001                         # optional, default 3001
```

---

## Development Commands

```bash
# Install
npm install

# รัน backend (Terminal 1)
node server.js

# รัน frontend (Terminal 2)
npm run dev          # http://localhost:5173

# Build production
npm run build

# Preview production build
npm run preview
```

---

## API Endpoints (server.js)

| Method | Endpoint                | คำอธิบาย                          | TTL (db/cache.js)  |
|--------|-------------------------|-----------------------------------|--------------------|
| GET    | /api/standings/:code    | ตารางคะแนน                        | STANDINGS = 1 ชม.  |
| GET    | /api/matches/:code      | ผลและโปรแกรม (±30/14 วัน)        | FIXTURES_LIVE = 30 นาที |
| GET    | /api/scorers/:code      | ดาวซัลโว top 10                   | TOP_SCORERS = 6 ชม.|
| GET    | /api/assists/:code      | ท็อปแอสซิสต์ top 10               | TOP_SCORERS = 6 ชม.|
| GET    | /api/squad/:teamId      | รายชื่อนักเตะทีม                  | PLAYERS = 24 ชม.   |
| GET    | /api/coach/:teamId      | Head Coach                        | PLAYERS = 24 ชม.   |

**League codes:** `PL` (39), `PD` (140), `BL1` (78), `SA` (135), `FL1` (61)

---

## Database / Cache Architecture

`db/cache.js` เป็น singleton module ที่ทุก route ใช้ร่วมกัน:

```js
// pattern หลัก — ใช้ใน server.js ทุก route
const data = await withCache(endpoint, params, async () => {
  // fetch จาก API จริง (ถ้า cache miss)
}, TTL.STANDINGS);
```

**Tables ใน SQLite:**
- `api_cache` — generic cache สำหรับทุก endpoint (key = sha256 hash ของ endpoint+params)
- `standings` — ตารางคะแนน parsed พร้อม team join
- `fixtures` — ผลการแข่งขัน + live/upcoming
- `teams`, `leagues`, `players` — master data
- `top_scorers` — ดาวซัลโว/แอสซิสต์
- `cache_meta` — schema version, created_at

---

## Known Issues / Bugs (แก้แล้ว)

| Bug | ไฟล์ | สถานะ |
|-----|------|--------|
| `server.js` import `withCache` แต่ไม่ได้ใช้ (ใช้ Map แทน) | server.js | ✅ แก้แล้ว |
| `server.js` สร้าง `new Database()` ซ้ำซ้อนกับ `db/cache.js` | server.js | ✅ แก้แล้ว |
| TTL ทุก endpoint เท่ากัน 5 นาที ไม่ใช้ค่าจาก `db/cache.js` | server.js | ✅ แก้แล้ว |
| `vite.config.js` import `defineConfig`+`react` แต่ไม่ได้ใช้ | vite.config.js | ✅ แก้แล้ว |

---

## Component Guide

### เพิ่มลีกใหม่
1. เพิ่ม object ใน `src/data.js` → `LEAGUES` array
2. เพิ่ม league ID ใน `server.js` → `LEAGUE_IDS`
3. เพิ่มข้อมูลแชมป์ใน `src/data.js` → `CHAMPIONS` object

### เพิ่ม tab ใหม่ใน LeagueView
1. เพิ่ม entry ใน `tabs` array ใน `LeagueView.jsx`
2. สร้าง component ใหม่ใน `src/components/`
3. เพิ่ม endpoint ใน `server.js`
4. render ใน LeagueView ด้วย `{tab === "key" && <MyComponent leagueId={league.id} />}`

### CSS Variables (App.css)
```css
--bg: #0a0a0f          /* พื้นหลังหลัก */
--bg2: #12121a         /* พื้นหลังรอง */
--bg3: #1a1a26         /* พื้นหลัง card/header */
--accent: #6c63ff      /* สีหลัก (ม่วง) */
--green: #22c77a       /* goal diff บวก, DF badge */
--red: #f44            /* goal diff ลบ, ตกชั้น */
--live: #ff3b3b        /* live match indicator */
```

### Position Badge Colors (SquadModal, Topscorers)
```js
Goalkeeper: "#f5a623"   // ส้ม
Defender:   "#22c77a"   // เขียว
Midfielder: "#6c63ff"   // ม่วง
Attacker:   "#f44"      // แดง
```

---

## Deployment

### Render (Backend)
- ใช้ `render.yaml` — persistent disk ที่ `/data/database.db` เพื่อให้ SQLite อยู่รอดหลัง restart
- ตั้ง env var `FOOTBALL_API_KEY` ใน Render dashboard

### Vercel (Frontend)
- ใช้ `vercel.json` — rewrite `/api/*` → `server.js` (serverless)
- ⚠️ **Note:** Vercel serverless ไม่รองรับ SQLite persistent storage — ใช้ Render แทนสำหรับ backend ที่มี DB

### แนะนำ: แยก deploy
```
Render  → node server.js  (Express + SQLite)
Vercel  → npm run build   (React SPA เท่านั้น)
```

---

## API Rate Limits

| Plan  | Calls/day | หมายเหตุ                         |
|-------|-----------|----------------------------------|
| Free  | 100       | เพียงพอสำหรับ dev + cache ดีๆ   |
| Basic | 3,000     | แนะนำสำหรับ production           |

ด้วย SQLite cache ปัจจุบัน: ~15 API calls/วัน (5 ลีก × 3 endpoints) เมื่อ cache hot
