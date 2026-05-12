# Euro5 Football Dashboard

แอปนี้เป็น dashboard ฟุตบอลที่รันทั้งหน้า frontend และ backend ในโปรเจกต์เดียวกัน

## โครงสร้างโปรเจกต์

```
football-dashboard/
?ฤฤ package.json
?ฤฤ package-lock.json
?ฤฤ vite.config.js
?ฤฤ server.js
?ฤฤ index.html
?ฤฤ README.md
?ฤฤ .gitignore
ภฤฤ src/
    ?ฤฤ App.css
    ?ฤฤ App.jsx
    ?ฤฤ main.jsx
    ?ฤฤ data.js
    ?ฤฤ hooks/
    ณ   ภฤฤ useLeagueData.js
    ภฤฤ components/
        ?ฤฤ ChampionHall.jsx
        ?ฤฤ ErrorBoundary.jsx
        ?ฤฤ LeagueView.jsx
        ?ฤฤ LogoImage.jsx
        ?ฤฤ MatchCard.jsx
        ?ฤฤ PositionBadge.jsx
        ภฤฤ StandingsTable.jsx
```

## วิธีติดตั้ง

```bash
cd d:\football-dashboard
npm install
```

## ตั้งค่า API Key

ไฟล์ backend (`server.js`) ใช้ค่า `process.env.FOOTBALL_API_KEY` ดังนั้นต้องตั้งค่าสภาพแวดล้อมก่อนรัน

ตัวอย่าง Windows PowerShell:

```powershell
$env:FOOTBALL_API_KEY = "YOUR_API_KEY_HERE"
npm run server
```

## รัน backend

```bash
npm run server
```

Backend จะเปิดที่ `http://localhost:3001`

## รัน frontend

```bash
npm run dev
```

Frontend จะเปิดที่ `http://localhost:5173`

## สคริปต์สำคัญ

- `npm run dev` — รัน Vite development server
- `npm run build` — สร้างไฟล์ production
- `npm run preview` — พรีวิว build ที่สร้างแล้ว
- `npm run server` — รัน backend API
- `npm start` — alias ของ `npm run server`

## หมายเหตุ

ถ้าต้องการแก้ไขหรือเพิ่มทีม ให้แก้ใน `src/data.js` และปรับพอร์ทัล UI ใน `src/components` ได้โดยตรง

API ที่ใช้จาก `https://v3.football.api-sports.io`
