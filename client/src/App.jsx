import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchCurrentMessages, 
  fetchAllSessions, 
  fetchSessionMessages, 
  createNewSessionApi,
  openSessionApi,
  deleteSessionApi,
  fetchProfiles, 
  fetchSettings, 
  saveSettings,
  isSameUser
} from './services/api';
import { connectSocket, getSocket, disconnectSocket } from './services/socket';
import { useInactivityGuard } from './hooks/useInactivityGuard';

import AuthView from './components/AuthView';
import InactivityLockModal from './components/InactivityLockModal';
import TopBar from './components/TopBar';
import ChatContainer from './components/ChatContainer';
import FeaturePanelsModal from './components/FeaturePanelsModal';
import SelfProfileModal from './components/SelfProfileModal';
import NewSessionModal from './components/NewSessionModal';

const THEMES = ['swiss', 'nordic', 'cyber'];

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cranckeyy_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Partner profile & live status
  const [partnerUser, setPartnerUser] = useState(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimerRef = useRef(null);

  // Chat and Sessions state
  const [messages, setMessages] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Self Profile Modal state
  const [isSelfProfileOpen, setIsSelfProfileOpen] = useState(false);

  // Theme & 2-Color Bubble customizer
  const [activeTheme, setActiveTheme] = useState('swiss');
  const [themeMode, setThemeMode] = useState('dark');
  const [bubbleBoxColor, setBubbleBoxColor] = useState('#ffffff');
  const [bubbleTextColor, setBubbleTextColor] = useState('#09090b');
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [wallpaperType, setWallpaperType] = useState('none');
  const [wallpaperBrightness, setWallpaperBrightness] = useState(60);

  // Message font size in pixels (persisted in localStorage and backend settings)
  const [messageFontSize, setMessageFontSize] = useState(() => {
    const saved = localStorage.getItem('cranckeyy_message_font_size');
    const num = Number(saved);
    return (num && num >= 11 && num <= 24) ? num : 14;
  });

  // Settings Panel sub-view state
  const [activePanel, setActivePanel] = useState(null); // 'sessions' | 'colors' | 'profiles' | 'otp' | 'notifications' | null

  // Notifications & Sound
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 20-minute inactivity lock guard
  const { isLocked, lockApp, unlockApp } = useInactivityGuard(!!currentUser);

  // Audio chime helper
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // AudioContext audio policy
    }
  }, [soundEnabled]);

  // Load initial data upon authentication
  useEffect(() => {
    if (!currentUser) return;

    // Connect socket
    const userKey = (currentUser.identifier || currentUser.phone_number || '').trim().toLowerCase();
    const socket = connectSocket(userKey);

    // Fetch initial chat data
    const initData = async () => {
      try {
        const [msgData, sessData, profData, settingsData] = await Promise.all([
          fetchCurrentMessages(userKey),
          fetchAllSessions(),
          fetchProfiles(userKey),
          fetchSettings()
        ]);

        if (msgData.messages) {
          setMessages(msgData.messages);
          // If there are unread messages from partner and window is visible, mark read
          const hasUnread = msgData.messages.some(m => {
            const author = (m.sender_phone || m.sender_id || '').toLowerCase();
            return author !== userKey && (!m.is_read || m.is_read === 0);
          });
          if (hasUnread && msgData.session?.id && document.visibilityState === 'visible') {
            socket.emit('mark_read', {
              sessionId: msgData.session.id,
              readerId: userKey
            });
          }
        }
        if (msgData.session) setCurrentSession(msgData.session);
        if (sessData.sessions) setSessionsList(sessData.sessions);

        // Profiles
        if (profData?.partnerUser) {
          setPartnerUser(profData.partnerUser);
        } else if (profData?.users) {
          const targetPartner = partnerUser?.phone_number || currentUser?.partnerPhone || currentUser?.partnerId;
          const partner = targetPartner 
            ? profData.users.find(u => isSameUser(u, targetPartner))
            : profData.users.find(u => !isSameUser(u, userKey));
          if (partner) setPartnerUser(partner);
        }
        if (profData?.users) {
          const self = profData.users.find(u => isSameUser(u, userKey));
          if (self) {
            setCurrentUser(prev => {
              const updated = { ...prev, ...self };
              localStorage.setItem('cranckeyy_user', JSON.stringify(updated));
              return updated;
            });
          }
        }

        // Settings
        if (settingsData) {
          if (settingsData.activeTheme) setActiveTheme(settingsData.activeTheme);
          if (settingsData.themeMode) setThemeMode(settingsData.themeMode);
          if (settingsData.bubbleBoxColor) setBubbleBoxColor(settingsData.bubbleBoxColor);
          if (settingsData.bubbleTextColor) setBubbleTextColor(settingsData.bubbleTextColor);
          if (settingsData.wallpaperUrl) setWallpaperUrl(settingsData.wallpaperUrl);
          if (settingsData.wallpaperType) setWallpaperType(settingsData.wallpaperType);
          if (settingsData.wallpaperBrightness !== undefined) setWallpaperBrightness(Number(settingsData.wallpaperBrightness));
          if (settingsData.messageFontSize !== undefined) {
            const sizeNum = Number(settingsData.messageFontSize);
            if (!isNaN(sizeNum) && sizeNum >= 11 && sizeNum <= 24) {
              setMessageFontSize(sizeNum);
              localStorage.setItem('cranckeyy_message_font_size', String(sizeNum));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };

    initData();

    // Socket Event Handlers
    socket.on('new_message', ({ message, session }) => {
      setMessages(prev => [...prev, message]);
      if (session) setCurrentSession(session);
      playChime();

      // Clear partner typing state as soon as message is received
      setIsPartnerTyping(false);
      if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);

      // Read Receipts: if receiver is looking at the screen, mark as read immediately!
      const author = (message.sender_phone || message.sender_id || '').toLowerCase();
      if (author !== userKey && document.visibilityState === 'visible') {
        socket.emit('mark_read', {
          sessionId: session?.id || message.session_id,
          readerId: userKey
        });
      }

      // Web Notification
      if (notificationsEnabled && document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        new Notification('cranckeyy', {
          body: message.text || 'Received a new attachment',
          icon: '/logo.svg'
        });
      }
    });

    // Real-Time Read Receipts (Blue Ticks)
    socket.on('messages_read', ({ sessionId, readerId }) => {
      setMessages(prev => prev.map(m => {
        const author = (m.sender_phone || m.sender_id || '').toLowerCase();
        // If this message was sent by the sender (not the reader), it is now read!
        if (author !== readerId?.toLowerCase()) {
          return { ...m, is_read: 1, read_at: Date.now() };
        }
        return m;
      }));
    });

    socket.on('message_edited', (editedMsg) => {
      setMessages(prev => prev.map(m => m.id === editedMsg.id ? editedMsg : m));
    });

    socket.on('message_reacted', (reactedMsg) => {
      setMessages(prev => prev.map(m => m.id === reactedMsg.id ? reactedMsg : m));
    });

    // Live Partner Typing Indicator
    socket.on('user_typing', ({ phone, identifier, isTyping }) => {
      const senderKey = (identifier || phone)?.toLowerCase();
      if (senderKey !== userKey) {
        setIsPartnerTyping(Boolean(isTyping));

        // Safety fallback: auto-clear indicator after 3.5s of no keypress
        if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);
        if (isTyping) {
          partnerTypingTimerRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3500);
        }
      }
    });

    socket.on('user_status', ({ activeUsers }) => {
      if (partnerUser) {
        const partnerKey = (partnerUser.identifier || partnerUser.phone_number)?.toLowerCase();
        setIsPartnerOnline(activeUsers.some(u => u.toLowerCase() === partnerKey));
      }
    });

    socket.on('profiles_updated', (payload) => {
      const userList = Array.isArray(payload) ? payload : (payload?.users || []);
      const self = userList.find(u => isSameUser(u, userKey));
      if (self) {
        setCurrentUser(prev => {
          const updated = { ...prev, ...self };
          localStorage.setItem('cranckeyy_user', JSON.stringify(updated));
          return updated;
        });
      }

      // If updater was our partner, update partnerUser directly from userList
      if (payload?.updaterId && !isSameUser(payload.updaterId, userKey)) {
        const partner = userList.find(u => isSameUser(u, payload.updaterId));
        if (partner) setPartnerUser(partner);
      } else {
        // Look up our known partner by ID
        const targetPartner = partnerUser?.phone_number || currentUser?.partnerPhone || currentUser?.partnerId;
        if (targetPartner) {
          const partner = userList.find(u => isSameUser(u, targetPartner));
          if (partner) setPartnerUser(partner);
        }
      }
    });

    socket.on('settings_updated', (newSettings) => {
      if (newSettings.activeTheme) setActiveTheme(newSettings.activeTheme);
      if (newSettings.bubbleBoxColor) setBubbleBoxColor(newSettings.bubbleBoxColor);
      if (newSettings.bubbleTextColor) setBubbleTextColor(newSettings.bubbleTextColor);
      if (newSettings.wallpaperUrl !== undefined) setWallpaperUrl(newSettings.wallpaperUrl);
    });

    socket.on('session_created', ({ session, sessions }) => {
      setCurrentSession(session);
      setMessages([]);
      if (sessions) setSessionsList(sessions);
    });

    socket.on('session_opened', ({ session, messages, sessions }) => {
      setCurrentSession(session);
      if (messages) setMessages(messages);
      if (sessions) setSessionsList(sessions);
    });

    socket.on('session_deleted', ({ deletedSessionId, activeSession, activeMessages, sessions }) => {
      if (sessions) setSessionsList(sessions);
      setCurrentSession(prev => {
        if (prev?.id === deletedSessionId) {
          if (activeMessages) setMessages(activeMessages);
          return activeSession || null;
        }
        return prev;
      });
    });

    return () => {
      socket.off('new_message');
      socket.off('messages_read');
      socket.off('message_edited');
      socket.off('message_reacted');
      socket.off('user_typing');
      socket.off('user_status');
      socket.off('profiles_updated');
      socket.off('settings_updated');
      socket.off('session_created');
      socket.off('session_opened');
      socket.off('session_deleted');
      if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);
    };
  }, [currentUser, partnerUser, notificationsEnabled, playChime]);

  // Read receipts on window focus or visibility change
  useEffect(() => {
    if (!currentUser || !currentSession) return;
    const socket = getSocket();
    const userKey = (currentUser.identifier || currentUser.phone_number || '').trim().toLowerCase();

    const checkAndMarkRead = () => {
      if (document.visibilityState === 'visible' && socket?.connected) {
        socket.emit('mark_read', {
          sessionId: currentSession.id,
          readerId: userKey
        });
      }
    };

    window.addEventListener('focus', checkAndMarkRead);
    document.addEventListener('visibilitychange', checkAndMarkRead);
    return () => {
      window.removeEventListener('focus', checkAndMarkRead);
      document.removeEventListener('visibilitychange', checkAndMarkRead);
    };
  }, [currentUser, currentSession]);

  // Request Notification permission
  useEffect(() => {
    if (notificationsEnabled && window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // Handle Login
  const handleLoginSuccess = (user) => {
    localStorage.setItem('cranckeyy_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('cranckeyy_user');
    disconnectSocket();
    setCurrentUser(null);
  };

  // Handle Profile Update from SelfProfileModal (Updates both My Name & Partner Name instantly)
  const handleUpdateSelfProfile = (freshSelf, freshPartner, allUsers) => {
    if (freshSelf) {
      setCurrentUser(prev => {
        const next = { ...prev, ...freshSelf };
        localStorage.setItem('cranckeyy_user', JSON.stringify(next));
        return next;
      });
    }
    if (freshPartner) {
      setPartnerUser(freshPartner);
    } else if (freshSelf?.partner_alias) {
      setPartnerUser(prev => ({
        ...(prev || {}),
        display_name: freshSelf.partner_alias
      }));
    } else if (allUsers && currentUser) {
      const myKey = (currentUser.identifier || currentUser.phone_number)?.toLowerCase();
      const targetPartner = partnerUser?.phone_number || currentUser?.partnerPhone || currentUser?.partnerId;
      if (targetPartner) {
        const p = allUsers.find(u => isSameUser(u, targetPartner));
        if (p) setPartnerUser(p);
      }
    }
  };

  // 1-Click Cycle Themes: Swiss -> Nordic -> Cyber
  const handleCycleTheme = async () => {
    const currentIndex = THEMES.indexOf(activeTheme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    setActiveTheme(nextTheme);
    await saveSettings({ activeTheme: nextTheme });
  };

  // Toggle Dark/Light Mode
  const handleToggleThemeMode = async () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    await saveSettings({ themeMode: nextMode });
  };

  // Update Two-Color Bubble Colors
  const handleUpdateBubbleColors = async (boxColor, textColor) => {
    setBubbleBoxColor(boxColor);
    setBubbleTextColor(textColor);
    await saveSettings({ bubbleBoxColor: boxColor, bubbleTextColor: textColor });
  };

  // Change Wallpaper
  const handleWallpaperChange = async (url, type = 'image') => {
    setWallpaperUrl(url);
    setWallpaperType(type);
    await saveSettings({ wallpaperUrl: url, wallpaperType: type });
  };

  // Adjust Wallpaper Brightness
  const handleWallpaperBrightnessChange = async (brightness) => {
    const num = Number(brightness);
    setWallpaperBrightness(num);
    await saveSettings({ wallpaperBrightness: num });
  };

  // Adjust Message Font Size (11px - 24px)
  const handleMessageFontSizeChange = async (size) => {
    const num = Math.max(11, Math.min(24, Number(size) || 14));
    setMessageFontSize(num);
    localStorage.setItem('cranckeyy_message_font_size', String(num));
    try {
      await saveSettings({ messageFontSize: num });
    } catch {}
  };

  // Send Message via Socket.io
  const handleSendMessage = (data) => {
    const socket = getSocket();
    const userKey = currentUser.identifier || currentUser.phone_number;
    socket.emit('send_message', {
      senderId: userKey,
      senderPhone: userKey,
      sessionId: currentSession?.id,
      ...data
    });
  };

  // Edit Message via Socket.io (15m window)
  const handleEditMessage = (messageId, newText) => {
    const socket = getSocket();
    const userKey = currentUser.identifier || currentUser.phone_number;
    socket.emit('edit_message', {
      messageId,
      senderId: userKey,
      senderPhone: userKey,
      newText
    });
  };

  // React Message via Socket.io
  const handleReactMessage = (messageId, emoji) => {
    const socket = getSocket();
    const userKey = currentUser.identifier || currentUser.phone_number;
    socket.emit('react_message', {
      messageId,
      userId: userKey,
      userPhone: userKey,
      emoji
    });
  };

  // Typing indicator
  const handleTyping = (isTyping) => {
    const socket = getSocket();
    const userKey = currentUser.identifier || currentUser.phone_number;
    socket.emit('typing', {
      identifier: userKey,
      phone: userKey,
      isTyping
    });
  };

  // Open clicked session (loads its messages, sets as active, and enables chatting)
  const handleSelectSession = async (sess) => {
    const sessId = typeof sess === 'string' ? sess : sess?.id;
    if (!sessId) return;

    try {
      const userKey = (currentUser?.identifier || currentUser?.phone_number || '').trim().toLowerCase();
      const res = await openSessionApi(sessId, userKey);
      if (res.success) {
        setCurrentSession(res.session);
        setMessages(res.messages || []);
        if (res.sessions) setSessionsList(res.sessions);
      } else {
        const msgRes = await fetchSessionMessages(sessId);
        if (msgRes.messages) {
          setMessages(msgRes.messages);
          const found = sessionsList.find(s => s.id === sessId);
          if (found) setCurrentSession(found);
        }
      }
    } catch (err) {
      console.error('Failed to open session:', err);
      try {
        const msgRes = await fetchSessionMessages(sessId);
        if (msgRes.messages) {
          setMessages(msgRes.messages);
          const found = sessionsList.find(s => s.id === sessId);
          if (found) setCurrentSession(found);
        }
      } catch (e) {
        console.error('Fallback fetchSessionMessages failed:', e);
      }
    }
  };

  // Create New Session (Starts fresh chat from beginning & seals previous)
  const handleCreateNewSession = async () => {
    setIsCreatingSession(true);
    try {
      const res = await createNewSessionApi();
      if (res.success) {
        setCurrentSession(res.session);
        setMessages([]);
        if (res.sessions) setSessionsList(res.sessions);
        setIsNewSessionModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to create new session:', err);
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Return to live active session from viewing an archive
  const handleReturnToActiveSession = async () => {
    try {
      const userKey = (currentUser?.identifier || currentUser?.phone_number || '').trim().toLowerCase();
      const res = await fetchCurrentMessages(userKey);
      if (res.messages) {
        setMessages(res.messages);
      }
      if (res.session) {
        setCurrentSession(res.session);
      }
    } catch (err) {
      console.error('Failed to return to active session:', err);
    }
  };

  // Permanently delete a session and all its messages
  const handleDeleteSession = async (sessId) => {
    if (!sessId) return;
    try {
      const userKey = (currentUser?.identifier || currentUser?.phone_number || '').trim().toLowerCase();
      const res = await deleteSessionApi(sessId, userKey);
      if (res.success) {
        if (res.sessions) setSessionsList(res.sessions);
        if (currentSession?.id === sessId) {
          if (res.activeSession) {
            setCurrentSession(res.activeSession);
            setMessages(res.activeMessages || []);
          } else {
            await handleCreateNewSession();
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  if (!currentUser) {
    return <AuthView onLoginSuccess={handleLoginSuccess} />;
  }

  const userIdentifier = currentUser.identifier || currentUser.phone_number;

  return (
    <div className={`h-[100dvh] max-h-[100dvh] w-full flex flex-col p-1.5 sm:p-3 md:p-4 transition-colors duration-200 overflow-hidden relative ${
      themeMode === 'light' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
    }`}>
      
      {/* Responsive Full-Screen Ambient Wallpaper Backdrop for all screen sizes & media queries */}
      {wallpaperUrl && (
        <div
          className="wallpaper-ambient"
          style={{
            backgroundImage: `url('${wallpaperUrl}')`,
            opacity: Math.min(0.55, Math.max(0.12, (wallpaperBrightness / 100) * 0.5)),
            filter: `blur(40px) brightness(${Math.max(20, wallpaperBrightness * 0.85)}%)`
          }}
        />
      )}

      {/* Inactivity Lock Modal (Auto-dispatches fresh OTP on session expiry) */}
      {isLocked && (
        <InactivityLockModal
          userIdentifier={userIdentifier}
          onUnlock={unlockApp}
        />
      )}

      <div className="max-w-4xl w-full mx-auto flex-1 min-h-0 flex flex-col space-y-2 sm:space-y-3 overflow-hidden relative z-10">
        
        {/* Top Navigation Bar */}
        <TopBar
          currentUser={currentUser}
          partnerUser={partnerUser}
          onOpenSelfProfile={() => setIsSelfProfileOpen(true)}
          onNewSession={() => setIsNewSessionModalOpen(true)}
          activeTheme={activeTheme}
          onCycleTheme={handleCycleTheme}
          themeMode={themeMode}
          onToggleThemeMode={handleToggleThemeMode}
          onOpenPanel={(panel) => setActivePanel(panel)}
          wallpaperUrl={wallpaperUrl}
          onWallpaperChange={handleWallpaperChange}
          wallpaperBrightness={wallpaperBrightness}
          onWallpaperBrightnessChange={handleWallpaperBrightnessChange}
          messageFontSize={messageFontSize}
          onMessageFontSizeChange={handleMessageFontSizeChange}
          onLockNow={lockApp}
          onLogout={handleLogout}
          isPartnerOnline={isPartnerOnline}
          isPartnerTyping={isPartnerTyping}
        />

        {/* Main Chat Canvas */}
        <ChatContainer
          messages={messages}
          currentSession={currentSession}
          currentUser={currentUser}
          partnerUser={partnerUser}
          isPartnerTyping={isPartnerTyping}
          bubbleBoxColor={bubbleBoxColor}
          bubbleTextColor={bubbleTextColor}
          messageFontSize={messageFontSize}
          wallpaperUrl={wallpaperUrl}
          wallpaperType={wallpaperType}
          wallpaperBrightness={wallpaperBrightness}
          activeTheme={activeTheme}
          onSendMessage={handleSendMessage}
          onOpenSelfProfile={() => setIsSelfProfileOpen(true)}
          onEditMessage={handleEditMessage}
          onReactMessage={handleReactMessage}
          onTyping={handleTyping}
          onReturnToActiveSession={handleReturnToActiveSession}
          onOpenSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
        />

      </div>

      {/* Self Profile Modal (View Credentials & Customize Profile Picture / Name) */}
      <SelfProfileModal
        isOpen={isSelfProfileOpen}
        onClose={() => setIsSelfProfileOpen(false)}
        currentUser={currentUser}
        partnerUser={partnerUser}
        onProfileUpdated={handleUpdateSelfProfile}
      />

      {/* Feature Sub-Panels (Sessions, Bubble Colors, Profiles, Authenticator, Notifications) */}
      <FeaturePanelsModal
        panelType={activePanel}
        onClose={() => setActivePanel(null)}
        sessions={sessionsList}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewSession={() => setIsNewSessionModalOpen(true)}
        bubbleBoxColor={bubbleBoxColor}
        bubbleTextColor={bubbleTextColor}
        onUpdateBubbleColors={handleUpdateBubbleColors}
        currentUser={currentUser}
        partnerUser={partnerUser}
        onProfilesUpdated={(users, explicitPartner, pair) => {
          const myKey = (currentUser.identifier || currentUser.phone_number)?.toLowerCase();
          const self = users?.find(u => isSameUser(u, myKey));
          if (self) {
            setCurrentUser(prev => {
              const next = { ...prev, ...self };
              localStorage.setItem('cranckeyy_user', JSON.stringify(next));
              return next;
            });
          }
          if (explicitPartner) {
            setPartnerUser(explicitPartner);
          } else {
            const targetPartner = partnerUser?.phone_number || pair?.partnerId || currentUser?.partnerPhone;
            if (targetPartner && users) {
              const partner = users.find(u => isSameUser(u, targetPartner));
              if (partner) setPartnerUser(partner);
            }
          }
        }}
        onOpenSelfProfile={() => setIsSelfProfileOpen(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => setNotificationsEnabled(prev => !prev)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
      />

      {/* New Session Confirmation & Canvas Reset Modal */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onConfirm={handleCreateNewSession}
        isCreating={isCreatingSession}
        currentMessageCount={messages.length}
        onOpenSessionsArchive={() => setActivePanel('sessions')}
      />

    </div>
  );
}
