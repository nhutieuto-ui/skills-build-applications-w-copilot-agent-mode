import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

function loadActivities() {
  return getJson<ActivityResponse>('/api/activities');
}

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      emptyMessage="No activities yet."
      loadData={loadActivities}
      isEmpty={(data) => data.activities.length === 0}
    >
      {({ activities }) => (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li className="list-group-item px-0" key={`${activity.type}-${index}`}>
              <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
