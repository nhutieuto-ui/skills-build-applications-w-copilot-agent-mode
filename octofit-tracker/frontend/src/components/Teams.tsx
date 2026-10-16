import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot?: string; members: string[] };
type TeamResponse = { teams: Team[] };

function loadTeams() {
  return getJson<TeamResponse>('/api/teams');
}

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      loadData={loadTeams}
      isEmpty={(data) => data.teams.length === 0}
    >
      {({ teams }) => (
        <ul className="list-group list-group-flush">
          {teams.map((team) => (
            <li className="list-group-item px-0" key={team.name}>
              <strong>{team.name}</strong>
              {team.mascot ? ` · ${team.mascot}` : ''} · {team.members.length} members
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
