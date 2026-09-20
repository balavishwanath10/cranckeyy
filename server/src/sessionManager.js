import { 
  getActiveSession, 
  getLatestSession,
  createNewSession, 
  touchSession, 
  openSession,
  sealSession, 
  getAllSessions, 
  getSessionMessages 
} from './db.js';

/**
 * Retrieves the currently valid session.
 * Always keeps the latest session open instead of auto-creating a new one on timeout.
 * A new session is ONLY created when explicitly started by the user via "+ New Session",
 * or if no session has ever been created yet.
 * @returns {object} active session
 */
export function getOrCreateCurrentSession() {
  // 1. If any session is currently active (whether latest or an archive opened by click), keep it open!
  const active = getActiveSession();
  if (active) {
    return active;
  }

  // 2. If no session is active, open and keep the latest session active!
  const latest = getLatestSession();
  if (latest) {
    console.log(`[Session Manager] Keeping latest session open: ${latest.id}`);
    return openSession(latest.id);
  }

  // 3. Only if zero sessions exist in the database at all, create the very first session
  console.log('[Session Manager] No sessions found in DB. Creating initial session...');
  return createNewSession();
}

/**
 * Call whenever a message is sent in the active session
 * @param {string} sessionId 
 */
export function recordSessionActivity(sessionId) {
  touchSession(sessionId);
}

export { getAllSessions, getSessionMessages };
