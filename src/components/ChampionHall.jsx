import LogoImage from "./LogoImage.jsx";
import { CHAMPIONS } from "../data.js";

export default function ChampionHall({ leagueId }) {
  const items = CHAMPIONS[leagueId] || [];

  return (
    <div className="champ-grid">
      {items.map((item) => (
        <div className="champ-card" key={`${item.title}-${item.club}`}>
          <div className="champ-card-top">
            <LogoImage
              src={item.trophy}
              alt={item.trophyLabel}
              emoji="🏆"
              className="trophy-logo"
            />
            <div>
              <p className="champ-label">{item.title}</p>
              <p className="champ-sub">{item.label}</p>
            </div>
          </div>
          <div className="champ-club">
            <LogoImage
              src={item.logo}
              alt={item.club}
              emoji="⚽"
              className="champ-team-logo"
            />
            <div>
              <h3>{item.club}</h3>
              <p>{item.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
