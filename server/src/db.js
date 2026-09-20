import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cranckeyy.sqlite');
const db = new DatabaseSync(dbPath);

// Enable WAL mode
db.exec(`PRAGMA journal_mode = WAL;`);

// Initialize Database Schema supporting Email or Phone Number
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    phone_number TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    partner_alias TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pairs (
    id TEXT PRIMARY KEY,
    user1_phone TEXT NOT NULL,
    user2_phone TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    last_active_at INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    text TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    media_type TEXT DEFAULT '',
    reply_to_id TEXT,
    reply_to_json TEXT,
    reactions_json TEXT DEFAULT '{}',
    is_edited INTEGER DEFAULT 0,
    is_read INTEGER DEFAULT 0,
    read_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Safe migrations for existing databases
try {
  db.exec(`ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0;`);
} catch {}
try {
  db.exec(`ALTER TABLE messages ADD COLUMN read_at INTEGER;`);
} catch {}
try {
  // Normalize existing phone records by removing spaces and dashes
  db.exec(`UPDATE users SET phone_number = replace(replace(phone_number, ' ', ''), '-', '') WHERE phone_number NOT LIKE '%@%';`);
  db.exec(`UPDATE pairs SET user1_phone = replace(replace(user1_phone, ' ', ''), '-', '') WHERE user1_phone NOT LIKE '%@%';`);
  db.exec(`UPDATE pairs SET user2_phone = replace(replace(user2_phone, ' ', ''), '-', '') WHERE user2_phone NOT LIKE '%@%';`);
  db.exec(`ALTER TABLE users ADD COLUMN partner_note TEXT DEFAULT '';`);
  db.exec(`ALTER TABLE users ADD COLUMN partner_avatar TEXT DEFAULT '';`);
} catch {}

// Universal identifier normalizer for email and phone numbers
export function normalizeIdentifier(val) {
  if (!val) return '';
  const str = String(val).trim().toLowerCase();
  if (str.includes('@')) {
    return str.replace(/\s+/g, '');
  }
  // Phone number: strip spaces, dashes, parentheses, dots
  let digits = str.replace(/[\s\-\(\)\.]/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

// Users (supports either phone number or email in phone_number column)
export function getUser(identifier) {
  if (!identifier) return null;
  const clean = normalizeIdentifier(identifier);
  const query = db.prepare(`SELECT * FROM users WHERE phone_number = ?`);
  let row = query.get(clean);
  if (!row && !clean.includes('@')) {
    const digits = clean.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      const allUsers = db.prepare(`SELECT * FROM users`).all();
      row = allUsers.find(u => (u.phone_number || '').replace(/\D/g, '').endsWith(last10));
    }
  }
  if (!row) return null;
  const pair = getPairForUser(row.phone_number);
  return {
    ...row,
    identifier: row.phone_number,
    partnerId: pair ? pair.partnerId : null,
    partnerPhone: pair ? pair.partnerId : null
  };
}

export function getAllUsers() {
  const query = db.prepare(`SELECT * FROM users ORDER BY created_at ASC`);
  const rows = query.all();
  return rows.map(r => ({
    ...r,
    identifier: r.phone_number
  }));
}

export function upsertUser(identifier, displayName = '', avatarUrl = '', partnerAlias = '') {
  if (!identifier) return null;
  const clean = normalizeIdentifier(identifier);
  const existing = getUser(clean);

  if (!existing) {
    const isEmailFormat = clean.includes('@');
    const defaultName = displayName || (isEmailFormat ? clean.split('@')[0] : `User ${clean.slice(-4)}`);
    const insert = db.prepare(`
      INSERT INTO users (phone_number, display_name, avatar_url, partner_alias, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(clean, defaultName, avatarUrl, partnerAlias, Date.now());
    return getUser(clean);
  } else {
    const update = db.prepare(`
      UPDATE users SET 
        display_name = COALESCE(NULLIF(?, ''), display_name),
        avatar_url = COALESCE(NULLIF(?, ''), avatar_url),
        partner_alias = COALESCE(NULLIF(?, ''), partner_alias)
      WHERE phone_number = ?
    `);
    update.run(displayName, avatarUrl, partnerAlias, existing.phone_number);
    return getUser(existing.phone_number);
  }
}

export function getPairForUser(identifier) {
  if (!identifier) return null;
  const clean = normalizeIdentifier(identifier);

  // 1. Direct match on clean
  let row = db.prepare(`
    SELECT * FROM pairs 
    WHERE user1_phone = ? OR user2_phone = ?
    LIMIT 1
  `).get(clean, clean);

  // 2. If no direct match and identifier is a phone number, match by last 10 digits
  if (!row && !clean.includes('@')) {
    const digits = clean.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last10 = digits.slice(-10);
      const allPairs = db.prepare(`SELECT * FROM pairs`).all();
      row = allPairs.find(p => {
        const u1Digits = (p.user1_phone || '').replace(/\D/g, '');
        const u2Digits = (p.user2_phone || '').replace(/\D/g, '');
        return u1Digits.endsWith(last10) || u2Digits.endsWith(last10);
      });
    }
  }

  if (!row) return null;

  // Determine partner accurately
  const u1Clean = normalizeIdentifier(row.user1_phone);
  let isUser1 = false;
  if (clean.includes('@')) {
    isUser1 = (u1Clean === clean);
  } else {
    const digits = clean.replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
    const u1Digits = u1Clean.replace(/\D/g, '');
    isUser1 = (u1Clean === clean) || (last10 && u1Digits.endsWith(last10));
  }

  const partnerId = isUser1 ? row.user2_phone : row.user1_phone;
  return {
    ...row,
    partnerPhone: partnerId,
    partnerId
  };
}

export function establishPair(user1, user2) {
  const p1 = normalizeIdentifier(user1);
  const p2 = normalizeIdentifier(user2);

  const existing1 = getPairForUser(p1);
  if (existing1) {
    const p1PartnerNorm = normalizeIdentifier(existing1.partnerPhone);
    if (p1PartnerNorm !== p2) {
      return {
        alreadyConnected: true,
        particularUser: existing1.partnerPhone,
        message: `Already connected with @${existing1.partnerPhone}`
      };
    }
    return existing1;
  }

  const existing2 = getPairForUser(p2);
  if (existing2) {
    const p2PartnerNorm = normalizeIdentifier(existing2.partnerPhone);
    if (p2PartnerNorm !== p1) {
      return {
        alreadyConnected: true,
        particularUser: existing2.partnerPhone,
        message: `Already connected with @${existing2.partnerPhone}`
      };
    }
    return existing2;
  }

  const id = 'pair_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const now = Date.now();
  const stmt = db.prepare(`
    INSERT INTO pairs (id, user1_phone, user2_phone, created_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, p1, p2, now);

  upsertUser(p1);
  upsertUser(p2);

  return {
    id,
    user1_phone: p1,
    user2_phone: p2,
    partnerId: p2,
    partnerPhone: p2,
    created_at: now
  };
}

export function updateProfiles(selfIdentifier, selfData) {
  const selfUser = getUser(selfIdentifier);
  const selfClean = selfUser ? selfUser.phone_number : normalizeIdentifier(selfIdentifier);
  if (selfData) {
    const displayName = selfData.display_name ?? selfData.displayName ?? selfData.name ?? null;
    const avatarUrl = selfData.avatar_url ?? selfData.avatarUrl ?? null;
    const partnerAlias = selfData.partner_alias ?? selfData.partnerAlias ?? selfData.partner_name ?? selfData.partnerName ?? null;
    const partnerNote = selfData.partner_note ?? selfData.partnerNote ?? null;
    const partnerAvatar = selfData.partner_avatar ?? selfData.partnerAvatar ?? null;

    const stmt = db.prepare(`
      UPDATE users SET 
        display_name = COALESCE(?, display_name),
        avatar_url = COALESCE(?, avatar_url),
        partner_alias = COALESCE(?, partner_alias),
        partner_note = COALESCE(?, partner_note),
        partner_avatar = COALESCE(?, partner_avatar)
      WHERE phone_number = ?
    `);
    stmt.run(
      displayName, 
      avatarUrl,
      partnerAlias,
      partnerNote,
      partnerAvatar,
      selfClean
    );
  }

  return getAllUsers();
}

// Session Management
export function getActiveSession() {
  const query = db.prepare(`SELECT * FROM sessions WHERE is_active = 1 ORDER BY started_at DESC LIMIT 1`);
  return query.get();
}

export function getLatestSession() {
  const query = db.prepare(`SELECT * FROM sessions ORDER BY started_at DESC LIMIT 1`);
  return query.get();
}

export function createNewSession() {
  const sealAll = db.prepare(`UPDATE sessions SET is_active = 0, ended_at = last_active_at WHERE is_active = 1`);
  sealAll.run();

  const id = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  const insert = db.prepare(`
    INSERT INTO sessions (id, started_at, last_active_at, is_active)
    VALUES (?, ?, ?, 1)
  `);
  insert.run(id, now, now);
  return { id, started_at: now, last_active_at: now, is_active: 1 };
}

export function touchSession(sessionId) {
  const now = Date.now();
  const update = db.prepare(`UPDATE sessions SET last_active_at = ? WHERE id = ?`);
  update.run(now, sessionId);
}

export function sealSession(sessionId) {
  const now = Date.now();
  const update = db.prepare(`UPDATE sessions SET is_active = 0, ended_at = ? WHERE id = ?`);
  update.run(now, sessionId);
}

export function openSession(sessionId) {
  const sealOthers = db.prepare(`UPDATE sessions SET is_active = 0, ended_at = COALESCE(ended_at, last_active_at) WHERE id != ? AND is_active = 1`);
  sealOthers.run(sessionId);

  const now = Date.now();
  const activate = db.prepare(`UPDATE sessions SET is_active = 1, ended_at = NULL, last_active_at = ? WHERE id = ?`);
  activate.run(now, sessionId);

  const getStmt = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
  return getStmt.get(sessionId);
}

export function getSessionById(sessionId) {
  const stmt = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
  return stmt.get(sessionId);
}

export function getAllSessions() {
  const query = db.prepare(`
    SELECT s.*, 
           COUNT(m.id) as message_count,
           (SELECT text FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message,
           (SELECT created_at FROM messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message_time
    FROM sessions s
    LEFT JOIN messages m ON s.id = m.session_id
    GROUP BY s.id
    ORDER BY s.started_at DESC
  `);
  return query.all();
}

export function getSessionMessages(sessionId) {
  const query = db.prepare(`SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`);
  const messages = query.all(sessionId);
  return messages.map(m => ({
    ...m,
    sender_id: m.sender_phone,
    is_read: m.is_read ? 1 : 0,
    read_at: m.read_at || null,
    reply_to: m.reply_to_json ? JSON.parse(m.reply_to_json) : null,
    reactions: m.reactions_json ? JSON.parse(m.reactions_json) : {}
  }));
}

export function deleteSession(sessionId) {
  if (!sessionId) return { success: false, error: 'sessionId is required' };

  const existing = getSessionById(sessionId);
  if (!existing) return { success: false, error: 'Session not found' };

  // 1. Delete all messages for this session
  const delMsgs = db.prepare(`DELETE FROM messages WHERE session_id = ?`);
  const msgResult = delMsgs.run(sessionId);

  // 2. Delete the session itself
  const delSess = db.prepare(`DELETE FROM sessions WHERE id = ?`);
  delSess.run(sessionId);

  // 3. Ensure an active session remains available
  let currentActive = getActiveSession();
  if (!currentActive) {
    const latest = getLatestSession();
    if (latest) {
      currentActive = openSession(latest.id);
    } else {
      currentActive = createNewSession();
    }
  }

  return {
    success: true,
    deletedSessionId: sessionId,
    deletedMessagesCount: msgResult.changes,
    activeSession: currentActive,
    sessions: getAllSessions()
  };
}

// Mark messages as read (called when partner views the chat)
export function markMessagesAsRead(sessionId, readerIdentifier) {
  if (!sessionId || !readerIdentifier) return 0;
  const cleanReader = readerIdentifier.trim().toLowerCase();
  const now = Date.now();
  const stmt = db.prepare(`
    UPDATE messages 
    SET is_read = 1, read_at = ? 
    WHERE session_id = ? 
      AND sender_phone != ? 
      AND (is_read IS NULL OR is_read = 0)
  `);
  const result = stmt.run(now, sessionId, cleanReader);
  return result.changes;
}

// Message Operations
export function insertMessage({ sessionId, senderPhone, senderId, text = '', mediaUrl = '', mediaType = '', replyTo = null }) {
  const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();
  const replyToJson = replyTo ? JSON.stringify(replyTo) : null;
  const replyToId = replyTo?.id || null;
  const author = (senderId || senderPhone).trim().toLowerCase();

  const insert = db.prepare(`
    INSERT INTO messages (
      id, session_id, sender_phone, text, media_url, media_type,
      reply_to_id, reply_to_json, reactions_json, is_edited, is_read, read_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', 0, 0, NULL, ?, ?)
  `);

  insert.run(id, sessionId, author, text, mediaUrl, mediaType, replyToId, replyToJson, now, now);
  touchSession(sessionId);

  return {
    id,
    session_id: sessionId,
    sender_id: author,
    sender_phone: author,
    text,
    media_url: mediaUrl,
    media_type: mediaType,
    reply_to_id: replyToId,
    reply_to: replyTo,
    reactions: {},
    is_edited: 0,
    is_read: 0,
    read_at: null,
    created_at: now,
    updated_at: now
  };
}

// 15-Minute Edit Restriction
export function updateMessageText(messageId, senderIdentifier, newText) {
  const query = db.prepare(`SELECT * FROM messages WHERE id = ?`);
  const msg = query.get(messageId);

  if (!msg) {
    throw new Error('Message not found');
  }

  const cleanSender = senderIdentifier.trim().toLowerCase();
  if (msg.sender_phone !== cleanSender) {
    throw new Error('Unauthorized to edit this message');
  }

  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  if (Date.now() - msg.created_at > FIFTEEN_MINUTES) {
    throw new Error('Message can only be edited within 15 minutes of sending');
  }

  const now = Date.now();
  const update = db.prepare(`
    UPDATE messages 
    SET text = ?, is_edited = 1, updated_at = ? 
    WHERE id = ?
  `);
  update.run(newText, now, messageId);

  return {
    ...msg,
    sender_id: msg.sender_phone,
    text: newText,
    is_edited: 1,
    updated_at: now,
    reply_to: msg.reply_to_json ? JSON.parse(msg.reply_to_json) : null,
    reactions: msg.reactions_json ? JSON.parse(msg.reactions_json) : {}
  };
}

export function toggleMessageReaction(messageId, userIdentifier, emoji) {
  const query = db.prepare(`SELECT * FROM messages WHERE id = ?`);
  const msg = query.get(messageId);
  if (!msg) throw new Error('Message not found');

  const cleanUser = userIdentifier.trim().toLowerCase();
  const reactions = msg.reactions_json ? JSON.parse(msg.reactions_json) : {};
  const usersForEmoji = reactions[emoji] || [];
  const index = usersForEmoji.indexOf(cleanUser);

  if (index > -1) {
    usersForEmoji.splice(index, 1);
    if (usersForEmoji.length === 0) {
      delete reactions[emoji];
    } else {
      reactions[emoji] = usersForEmoji;
    }
  } else {
    reactions[emoji] = [...usersForEmoji, cleanUser];
  }

  const json = JSON.stringify(reactions);
  const update = db.prepare(`UPDATE messages SET reactions_json = ? WHERE id = ?`);
  update.run(json, messageId);

  return {
    ...msg,
    sender_id: msg.sender_phone,
    reactions,
    reply_to: msg.reply_to_json ? JSON.parse(msg.reply_to_json) : null
  };
}

// Global App Customization Settings
export function getAppSetting(key, defaultValue = null) {
  const query = db.prepare(`SELECT value FROM settings WHERE key = ?`);
  const res = query.get(key);
  return res ? JSON.parse(res.value) : defaultValue;
}

export function setAppSetting(key, value) {
  const insertOrReplace = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  insertOrReplace.run(key, JSON.stringify(value));
}

export function getAllSettings() {
  const query = db.prepare(`SELECT * FROM settings`);
  const rows = query.all();
  const settings = {
    activeTheme: 'swiss',
    themeMode: 'dark',
    bubbleBoxColor: '#ffffff',
    bubbleTextColor: '#09090b',
    wallpaperUrl: '',
    wallpaperType: 'none',
    wallpaperBrightness: 60
  };

  rows.forEach(r => {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch {
      settings[r.key] = r.value;
    }
  });

  return settings;
}

export default db;
