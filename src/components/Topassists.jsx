import { useState, useEffect } from "react";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function TopAssists({ leagueId }) {
  const [assisters, setAssisters] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/assists/${leagueId}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((d) => setAssisters(d.assisters || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  if (loading)
    return (
      <div className="state-box">
        <div className="spinner" />
        <p>กำลังโหลด...</p>
      </div>
    );

  if (error)
    return (
      <div className="state-box error">
        <p>⚠️ {error}</p>
      </div>
    );

  return (
    <div className="scorers-wrap">
      {/* Header — แอสซิสต์นำ, ประตูรอง */}
      <div className="scorers-head">
        <span className="sh-rank">#</span>
        <span className="sh-left">นักเตะ</span>
        <span className="sh-left">ทีม</span>
        <span className="sh-center">🅰️&nbsp;แอสซิสต์</span>
        <span className="sh-center">⚽&nbsp;ประตู</span>
        <span className="sh-center">นัด</span>
      </div>

      {assisters.map((s, i) => (
        <div
          key={s.player.id}
          className={`scorers-row${i < 3 ? " top-three" : ""}${i === 0 ? " rank-1" : ""}`}
        >
          {/* อันดับ */}
          <div className="sc-rank">
            {i < 3 ? (
              <span className="medal">{MEDAL[i]}</span>
            ) : (
              <span className="rank-num">{i + 1}</span>
            )}
          </div>

          {/* นักเตะ */}
          <div className="sc-player">
            <div className="sc-photo-wrap">
              <img
                src={s.player.photo}
                alt={s.player.name}
                className="sc-photo"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.player.name)}&background=1a1a26&color=9090a8&size=80&bold=true`;
                }}
              />
            </div>
            <div className="sc-player-text">
              <span className="sc-name">{s.player.name}</span>
              <span className="sc-nat">
                {s.player.nationality} · {s.player.age} ปี
              </span>
            </div>
          </div>

          {/* ทีม */}
          <div className="sc-team">
            <img
              src={s.team.logo}
              alt={s.team.name}
              className="sc-team-logo"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <span className="sc-team-name">{s.team.name}</span>
          </div>

          {/* แอสซิสต์ — primary stat */}
          <div className="sc-stat">
            <span className="sc-assists">{s.assists ?? "—"}</span>
          </div>

          {/* ประตู — secondary stat */}
          <div className="sc-stat goals-cell">
            <span className="sc-goals">{s.goals ?? "—"}</span>
          </div>

          {/* นัด */}
          <div className="sc-stat">
            <span className="sc-games">{s.games}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
