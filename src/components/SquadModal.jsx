import { useState, useEffect } from "react";

const POS_ORDER = { Goalkeeper: 0, Defender: 1, Midfielder: 2, Attacker: 3 };
const POS_TH    = { Goalkeeper: "ผู้รักษาประตู", Defender: "กองหลัง", Midfielder: "กองกลาง", Attacker: "กองหน้า" };
const POS_SHORT = { Goalkeeper: "GK", Defender: "DF", Midfielder: "MF", Attacker: "FW" };
const POS_COLOR = { Goalkeeper: "#f5a623", Defender: "#22c77a", Midfielder: "#6c63ff", Attacker: "#f44" };

export default function SquadModal({ team, onClose }) {
  const [squad,   setSquad]   = useState(null);
  const [coach,   setCoach]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("All");

  // ดึง squad + coach พร้อมกัน
  useEffect(() => {
    setLoading(true); setError(null);
    Promise.all([
      fetch(`/api/squad/${team.id}`).then((r) => { if (!r.ok) throw new Error(`Squad error ${r.status}`); return r.json(); }),
      fetch(`/api/coach/${team.id}`).then((r) => { if (!r.ok) return null; return r.json(); }),
    ])
      .then(([squadData, coachData]) => {
        setSquad(squadData.squad || []);
        setCoach(coachData?.coach || null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [team.id]);

  // ปิดด้วย Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // ล็อก scroll body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const positions   = ["All", "Goalkeeper", "Defender", "Midfielder", "Attacker"];
  const filtered    = squad?.filter((p) => filter === "All" || p.position === filter) || [];
  const grouped     = filtered.reduce((acc, p) => {
    const pos = p.position || "Unknown";
    (acc[pos] = acc[pos] || []).push(p);
    return acc;
  }, {});
  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (POS_ORDER[a] ?? 9) - (POS_ORDER[b] ?? 9)
  );

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-team-info">
            {team.crest && (
              <img src={team.crest} alt={team.name} className="modal-team-crest"
                onError={(e) => { e.target.style.display = "none"; }} />
            )}
            <div>
              <h2>{team.name}</h2>
              <p className="modal-season">ฤดูกาล 2024/2025</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="close">✕</button>
        </div>

        {/* ── Head Coach Banner ── */}
        {coach && (
          <div className="coach-banner">
            <div className="coach-photo-wrap">
              <img
                src={coach.photo}
                alt={coach.name}
                className="coach-photo"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=1a1a26&color=6c63ff&size=80&bold=true`;
                }}
              />
            </div>
            <div className="coach-info">
              <span className="coach-badge">🎽 Head Coach</span>
              <span className="coach-name">{coach.name}</span>
              <div className="coach-meta">
                {coach.nationality && <span>🌍 {coach.nationality}</span>}
                {coach.age        && <span>· {coach.age} ปี</span>}
                {coach.career?.contract?.start && (
                  <span>· เริ่มงาน {new Date(coach.career.contract.start).toLocaleDateString("th-TH", { year: "numeric", month: "short" })}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Position filter ── */}
        <div className="modal-filters">
          {positions.map((pos) => {
            const cnt = pos === "All" ? squad?.length : squad?.filter((p) => p.position === pos).length;
            return (
              <button
                key={pos}
                className={`filter-btn${filter === pos ? " active" : ""}`}
                style={filter === pos && pos !== "All"
                  ? { borderColor: POS_COLOR[pos], color: POS_COLOR[pos], background: POS_COLOR[pos] + "18" }
                  : {}}
                onClick={() => setFilter(pos)}
              >
                {pos === "All" ? "ทั้งหมด" : `${POS_SHORT[pos]} ${POS_TH[pos]}`}
                {squad && cnt !== undefined && <span className="filter-count">{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        <div className="modal-body">
          {loading && (
            <div className="state-box">
              <div className="spinner" />
              <p>กำลังโหลด Squad...</p>
            </div>
          )}
          {error && <div className="state-box error"><p>⚠️ {error}</p></div>}

          {!loading && !error && squad && (
            <div className="squad-content">
              {sortedGroups.length === 0 && <p className="empty">ไม่มีข้อมูล</p>}
              {sortedGroups.map(([pos, players]) => (
                <div key={pos} className="squad-group">
                  <div className="squad-group-header">
                    <span className="squad-pos-badge" style={{ background: POS_COLOR[pos] + "22", color: POS_COLOR[pos] }}>
                      {POS_SHORT[pos] || pos}
                    </span>
                    <span style={{ color: POS_COLOR[pos] }}>{POS_TH[pos] || pos}</span>
                    <span className="squad-count">{players.length} คน</span>
                  </div>
                  <div className="squad-grid">
                    {players.map((p) => (
                      <div key={p.id} className="player-card">
                        <div className="player-photo-wrap">
                          <img
                            src={p.photo}
                            alt={p.name}
                            className="player-photo"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1a1a26&color=9090a8&size=80&bold=true`;
                            }}
                          />
                          {p.number != null && (
                            <span className="player-number" style={{ background: POS_COLOR[p.position] }}>
                              {p.number}
                            </span>
                          )}
                        </div>
                        <div className="player-info">
                          <span className="player-name">{p.name}</span>
                          {p.age && <span className="player-age">{p.age} ปี</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
