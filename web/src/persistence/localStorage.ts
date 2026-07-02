import type { LeaderboardEntry, SavedSession } from '../simulation/types';

const SESSION_KEY = 'dawn-sessions-v1';
const LEADERBOARD_KEY = 'dawn-leaderboard-v1';
const MAX_SESSIONS = 12;
const MAX_LEADERBOARD = 20;

export function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(session: SavedSession): SavedSession[] {
  const existing = loadSessions().filter((item) => item.id !== session.id);
  const next = [session, ...existing].slice(0, MAX_SESSIONS);
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export function deleteSession(id: string): SavedSession[] {
  const next = loadSessions().filter((item) => item.id !== id);
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LeaderboardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushLeaderboard(entry: LeaderboardEntry): LeaderboardEntry[] {
  const next = [entry, ...loadLeaderboard()].slice(0, MAX_LEADERBOARD);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(next));
  return next;
}

export function clearLeaderboard(): LeaderboardEntry[] {
  localStorage.removeItem(LEADERBOARD_KEY);
  return [];
}
