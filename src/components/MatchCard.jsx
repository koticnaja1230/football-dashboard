import LogoImage from "./LogoImage.jsx";

export default function MatchCard({ match }) {
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "IN_PLAY" || match.status === "PAUSED";
  const date = new Date(match.utcDate);
  const dateStr = date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
  const timeStr = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`match-card${isLive ? " live" : ""}`}>
      <div className="match-date">
        {isLive ? (
          <span className="live-dot">● LIVE</span>
        ) : (
          `${dateStr} · ${timeStr}`
        )}
      </div>
      <div className="match-teams">
        <span className="team-name home">
          {match.homeTeam.shortName || match.homeTeam.name}
        </span>
        <span className="match-score">
          {isFinished || isLive
            ? `${match.score.fullTime.home ?? "–"} : ${match.score.fullTime.away ?? "–"}`
            : "vs"}
        </span>
        <span className="team-name away">
          {match.awayTeam.shortName || match.awayTeam.name}
        </span>
      </div>
      {match.matchday && (
        <div className="match-day">นัดที่ {match.matchday}</div>
      )}
    </div>
  );
}
