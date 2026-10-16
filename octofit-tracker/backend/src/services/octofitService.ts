import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

type ServiceError = Error & { status: number };

function serviceError(status: number, message: string): ServiceError {
  return Object.assign(new Error(message), { status });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isObjectId(input: unknown): input is string {
  return typeof input === 'string' && mongoose.isObjectIdOrHexString(input);
}

function normalizeFocus(focus: string): string {
  const normalized = focus.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'bike', 'cardio', 'endurance'].includes(normalized)) return 'endurance';
  if (['strength', 'weightlifting', 'lifting', 'resistance'].includes(normalized)) return 'strength';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw serviceError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw serviceError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw serviceError(400, 'Activity minutes must be a positive number');

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) throw serviceError(400, 'The requested user or team does not exist');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw serviceError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members === undefined ? [] : input.members;
  if (typeof name !== 'string' || !name.trim()) throw serviceError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw serviceError(400, 'Team mascot is required');
  if (!Array.isArray(members) || !members.every(isObjectId)) throw serviceError(400, 'Team members must be valid user IDs');

  if (members.length > 0) {
    const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
    if (existingMembers.length !== new Set(members).size) throw serviceError(400, 'One or more team members do not exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw serviceError(404, 'No user found for that email address');

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
  ]);
  const goalFocus = normalizeFocus(user.fitnessGoal);
  const recentFocuses = [...new Set(recentActivities.map((activity) => normalizeFocus(activity.type)))];
  const orderedWorkouts = [...workouts].sort((first, second) => {
    const firstGoalMatch = normalizeFocus(first.focus) === goalFocus ? 1 : 0;
    const secondGoalMatch = normalizeFocus(second.focus) === goalFocus ? 1 : 0;
    if (firstGoalMatch !== secondGoalMatch) return secondGoalMatch - firstGoalMatch;
    return recentFocuses.indexOf(normalizeFocus(second.focus)) - recentFocuses.indexOf(normalizeFocus(first.focus));
  });

  return orderedWorkouts.map((workout) => {
    const focus = normalizeFocus(workout.focus);
    const recentActivity = recentActivities.find((activity) => normalizeFocus(activity.type) === focus);
    const reason = focus === goalFocus
      ? `Recommended for your ${user.fitnessGoal} goal.`
      : recentActivity
        ? `Recommended based on your recent ${recentActivity.type} activity.`
        : 'Suggested as an alternative workout.';
    return { ...workout, reason };
  });
}

export { User };
