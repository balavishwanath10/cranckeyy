import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import multer from 'multer';
import dotenv from 'dotenv';

import { 
  getUser, 
  getAllUsers, 
  upsertUser, 
  updateProfiles,
  getPairForUser,
  establishPair,
  normalizeIdentifier,
  getAllSessions, 
  getSessionMessages, 
  createNewSession,
  openSession,
  getSessionById,
  deleteSession,
  markMessagesAsRead,
  insertMessage, 
  updateMessageText, 
  toggleMessageReaction,
  getAllSettings,
  setAppSetting 
} from './db.js';
import { generateOtp, verifyOtp, sendOtpNotification, isEmail } from './otpService.js';
import { getOrCreateCurrentSession, recordSessionActivity } from './sessionManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS configuration for local & global web access
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Static file serving for uploads (wallpapers, media, voice notes)
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve client production build if present
const clientDistDir = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir));
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file upload
});

// ==========================================
// REST API ENDPOINTS
// ==========================================

// 1. Request OTP via Email or Mobile Number
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const rawId = req.body.identifier || req.body.phone || req.body.email;
    if (!rawId || typeof rawId !== 'string' || rawId.trim().length < 3) {
      return res.status(400).json({ error: 'Valid email address or mobile number is required' });
    }

    const cleanId = normalizeIdentifier(rawId);
    const { otp, expiresAt } = generateOtp(cleanId);
    const pair = getPairForUser(cleanId);

    // Send via SMS or Email
    const dispatchResult = await sendOtpNotification(cleanId, otp);

    const channelText = dispatchResult.channel === 'email' ? 'email' : 'mobile number';
    return res.json({
      success: true,
      identifier: cleanId,
      channel: dispatchResult.channel,
      message: `A 6-digit OTP code has been sent to your registered ${channelText} (${cleanId}).`,
      expiresAt,
      deliveryMethod: dispatchResult.channel,
      isPaired: !!pair,
      partnerId: pair?.partnerId || null,
      partnerPhone: pair?.partnerId || null
    });
  } catch (err) {
    console.error('request-otp error:', err);
    return res.status(500).json({ error: 'Failed to dispatch OTP' });
  }
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const rawId = req.body.identifier || req.body.phone || req.body.email;
    const { otp, displayName } = req.body;
    if (!rawId || !otp) {
      return res.status(400).json({ error: 'Email/Phone and OTP are required' });
    }

    const cleanId = normalizeIdentifier(rawId);
    const isValid = verifyOtp(cleanId, otp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP. Please check the code sent to your email/mobile or click Resend.' });
    }

    // Upsert user upon successful authentication
    const user = upsertUser(cleanId, displayName);
    const pair = getPairForUser(cleanId);

    return res.json({
      success: true,
      message: 'Authentication successful',
      user: {
        ...user,
        phone_number: user.identifier // backward compat
      },
      isPaired: !!pair,
      partnerId: pair?.partnerId || null,
      partnerPhone: pair?.partnerId || null
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'Authentication verification failed' });
  }
});

// 3. Establish exclusive connection with Person 2 (via Email or Phone)
app.post('/api/auth/establish-pair', (req, res) => {
  try {
    const user1 = normalizeIdentifier(req.body.user1Id || req.body.user1Phone || req.body.user1);
    const user2 = normalizeIdentifier(req.body.user2Id || req.body.user2Phone || req.body.user2);

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both phone numbers or email addresses are required to establish connection' });
    }
    if (user1 === user2) {
      return res.status(400).json({ error: 'Cannot pair with yourself' });
    }

    const pair = establishPair(user1, user2);
    if (pair && pair.alreadyConnected) {
      return res.status(409).json({
        success: false,
        alreadyConnected: true,
        particularUser: pair.particularUser,
        message: pair.message,
        error: pair.message
      });
    }

    const user1Obj = getUser(user1);
    const user2Obj = getUser(user2);

    return res.json({
      success: true,
      message: 'Exclusive 1-on-1 connection established permanently!',
      pair,
      partner: user2Obj
    });
  } catch (err) {
    console.error('establish-pair error:', err);
    return res.status(500).json({ error: 'Failed to establish pair' });
  }
});

// 3. Current active session & its messages
app.get('/api/messages/current', (req, res) => {
  try {
    const rawId = req.query.identifier || req.query.phone || req.headers['x-user-id'];
    const userKey = rawId ? normalizeIdentifier(rawId) : null;
    const session = getOrCreateCurrentSession();
    let messages = getSessionMessages(session.id);

    // If identifier is provided, filter messages strictly to the pair
    if (userKey) {
      const pair = getPairForUser(userKey);
      if (pair) {
        const p1Norm = normalizeIdentifier(pair.user1_phone);
        const p2Norm = normalizeIdentifier(pair.user2_phone);
        const allowed = new Set([p1Norm, p2Norm]);
        messages = messages.filter(m => {
          const senderNorm = normalizeIdentifier(m.sender_phone);
          return allowed.has(senderNorm);
        });
      }
    }

    return res.json({
      session,
      messages
    });
  } catch (err) {
    console.error('get current messages error:', err);
    return res.status(500).json({ error: 'Failed to retrieve current messages' });
  }
});

// 4. All sessions archive (1-hour auto-sealed history)
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = getAllSessions();
    return res.json({ sessions });
  } catch (err) {
    console.error('get sessions error:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// 4b. Create a new session (seals current session, starts fresh chat from start)
app.post('/api/sessions/new', (req, res) => {
  try {
    const session = createNewSession();
    const sessions = getAllSessions();
    io.to('cranckeyy_exclusive').emit('session_created', {
      session,
      sessions
    });
    return res.json({ success: true, session, sessions });
  } catch (err) {
    console.error('create new session error:', err);
    return res.status(500).json({ error: 'Failed to create new session' });
  }
});

// 5. Messages for a specific session
app.get('/api/sessions/:id/messages', (req, res) => {
  try {
    const messages = getSessionMessages(req.params.id);
    return res.json({ messages });
  } catch (err) {
    console.error('get session messages error:', err);
    return res.status(500).json({ error: 'Failed to fetch session messages' });
  }
});

// 5a. Open a specific session (sets as active, loads messages, broadcasts session_opened)
app.post('/api/sessions/:id/open', (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = openSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const rawId = req.body.identifier || req.body.phone || req.headers['x-user-id'];
    const userKey = rawId ? normalizeIdentifier(rawId) : null;
    let messages = getSessionMessages(sessionId);

    // If identifier is provided, filter messages strictly to the pair
    if (userKey) {
      const pair = getPairForUser(userKey);
      if (pair) {
        const p1Norm = normalizeIdentifier(pair.user1_phone);
        const p2Norm = normalizeIdentifier(pair.user2_phone);
        const allowed = new Set([p1Norm, p2Norm]);
        messages = messages.filter(m => {
          const senderNorm = normalizeIdentifier(m.sender_phone);
          return allowed.has(senderNorm);
        });
      }
    }

    const allSessions = getAllSessions();

    io.to('cranckeyy_exclusive').emit('session_opened', {
      session,
      messages,
      sessions: allSessions
    });

    return res.json({
      success: true,
      session,
      messages,
      sessions: allSessions
    });
  } catch (err) {
    console.error('open session error:', err);
    return res.status(500).json({ error: 'Failed to open session' });
  }
});

// 5b. Permanently delete a session and all its messages
const handleDeleteSessionRoute = (req, res) => {
  try {
    const sessionId = req.params.id;
    console.log(`[API] Deleting session permanently: ${sessionId}`);
    const result = deleteSession(sessionId);
    if (!result.success) {
      return res.status(404).json(result);
    }

    const rawId = req.body?.identifier || req.query?.identifier || req.headers['x-user-id'];
    const userKey = rawId ? normalizeIdentifier(rawId) : null;
    let activeMessages = result.activeSession ? getSessionMessages(result.activeSession.id) : [];

    if (userKey && result.activeSession) {
      const pair = getPairForUser(userKey);
      if (pair) {
        const p1Norm = normalizeIdentifier(pair.user1_phone);
        const p2Norm = normalizeIdentifier(pair.user2_phone);
        const allowed = new Set([p1Norm, p2Norm]);
        activeMessages = activeMessages.filter(m => {
          const senderNorm = normalizeIdentifier(m.sender_phone);
          return allowed.has(senderNorm);
        });
      }
    }

    io.to('cranckeyy_exclusive').emit('session_deleted', {
      deletedSessionId: sessionId,
      activeSession: result.activeSession,
      activeMessages,
      sessions: result.sessions
    });

    return res.json({
      success: true,
      deletedSessionId: sessionId,
      deletedMessagesCount: result.deletedMessagesCount,
      activeSession: result.activeSession,
      activeMessages,
      sessions: result.sessions
    });
  } catch (err) {
    console.error('delete session error:', err);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
};

app.delete('/api/sessions/:id', handleDeleteSessionRoute);
app.post('/api/sessions/:id/delete', handleDeleteSessionRoute);

// 5c. Mark session messages as read by partner
app.post('/api/messages/mark-read', (req, res) => {
  try {
    const { sessionId, readerId, readerPhone } = req.body;
    const reader = (readerId || readerPhone)?.trim().toLowerCase();
    if (!sessionId || !reader) {
      return res.status(400).json({ error: 'sessionId and readerId required' });
    }
    const changes = markMessagesAsRead(sessionId, reader);
    if (changes > 0) {
      io.to('cranckeyy_exclusive').emit('messages_read', {
        sessionId,
        readerId: reader,
        readAt: Date.now()
      });
    }
    return res.json({ success: true, updatedCount: changes });
  } catch (err) {
    console.error('mark-read error:', err);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// 6. Profiles: Get and update user's own profile (Strictly self-only)
app.get('/api/profiles', (req, res) => {
  try {
    const users = getAllUsers();
    const rawId = req.query.identifier || req.headers['x-user-id'];
    let partnerUser = null;
    let pair = null;
    if (rawId) {
      const cleanId = normalizeIdentifier(rawId);
      pair = getPairForUser(cleanId);
      if (pair) {
        partnerUser = getUser(pair.partnerId);
      }
    }
    return res.json({ users, pair, partnerUser });
  } catch (err) {
    console.error('get profiles error:', err);
    return res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

app.post('/api/profiles/update', (req, res) => {
  try {
    const { selfPhone, identifier, email, phone, userIdentifier, selfData, partnerData } = req.body;
    const rawId = selfPhone || identifier || email || phone || userIdentifier;
    if (!rawId) {
      console.warn('[API] /api/profiles/update called without identifier:', req.body);
      return res.status(400).json({ error: 'selfPhone or identifier is required' });
    }
    const cleanId = normalizeIdentifier(rawId);
    const pair = getPairForUser(cleanId);
    const mergedData = { ...(selfData || {}), ...(partnerData || {}) };

    console.log(`[API] /api/profiles/update: updating profile for "${cleanId}"`, mergedData);

    // 1. Update user's own profile and custom partner info
    let updatedUsers = updateProfiles(cleanId, mergedData);

    // 2. If a partner name/alias was provided and user is paired, also update partner's display_name directly!
    const partnerNameVal = mergedData.partner_alias ?? mergedData.partnerAlias ?? mergedData.partner_name ?? mergedData.partnerName;
    if (pair && pair.partnerId && partnerNameVal && typeof partnerNameVal === 'string' && partnerNameVal.trim().length > 0) {
      console.log(`[API] /api/profiles/update: updating paired partner "${pair.partnerId}" display_name to "${partnerNameVal.trim()}"`);
      updateProfiles(pair.partnerId, { display_name: partnerNameVal.trim() });
      updatedUsers = getAllUsers();
    }

    let partnerUser = null;
    if (pair && pair.partnerId) {
      partnerUser = getUser(pair.partnerId);
    }
    io.to('cranckeyy_exclusive').emit('profiles_updated', {
      users: updatedUsers,
      updaterId: cleanId,
      pair,
      partnerUser
    });
    console.log(`[API] /api/profiles/update: successfully updated profiles for ${cleanId}`);
    return res.json({ success: true, users: updatedUsers, pair, partnerUser });
  } catch (err) {
    console.error('update profiles error:', err);
    return res.status(500).json({ error: 'Failed to update profiles' });
  }
});

// 7. Settings: Active Theme, 2-Color Bubble customizer, Wallpaper
app.get('/api/settings', (req, res) => {
  try {
    const settings = getAllSettings();
    return res.json(settings);
  } catch (err) {
    console.error('get settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const newSettings = req.body;
    for (const [key, value] of Object.entries(newSettings)) {
      setAppSetting(key, value);
    }
    const updated = getAllSettings();
    io.to('cranckeyy_exclusive').emit('settings_updated', updated);
    return res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('save settings error:', err);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
});

// 8. Media / Wallpaper / Photo Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (err) {
    console.error('upload error:', err);
    return res.status(500).json({ error: 'File upload failed' });
  }
});

// ==========================================
// SOCKET.IO REAL-TIME COMMUNICATION
// ==========================================

const activeSockets = new Map(); // socketId -> phone

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join exclusive paired room
  socket.on('join', ({ phone, identifier }, callback) => {
    const userKey = normalizeIdentifier(identifier || phone);
    if (!userKey) {
      if (typeof callback === 'function') callback({ error: 'Missing identifier' });
      return;
    }
    activeSockets.set(socket.id, userKey);
    socket.join('cranckeyy_exclusive');
    console.log(`[Socket] User ${userKey} joined exclusive room.`);
    
    // Broadcast active status
    io.to('cranckeyy_exclusive').emit('user_status', {
      phone: userKey,
      identifier: userKey,
      status: 'online',
      activeUsers: Array.from(new Set(activeSockets.values()))
    });

    if (typeof callback === 'function') callback({ success: true });
  });

  // Send message
  socket.on('send_message', (data) => {
    try {
      const { senderPhone, senderId, text, mediaUrl, mediaType, replyTo } = data;
      const author = normalizeIdentifier(senderId || senderPhone);
      if (!author || (!text && !mediaUrl)) return;

      // Get or create active session (uses opened session if specified)
      let session;
      if (data.sessionId) {
        session = openSession(data.sessionId) || getOrCreateCurrentSession();
      } else {
        session = getOrCreateCurrentSession();
      }

      const message = insertMessage({
        sessionId: session.id,
        senderId: author,
        senderPhone: author,
        text: text || '',
        mediaUrl: mediaUrl || '',
        mediaType: mediaType || '',
        replyTo: replyTo || null
      });

      console.log(`[Message] ${author} in session ${session.id}: "${text?.substring(0, 30)}"`);

      // Broadcast to both participants
      io.to('cranckeyy_exclusive').emit('new_message', {
        message,
        session
      });
    } catch (err) {
      console.error('[Socket] send_message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Edit message (Enforces 15-minute window)
  socket.on('edit_message', ({ messageId, senderPhone, senderId, newText }) => {
    try {
      const author = normalizeIdentifier(senderId || senderPhone);
      const updatedMessage = updateMessageText(messageId, author, newText);
      io.to('cranckeyy_exclusive').emit('message_edited', updatedMessage);
    } catch (err) {
      console.error('[Socket] edit_message error:', err.message);
      socket.emit('action_error', { message: err.message });
    }
  });

  // Toggle emoji reaction
  socket.on('react_message', ({ messageId, userPhone, userId, emoji }) => {
    try {
      const author = normalizeIdentifier(userId || userPhone);
      const updatedMessage = toggleMessageReaction(messageId, author, emoji);
      io.to('cranckeyy_exclusive').emit('message_reacted', updatedMessage);
    } catch (err) {
      console.error('[Socket] react_message error:', err);
    }
  });

  // Mark messages as read (receiver opened/focused chat)
  socket.on('mark_read', ({ sessionId, readerId, readerPhone }) => {
    try {
      const reader = normalizeIdentifier(readerId || readerPhone);
      if (!sessionId || !reader) return;
      const changes = markMessagesAsRead(sessionId, reader);
      if (changes > 0) {
        io.to('cranckeyy_exclusive').emit('messages_read', {
          sessionId,
          readerId: reader,
          readAt: Date.now()
        });
        console.log(`[Read Receipts] User ${reader} marked ${changes} messages as read in session ${sessionId}`);
      }
    } catch (err) {
      console.error('[Socket] mark_read error:', err);
    }
  });

  // Typing indicator
  socket.on('typing', ({ phone, identifier, isTyping }) => {
    const userKey = normalizeIdentifier(identifier || phone);
    socket.to('cranckeyy_exclusive').emit('user_typing', {
      phone: userKey,
      identifier: userKey,
      isTyping: Boolean(isTyping)
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const phone = activeSockets.get(socket.id);
    if (phone) {
      activeSockets.delete(socket.id);
      io.to('cranckeyy_exclusive').emit('user_status', {
        phone,
        status: 'offline',
        activeUsers: Array.from(new Set(activeSockets.values()))
      });
      console.log(`[Socket] User ${phone} disconnected.`);
    }
  });
});

// SPA catch-all route
if (fs.existsSync(clientDistDir)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 cranckeyy backend running on http://localhost:${PORT}`);
  console.log(`🔒 60s rotating OTP & 20m inactivity auto-lock ready`);
  console.log(`⏱️ 1-hour session segmentation engine active`);
  console.log(`======================================================\n`);
});
