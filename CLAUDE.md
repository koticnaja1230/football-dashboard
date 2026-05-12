# Football Dashboard — CLAUDE.md

## Project Overview

A football (soccer) dashboard web application built with React + Vite (frontend) and Express.js (backend). The app displays league standings, match results, and a champion hall of fame.

## Tech Stack

- **Frontend**: React 18, Vite, CSS Modules
- **Backend**: Express.js (Node.js), CORS
- **Build**: Vite with `@vitejs/plugin-react`

## Project Structure

```
football-dashboard/
├── src/
│   ├── App.jsx                   # Root app component, routing/layout
│   ├── App.css                   # Global styles
│   ├── main.jsx                  # React entry point
│   ├── data.js                   # Static league/match data
│   ├── components/
│   │   ├── ChampionHall.jsx      # Hall of champions display
│   │   ├── ErrorBoundary.jsx     # React error boundary wrapper
│   │   ├── LeagueView.jsx        # League overview (standings + matches)
│   │   ├── LogoImage.jsx         # Club/league logo component
│   │   ├── MatchCard.jsx         # Individual match result card
│   │   ├── PositionBadge.jsx     # Table position indicator badge
│   │   └── StandingsTable.jsx    # League standings table
│   └── hooks/
│       └── useLeagueData.js      # Custom hook for league data fetching/state
├── server.js                     # Express API server
├── vite.config.js                # Vite configuration
├── package.json
└── dist/                         # Production build output
```

## Development Commands

```bash
# Install dependencies
npm install

# Start frontend dev server (Vite)
npm run dev

# Start backend API server
node server.js

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Notes

- **Data layer**: `src/data.js` holds static match/league data; `useLeagueData.js` hook manages data fetching and state
- **Server**: `server.js` is an Express app serving as the API backend, likely proxying or serving football data with CORS enabled
- **Components are self-contained**: each component in `src/components/` handles its own rendering logic
- **Error handling**: `ErrorBoundary.jsx` wraps the component tree to catch render errors gracefully

## Key Conventions

- Components use `.jsx` extension
- Custom hooks live in `src/hooks/` and follow the `use*` naming convention
- Styles are in `App.css` (global); add component-scoped styles as `ComponentName.module.css` if needed
- Backend and frontend run on separate ports in development; configure proxy in `vite.config.js` if needed

## Common Tasks

### Adding a new league
1. Add league data to `src/data.js`
2. Update `useLeagueData.js` if data fetching logic needs adjustment
3. `LeagueView.jsx` should pick it up automatically if it maps over available leagues

### Adding a new component
1. Create `src/components/MyComponent.jsx`
2. Import and use in the appropriate parent component
3. Keep components focused on a single responsibility

### Updating the backend API
- Edit `server.js` to add/modify Express routes
- The frontend connects via the configured API base URL (check `useLeagueData.js` or `vite.config.js` for proxy setup)

## Environment

- Node.js required (check `package.json` `engines` field if present)
- No `.env` files detected — if adding environment variables, use `VITE_` prefix for frontend vars and load with `import.meta.env`
