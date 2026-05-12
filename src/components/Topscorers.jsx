import { useState, useEffect } from "react";

export default function TopScorers({ leagueId }) {
  const [scorers, setScorers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/scorers/${leagueId}`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => setScorers(d.scorers || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [leagueId]);

  if (loading) return <div className="state-box"><div className="spinner" /><p>กำลังโหลด...</p></div>;
  if (error)   return <div className="state-box error"><p>⚠️ {error}</p></div>;

  return (
    <div className="scorers-wrap">
      <table className="scorers-table">
        <thead>
          <tr>
            <th>#</th>
            <th>นักเตะ</th>
            <th>ทีม</th>
            <th>⚽ ประตู</th>
            <th>🅰️ แอสซิสต์</th>
            <th>นัด</th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((s, i) => (
            <tr key={s.player.id} className={i < 3 ? "top-three" : ""}>
              <td>
                <span className={`scorer-rank rank-${i + 1}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
              </td>
              <td className="scorer-player">
                <img
                  src={s.player.photo}
                  alt={s.player.name}
                  className="scorer-photo"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.player.name)}&background=1a1a26&color=9090a8&size=40&bold=true`;
                  }}
                />
                <span>{s.player.name}</span>
              </td>
              <td className="scorer-team">
                <img src={s.team.logo} alt={s.team.name} className="scorer-team-logo" />
                <span>{s.team.name}</span>
              </td>
              <td className="scorer-goals">{s.goals}</td>
              <td className="scorer-assists">{s.assists ?? "—"}</td>
              <td>{s.games}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}