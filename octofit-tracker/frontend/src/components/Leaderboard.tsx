import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

function loadLeaderboard() {
  return getJson<LeaderboardResponse>('/api/leaderboard');
}

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard rankings yet."
      loadData={loadLeaderboard}
      isEmpty={(data) => data.leaderboard.length === 0}
    >
      {({ leaderboard }) => (
        <ol className="list-group list-group-numbered list-group-flush">
          {leaderboard.map((entry) => (
            <li className="list-group-item d-flex justify-content-between gap-3 px-0" key={entry.rank}>
              <span>{entry.teamName}</span>
              <strong>{entry.totalPoints} points</strong>
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
