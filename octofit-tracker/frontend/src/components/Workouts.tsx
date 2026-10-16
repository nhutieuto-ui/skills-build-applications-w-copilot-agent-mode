import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus?: string; minutes?: number; reason?: string };
type WorkoutResponse = { suggestions: Workout[] };

function loadWorkouts() {
  return getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`);
}

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions yet."
      loadData={loadWorkouts}
      isEmpty={(data) => data.suggestions.length === 0}
    >
      {({ suggestions }) => (
        <ul className="list-group list-group-flush">
          {suggestions.map((workout) => (
            <li className="list-group-item px-0" key={workout.title}>
              <strong>{workout.title}</strong>
              {workout.focus ? ` · ${workout.focus}` : ''}
              {workout.minutes ? ` · ${workout.minutes} minutes` : ''}
              {workout.reason && <p className="mb-0">{workout.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
