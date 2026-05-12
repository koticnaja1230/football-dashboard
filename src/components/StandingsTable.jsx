import { useState } from "react";
import LogoImage from "./LogoImage.jsx";
import PositionBadge from "./PositionBadge.jsx";
import SquadModal from "./SquadModal.jsx";

export default function StandingsTable({ table }) {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <>
      <div className="table-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th>อันดับ</th>
              <th className="team-col">ทีม</th>
              <th>แข่ง</th>
              <th>ชนะ</th>
              <th>เสมอ</th>
              <th>แพ้</th>
              <th>ได้</th>
              <th>เสีย</th>
              <th>ผลต่าง</th>
              <th>คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row) => (
              <tr
                key={row.team.id}
                className="clickable-row"
                onClick={() => setSelectedTeam(row.team)}
                title={`ดู Squad ${row.team.name}`}
              >
                <td>
                  <PositionBadge pos={row.position} />
                </td>
                <td className="team-col">
                  {row.team.crest && (
                    <LogoImage
                      src={row.team.crest}
                      alt={row.team.name}
                      className="team-crest"
                      emoji="⚽"
                      style={{ objectFit: "contain" }}
                    />
                  )}
                  <span className="team-label">
                    {row.team.shortName || row.team.name}
                  </span>
                  <span className="squad-hint">👥</span>
                </td>
                <td>{row.playedGames}</td>
                <td>{row.won}</td>
                <td>{row.draw}</td>
                <td>{row.lost}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td
                  className={
                    row.goalDifference > 0
                      ? "pos"
                      : row.goalDifference < 0
                        ? "neg"
                        : ""
                  }
                >
                  {row.goalDifference > 0
                    ? `+${row.goalDifference}`
                    : row.goalDifference}
                </td>
                <td className="pts">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedTeam && (
        <SquadModal
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </>
  );
}
