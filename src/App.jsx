import { useState } from "react";
import "./App.css";
import { LEAGUES } from "./data.js";
import LeagueView from "./components/LeagueView.jsx";

export default function App() {
  const [active, setActive] = useState(LEAGUES[0]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚽</span>
            <span className="logo-text">
              Euro<strong>5</strong> Dashboard
            </span>
          </div>
        </div>
      </header>

      <nav className="league-nav">
        {LEAGUES.map((league) => (
          <button
            key={league.id}
            className={`league-btn${active.id === league.id ? " active" : ""}`}
            style={{ "--lc": league.color }}
            onClick={() => setActive(league)}
          >
            <img src={league.logo} alt={league.name} className="league-logo" />
            <span className="league-info">
              <span className="league-name">{league.name}</span>
              <span className="league-country">{league.country}</span>
            </span>
          </button>
        ))}
      </nav>

      <main className="main-content">
        <div className="league-header" style={{ borderColor: active.color }}>
          <img src={active.logo} alt={active.name} className="lh-logo" />
          <div>
            <h1>{active.name}</h1>
            <p>{active.country}</p>
          </div>
        </div>
        <LeagueView key={active.id} league={active} />
      </main>

      <footer className="app-footer">
        Data by{" "}
        <a
          href="https://www.football-data.org"
          target="_blank"
          rel="noreferrer"
        >
          football-data.org
        </a>
      </footer>
    </div>
  );
}
