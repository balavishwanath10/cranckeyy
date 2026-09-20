import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Clock, 
  Palette, 
  UserCheck, 
  KeyRound, 
  Bell, 
  Check, 
  Sparkles,
  MessageSquare,
  Lock,
  UserPlus,
  Eye,
  ShieldCheck,
  Edit3,
  Plus,
  Archive,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Smile,
  Trash2
} from 'lucide-react';
import { updateProfilesApi, uploadMedia } from '../services/api';
import AlreadyConnectedModal from './AlreadyConnectedModal';

const QUICK_EMOJIS = ['🦊', '💖', '👑', '⚡', '✨', '🌸', '🧸', '💎', '🔥', '🦋', '🐺', '🖤', '🚀', '☕'];

const isImageUrl = (val) => {
  if (!val || typeof val !== 'string') return false;
  return val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:');
};

const renderAvatarPreview = (avatarVal, name = 'P') => {
  if (!avatarVal) {
    return <span>{name ? name.slice(0, 2).toUpperCase() : 'P'}</span>;
  }
  if (isImageUrl(avatarVal)) {
    return <img src={avatarVal} alt="Avatar Preview" className="w-full h-full object-cover rounded-xl" />;
  }
  return <span className="text-xl leading-none select-none">{avatarVal}</span>;
};

export default function FeaturePanelsModal({
  panelType,
  onClose,
  sessions = [],
  onSelectSession,
  onDeleteSession,
  onNewSession,
  bubbleBoxColor,
  bubbleTextColor,
  onUpdateBubbleColors,
  currentUser,
  partnerUser,
  onProfilesUpdated,
  onOpenSelfProfile,
  notificationsEnabled,
  onToggleNotifications,
  soundEnabled,
  onToggleSound
}) {
  if (!panelType) return null;

  // Profiles State: Both My Name and Partner Customization
  const [selfDisplayName, setSelfDisplayName] = useState(currentUser?.display_name || '');
  const [partnerAlias, setPartnerAlias] = useState(currentUser?.partner_alias || '');
  const [partnerNote, setPartnerNote] = useState(currentUser?.partner_note || '');
  const [partnerCustomAvatar, setPartnerCustomAvatar] = useState(currentUser?.partner_avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showAlreadyConnectedModal, setShowAlreadyConnectedModal] = useState(false);
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const partnerAvatarInputRef = useRef(null);

  const handlePartnerAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await uploadMedia(file);
      if (res.success && res.url) {
        setPartnerCustomAvatar(res.url);
      }
    } catch (err) {
      console.error('Failed to upload partner avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    if (currentUser) {
      setSelfDisplayName(currentUser.display_name || '');
      setPartnerAlias(currentUser.partner_alias || '');
      setPartnerNote(currentUser.partner_note || '');
      setPartnerCustomAvatar(currentUser.partner_avatar || '');
    }
  }, [currentUser, panelType]);

  const handleSaveProfiles = async () => {
    const userKey = currentUser?.identifier || currentUser?.phone_number || currentUser?.email || localStorage.getItem('cranckeyy_saved_identifier') || '';
    if (!userKey) return;
    setIsSavingProfile(true);
    setSaveError('');
    try {
      const cleanSelf = selfDisplayName.trim() || (userKey.includes('@') ? userKey.split('@')[0] : 'Me');
      const cleanPartner = partnerAlias.trim();

      const res = await updateProfilesApi(
        userKey,
        {
          display_name: cleanSelf,
          displayName: cleanSelf,
          name: cleanSelf,
          partner_alias: cleanPartner,
          partnerAlias: cleanPartner,
          partner_name: cleanPartner,
          partnerName: cleanPartner,
          partner_note: partnerNote.trim(),
          partner_avatar: partnerCustomAvatar.trim()
        }
      );
      if (res.success) {
        setProfileSuccess(true);
        onProfilesUpdated?.(res.users, res.partnerUser, res.pair);
        setTimeout(() => setProfileSuccess(false), 3000);
      } else if (res.error) {
        setSaveError(res.error);
      }
    } catch (err) {
      console.error('Failed to save profiles:', err);
      setSaveError(err.message || 'Failed to save profiles');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getTitleInfo = () => {
    switch (panelType) {
      case 'sessions':
        return { icon: <Clock className="w-5 h-5 text-emerald-400" />, title: 'Sessions Archive', subtitle: 'Permanent conversation session records' };
      case 'colors':
        return { icon: <Palette className="w-5 h-5 text-cyan-400" />, title: 'Bubble Two-Color Engine', subtitle: 'Customize box color and text color independently' };
      case 'profiles':
        return { icon: <UserCheck className="w-5 h-5 text-amber-400" />, title: 'Custom Profiles Hub', subtitle: 'Customize partner profile for yourself • Partner only reads what you set' };
      case 'otp':
        return { icon: <KeyRound className="w-5 h-5 text-blue-400" />, title: 'Security & OTP Verification', subtitle: 'Email and Mobile authentication policy' };
      case 'notifications':
        return { icon: <Bell className="w-5 h-5 text-purple-400" />, title: 'Notifications & Audio', subtitle: 'Alerts and sound chimes' };
      default:
        return { icon: null, title: '', subtitle: '' };
    }
  };

  const { icon, title, subtitle } = getTitleInfo();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 selection:bg-zinc-700 animate-in fade-in duration-150">
      <div className="max-w-xl w-full rounded-3xl bg-zinc-900 border border-zinc-700 p-4 sm:p-7 space-y-5 sm:space-y-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto overscroll-contain">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700 shadow-sm">
              {icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SESSIONS ARCHIVE */}
        {panelType === 'sessions' && (
          <div className="space-y-3.5">
            
            {/* Quick Action: Start Fresh Session from Archive menu */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 shadow-inner">
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Start Fresh Conversation</span>
                <span className="text-[11px] text-zinc-400 block truncate">
                  Archive current conversation & start chatting from the beginning
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewSession?.();
                }}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ New Session</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-1">
              <span>All conversation sessions stored permanently</span>
              <span className="font-mono text-emerald-400 font-semibold">{sessions.length} recorded</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 space-y-2">
                  <Archive className="w-8 h-8 mx-auto text-zinc-600" />
                  <p className="text-xs">No conversation sessions recorded yet.</p>
                </div>
              ) : (
                sessions.map((sess, idx) => {
                  const isCurrentActive = sess.is_active === 1;
                  const dateStr = new Date(sess.started_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const durationMinutes = Math.max(1, Math.round(((sess.ended_at || sess.last_active_at) - sess.started_at) / 60000));

                  return (
                    <div
                      key={sess.id}
                      onClick={() => { onSelectSession(sess); onClose(); }}
                      className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-[0.99] ${
                        isCurrentActive
                          ? 'bg-zinc-800/95 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                          : 'bg-zinc-950/80 border-zinc-800/90 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1.5 text-white">
                          {isCurrentActive ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span className="text-emerald-400 font-bold">Active Session</span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1.5 text-zinc-200">
                              <Archive className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Session #{sessions.length - idx}</span>
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">{dateStr}</span>
                      </div>

                      <p className="text-xs text-zinc-300 truncate my-1.5">
                        {sess.last_message ? `"${sess.last_message}"` : 'No messages in this session yet'}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 gap-2 flex-wrap sm:flex-nowrap">
                        <span className="font-mono text-[10px] shrink-0">{sess.message_count || 0} messages • {durationMinutes}m</span>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDeleteSession(sess);
                              }}
                              title="Permanently Delete Session"
                              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition flex items-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSession(sess);
                              onClose();
                            }}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                              isCurrentActive
                                ? 'bg-emerald-500 text-black shadow'
                                : 'bg-white hover:bg-zinc-200 text-black shadow'
                            }`}
                          >
                            <span>{isCurrentActive ? 'Open (Current)' : 'Open Session'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. BUBBLE TWO-COLOR ENGINE */}
        {panelType === 'colors' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              
              {/* Color 1: Box Background Color */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">1. Message Box (Bubble Background)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bubbleBoxColor}
                    onChange={(e) => onUpdateBubbleColors(e.target.value, bubbleTextColor)}
                    className="w-11 h-11 rounded-2xl cursor-pointer bg-transparent border-0"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-white font-bold block">{bubbleBoxColor}</span>
                    <span className="text-[10px] text-zinc-500">Card background & borders</span>
                  </div>
                </div>
              </div>

              {/* Color 2: Text Color */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">2. Message Text Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bubbleTextColor}
                    onChange={(e) => onUpdateBubbleColors(bubbleBoxColor, e.target.value)}
                    className="w-11 h-11 rounded-2xl cursor-pointer bg-transparent border-0"
                  />
                  <div className="text-xs">
                    <span className="font-mono text-white font-bold block">{bubbleTextColor}</span>
                    <span className="text-[10px] text-zinc-500">Typography inside bubble</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
              <span className="text-[11px] font-mono text-zinc-400 block uppercase tracking-wider">Live Bubble Preview:</span>
              <div className="flex justify-end">
                <div
                  className="p-3.5 rounded-2xl rounded-br-sm text-sm font-medium shadow max-w-xs text-left"
                  style={{ backgroundColor: bubbleBoxColor, color: bubbleTextColor }}
                >
                  <p>This is how your sent messages will look in cranckeyy!</p>
                  <div className="flex items-center justify-end mt-1 text-[10px] opacity-75 font-mono">
                    <span>11:42 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curated Presets */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-400">Curated Two-Color Presets:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateBubbleColors('#ffffff', '#09090b')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium border border-zinc-700 text-zinc-200 transition"
                >
                  Chalk on Ink (Pure)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBubbleColors('#18181b', '#f4f4f5')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium border border-zinc-700 text-zinc-200 transition"
                >
                  Obsidian on Slate
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBubbleColors('#2563eb', '#ffffff')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium border border-zinc-700 text-zinc-200 transition"
                >
                  Cobalt & Snow
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBubbleColors('#10b981', '#052e24')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium border border-zinc-700 text-zinc-200 transition"
                >
                  Emerald & Forest
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateBubbleColors('#f59e0b', '#000000')}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium border border-zinc-700 text-zinc-200 transition"
                >
                  Amber Glow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PROFILES HUB: Edit Partner Profile Only For Yourself & Read-Only Partner Settings */}
        {panelType === 'profiles' && (
          <div className="space-y-4">
            {profileSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>Partner custom profile saved! Visible only to you on this device.</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <X className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: EDIT YOUR PARTNER'S PROFILE (Visible Only To You) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Customize Partner</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Only for You</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Set a custom nickname, private note, or avatar for your partner. Stored exclusively for your view.
                  </p>
                </div>

                {/* Live Avatar & Name Preview */}
                <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 flex items-center justify-between gap-2.5 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-white overflow-hidden shrink-0 shadow-sm">
                      {renderAvatarPreview(partnerCustomAvatar, partnerAlias || partnerUser?.display_name || 'Partner')}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold text-white truncate">
                        {partnerAlias.trim() || partnerUser?.display_name || 'Partner Name'}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Live preview on your screen
                      </div>
                    </div>
                  </div>
                  {partnerCustomAvatar && (
                    <button
                      type="button"
                      onClick={() => setPartnerCustomAvatar('')}
                      className="text-[10px] text-zinc-400 hover:text-red-400 px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-red-500/30 transition shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-3 pt-0.5">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-zinc-300 font-medium">Your Display Name (My Name)</label>
                      <span className="text-[9px] font-mono text-emerald-400">Public to partner</span>
                    </div>
                    <input
                      type="text"
                      value={selfDisplayName}
                      onChange={(e) => setSelfDisplayName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveProfiles();
                        }
                      }}
                      placeholder="e.g. Bala Vishwanath"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-zinc-300 font-medium">Partner Nickname / Alias (Partner's Name)</label>
                      <span className="text-[9px] font-mono text-amber-400">Only for you</span>
                    </div>
                    <input
                      type="text"
                      value={partnerAlias}
                      onChange={(e) => setPartnerAlias(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveProfiles();
                        }
                      }}
                      placeholder="e.g. Honey, Alex, Bestie..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] text-zinc-300 font-medium">Partner Custom Avatar / Emoji</label>
                    <input
                      type="text"
                      value={partnerCustomAvatar}
                      onChange={(e) => setPartnerCustomAvatar(e.target.value)}
                      placeholder="e.g. 🦊, 💖, ⚡ or image URL"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white transition"
                    />

                    {/* Quick Emojis Selection */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] text-zinc-500 font-mono mr-1">Pick:</span>
                      {QUICK_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setPartnerCustomAvatar(emoji)}
                          className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition active:scale-90 cursor-pointer ${
                            partnerCustomAvatar === emoji ? 'bg-amber-500/20 border border-amber-500/60' : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Gallery Photo Upload */}
                    <button
                      type="button"
                      disabled={isUploadingAvatar}
                      onClick={() => partnerAvatarInputRef.current?.click()}
                      className="w-full mt-1 py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isUploadingAvatar ? 'Uploading Photo...' : 'Upload Photo from Gallery'}</span>
                    </button>
                    <input
                      ref={partnerAvatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePartnerAvatarUpload}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[11px] text-zinc-300 font-medium">Personal Note About Partner</label>
                    <textarea
                      rows={3}
                      value={partnerNote}
                      onChange={(e) => setPartnerNote(e.target.value)}
                      placeholder="Private notes, reminders, favorite things..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white resize-none transition"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfiles}
                  disabled={isSavingProfile}
                  className="w-full mt-2 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shadow disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profiles & Names'}</span>
                </button>
              </div>

              {/* Card 2: WHAT YOUR PARTNER SET FOR YOU (Read-Only) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 space-y-3.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-bold text-zinc-200">Partner Set For You</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Read-Only</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    What your partner configured for your identity on their screen. You cannot edit this.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1 text-left">
                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                      Nickname Partner Calls You
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {partnerUser?.partner_alias ? `"${partnerUser.partner_alias}"` : '(None set yet)'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1">
                      Custom Avatar Partner Assigned You
                    </span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-sm text-white overflow-hidden shrink-0 shadow-inner">
                        {renderAvatarPreview(partnerUser?.partner_avatar, partnerUser?.partner_alias || currentUser?.display_name || 'You')}
                      </div>
                      <span className="text-xs text-zinc-300 truncate">
                        {partnerUser?.partner_avatar ? (
                          isImageUrl(partnerUser.partner_avatar) ? 'Custom photo avatar' : `Emoji: ${partnerUser.partner_avatar}`
                        ) : (
                          '(None set yet)'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">
                      Partner's Private Note About You
                    </span>
                    <p className="text-xs text-zinc-300 italic mt-0.5 min-h-[48px] whitespace-pre-wrap">
                      {partnerUser?.partner_note ? `"${partnerUser.partner_note}"` : 'No note written by partner yet.'}
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-zinc-900/30 border border-zinc-800/60 text-[10px] text-zinc-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Profile Isolation: Only your partner can edit what they set for you.</span>
                </div>
              </div>

            </div>

            {/* Channel Exclusivity Check / Connect with another user */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAlreadyConnectedModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 border border-zinc-800 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Try Connecting With Another User</span>
              </button>
            </div>

            {/* Quick Link to Your Profile & Identity */}
            <div className="pt-2 text-center border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSelfProfile?.();
                }}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 cursor-pointer transition font-medium"
              >
                Want to change your own name or photo? Open Your Profile & Identity &rarr;
              </button>
            </div>
          </div>
        )}

        {/* 4. SECURITY & OTP INFO */}
        {panelType === 'otp' && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white text-black mx-auto flex items-center justify-center font-black text-xl shadow-lg">
              OTP
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Email & Mobile OTP Authentication</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                cranckeyy sends 6-digit OTP codes directly to your registered email address or mobile number. If a session expires or 20 minutes of inactivity occurs, a fresh OTP is dispatched automatically.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400 text-left space-y-1.5">
              <div className="flex justify-between">
                <span>Your Registered ID:</span>
                <span className="text-white">{currentUser?.identifier || currentUser?.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Pair Status:</span>
                <span className="text-emerald-400">Exclusive 1-on-1 Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Inactivity Lock:</span>
                <span className="text-white">Auto-dispatches fresh OTP after 20m</span>
              </div>
              <div className="flex justify-between">
                <span>Session Sealing:</span>
                <span className="text-white">Preserved open • Archives on "+ New Session"</span>
              </div>
            </div>

            {/* Connect with another user exclusivity trigger */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAlreadyConnectedModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-700 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
                <span>Connect With Another User</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. NOTIFICATIONS */}
        {panelType === 'notifications' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-white block">Web Push Notifications</span>
                <span className="text-[11px] text-zinc-400">Receive alerts when messages arrive and browser is in background</span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={onToggleNotifications}
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-xs font-semibold text-white block">Message Audio Chimes</span>
                <span className="text-[11px] text-zinc-400">Play subtle sound on sent and received messages</span>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={onToggleSound}
                className="w-5 h-5 rounded accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition"
          >
            Done
          </button>
        </div>

        {/* Channel Exclusivity Pop-up: Already connected with @particular user */}
        <AlreadyConnectedModal
          isOpen={showAlreadyConnectedModal}
          particularUser={partnerUser?.identifier || partnerUser?.phone_number || 'partner'}
          onClose={() => setShowAlreadyConnectedModal(false)}
        />

        {/* Delete Session Confirmation Modal - Asks Once Before Permanently Deleting */}
        {pendingDeleteSession && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
            onClick={(e) => {
              e.stopPropagation();
              setPendingDeleteSession(null);
            }}
          >
            <div 
              className="max-w-sm w-full rounded-3xl bg-zinc-900 border border-red-500/40 p-5 space-y-4 shadow-2xl text-left backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Permanently Delete Session?</h4>
                  <p className="text-[11px] text-zinc-400">All messages in this session will be erased forever.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">Session ID:</span>
                  <span className="text-white font-bold truncate max-w-[170px]">{pendingDeleteSession.id}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">Total Messages:</span>
                  <span className="text-amber-400 font-bold">{pendingDeleteSession.message_count || 0} messages</span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-zinc-500">Started:</span>
                  <span className="text-zinc-300">
                    {new Date(pendingDeleteSession.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingDeleteSession(null)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingSession}
                  onClick={async () => {
                    setIsDeletingSession(true);
                    try {
                      await onDeleteSession?.(pendingDeleteSession.id);
                    } finally {
                      setIsDeletingSession(false);
                      setPendingDeleteSession(null);
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingSession ? (
                    <span>Deleting...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Forever</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
