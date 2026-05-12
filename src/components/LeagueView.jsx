import { useState } from "react";
import { useLeagueData } from "../hooks/useLeagueData.js";
import MatchCard from "./MatchCard.jsx";
import StandingsTable from "./StandingsTable.jsx";
import ChampionHall from "./ChampionHall.jsx";

const tabs = [
  { key: "standings", label: "ตารางคะแนน" },
  { key: "recent", label: "ผลล่าสุด" },
  { key: "upcoming", label: "โปรแกรมต่อไป" },
  { key: "champ", label: "ทำเนียบแชมป์" },
];

export default function LeagueView({ league }) {
  const { standings, matches, loading, error, refetch } = useLeagueData(
    league.id,
  );
  const [tab, setTab] = useState("standings");

  const finished =
    matches
      ?.filter((match) => match.status === "FINISHED")
      .slice(-10)
      .reverse() || [];
  const scheduled =
    matches
      ?.filter(
        (match) => match.status === "SCHEDULED" || match.status === "TIMED",
      )
      .slice(0, 10) || [];
  const live =
    matches?.filter(
      (match) => match.status === "IN_PLAY" || match.status === "PAUSED",
    ) || [];

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner" />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-box error">
        <p>⚠️ {error}</p>
        <button onClick={refetch} className="retry-btn">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="league-view">
      <div className="view-tabs">
        {tabs.map(({ key, label }) => {
          const count =
            key === "recent"
              ? finished.length
              : key === "upcoming"
                ? scheduled.length
                : 0;
          return (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
              {count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}

        {live.length > 0 && (
          <button
            className={`live-tab${tab === "live" ? " active" : ""}`}
            onClick={() => setTab("live")}
          >
            🔴 Live ({live.length})
          </button>
        )}
      </div>

      {tab === "standings" && standings && <StandingsTable table={standings} />}
      {tab === "recent" && (
        <div className="matches-grid">
          {finished.length === 0 ? (
            <p className="empty">ยังไม่มีผลการแข่งขัน</p>
          ) : (
            finished.map((match) => <MatchCard key={match.id} match={match} />)
          )}
        </div>
      )}
      {tab === "upcoming" && (
        <div className="matches-grid">
          {scheduled.length === 0 ? (
            <p className="empty">ยังไม่มีโปรแกรม</p>
          ) : (
            scheduled.map((match) => <MatchCard key={match.id} match={match} />)
          )}
        </div>
      )}
      {tab === "champ" && <ChampionHall leagueId={league.id} />}
      {tab === "live" && (
        <div className="matches-grid">
          {live.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      <div className="legend">
        <span className="pos-badge pos-cl">1–4</span> Champions League &nbsp;
        <span className="pos-badge pos-el">5–6</span> Europa League &nbsp;
        <span className="pos-badge pos-rel">18–20</span> ตกชั้น
      </div>
    </div>
  );
}
