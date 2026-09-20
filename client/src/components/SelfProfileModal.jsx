import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  User, 
  Heart,
  Sparkles, 
  Camera, 
  RefreshCw, 
  Copy, 
  Calendar, 
  Lock, 
  Eye, 
  Edit3,
  Trash2,
  Users
} from 'lucide-react';
import { uploadMedia, updateProfilesApi, fetchProfiles, isSameUser } from '../services/api';

const QUICK_EMOJIS = ['⚡', '👑', '🚀', '💎', '🌸', '🐺', '🖤', '🔥', '✨', '☕'];
const PARTNER_EMOJIS = ['💖', '🦊', '🌸', '👑', '✨', '🧸', '💎', '🦋', '🐺', '🖤', '🚀', '☕'];

export default function SelfProfileModal({
  isOpen,
  onClose,
  currentUser,
  partnerUser: propPartnerUser,
  onProfileUpdated
}) {
  const selfFileInputRef = useRef(null);
  const partnerFileInputRef = useRef(null);
  
  const userIdentifier = currentUser?.identifier || currentUser?.phone_number || currentUser?.email || localStorage.getItem('cranckeyy_saved_identifier') || '';
  const isEmail = userIdentifier.includes('@');

  // View Filter: 'both' (default) shows both names directly; 'self' shows user only; 'partner' shows partner only
  const [viewMode, setViewMode] = useState('both');

  // Self Profile State (My Name)
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');

  // Partner Profile State (Partner's Name)
  const [partnerAlias, setPartnerAlias] = useState(currentUser?.partner_alias || propPartnerUser?.display_name || '');
  const [partnerAvatar, setPartnerAvatar] = useState(currentUser?.partner_avatar || '');
  const [partnerNote, setPartnerNote] = useState(currentUser?.partner_note || '');

  const [liveUserRecord, setLiveUserRecord] = useState(null);
  const [livePartner, setLivePartner] = useState(propPartnerUser || null);
  const [livePair, setLivePair] = useState(null);

  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [isUploadingSelf, setIsUploadingSelf] = useState(false);
  const [isUploadingPartner, setIsUploadingPartner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const hasUserEditedRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize once when modal opens; do not re-run on background prop changes
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      hasUserEditedRef.current = false;
      return;
    }

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      hasUserEditedRef.current = false;

      // Pre-populate with currently available user & partner data
      setDisplayName(currentUser?.display_name || '');
      setAvatarUrl(currentUser?.avatar_url || '');
      setPartnerAlias(currentUser?.partner_alias || propPartnerUser?.display_name || '');
      setPartnerAvatar(currentUser?.partner_avatar || '');
      setPartnerNote(currentUser?.partner_note || '');
      setLivePartner(propPartnerUser || null);
      setErrorMsg('');
      setSuccessMsg('');

      if (userIdentifier) {
        setIsLoadingFresh(true);
        fetchProfiles(userIdentifier)
          .then(res => {
            // CRITICAL: If user has already started typing, DO NOT overwrite their inputs!
            if (hasUserEditedRef.current) return;

            if (res?.users) {
              const freshSelf = res.users.find(u => isSameUser(u, userIdentifier));
              if (freshSelf) {
                setLiveUserRecord(freshSelf);
                if (!hasUserEditedRef.current) {
                  setDisplayName(freshSelf.display_name || '');
                  setAvatarUrl(freshSelf.avatar_url || '');
                  setPartnerAlias(freshSelf.partner_alias || res?.partnerUser?.display_name || '');
                  setPartnerAvatar(freshSelf.partner_avatar || '');
                  setPartnerNote(freshSelf.partner_note || '');
                }
              }
            }
            if (res?.partnerUser) {
              setLivePartner(res.partnerUser);
            }
            if (res?.pair) {
              setLivePair(res.pair);
            }
          })
          .catch(err => {
            console.error('Failed to fetch fresh profile data:', err);
          })
          .finally(() => {
            setIsLoadingFresh(false);
          });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Self Photo Upload from Gallery
  const handleSelfPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSelf(true);
    setErrorMsg('');
    try {
      const res = await uploadMedia(file);
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        setSuccessMsg('Your photo uploaded! Click "Save Changes" to apply.');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg('Failed to upload image. Please try another file.');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setErrorMsg('Error uploading image');
    } finally {
      setIsUploadingSelf(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Partner Photo Upload from Gallery
  const handlePartnerPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPartner(true);
    setErrorMsg('');
    try {
      const res = await uploadMedia(file);
      if (res.success && res.url) {
        setPartnerAvatar(res.url);
        setSuccessMsg('Partner photo uploaded! Click "Save Changes" to apply.');
        setTimeout(() => setSuccessMsg(''), 3500);
      } else {
        setErrorMsg('Failed to upload partner photo.');
      }
    } catch (err) {
      console.error('Partner photo upload error:', err);
      setErrorMsg('Error uploading partner photo');
    } finally {
      setIsUploadingPartner(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Copy Identifier
  const handleCopyIdentifier = () => {
    if (!userIdentifier) return;
    navigator.clipboard?.writeText(userIdentifier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Save Both My Name and Partner's Name
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!userIdentifier) {
      setErrorMsg('User identity not detected. Please reload.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanSelf = displayName.trim() || (isEmail ? userIdentifier.split('@')[0] : 'Me');
      const cleanPartner = partnerAlias.trim();

      const payload = {
        display_name: cleanSelf,
        displayName: cleanSelf,
        name: cleanSelf,
        avatar_url: avatarUrl.trim(),
        avatarUrl: avatarUrl.trim(),
        partner_alias: cleanPartner,
        partnerAlias: cleanPartner,
        partner_name: cleanPartner,
        partnerName: cleanPartner,
        partner_avatar: partnerAvatar.trim(),
        partner_note: partnerNote.trim()
      };

      const res = await updateProfilesApi(userIdentifier, payload);
      if (res.success) {
        setSuccessMsg('Names and profiles saved and synced in real-time!');
        
        // Find fresh updated record from response
        const freshSelf = res.users?.find(u => isSameUser(u, userIdentifier)) || {
          ...currentUser,
          ...payload
        };
        const freshPartner = res.partnerUser || (res.users && livePair?.partnerId ? res.users.find(u => isSameUser(u, livePair.partnerId)) : null);

        if (onProfileUpdated) {
          onProfileUpdated(freshSelf, freshPartner, res.users);
        }

        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Failed to update profiles');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setErrorMsg('Error saving profile changes');
    } finally {
      setIsSaving(false);
    }
  };

  const isImageAvatar = (url) => {
    return url && (
      url.startsWith('/uploads') || 
      url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('data:')
    );
  };

  // Formatted registration date
  const registrationDate = liveUserRecord?.created_at 
    ? new Date(liveUserRecord.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : (currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active User');

  const resolvedPartner = livePartner || propPartnerUser;
  const partnerIdentifier = resolvedPartner?.display_name || resolvedPartner?.phone_number || livePair?.partnerId || currentUser?.partnerPhone || currentUser?.partnerId;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-default"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-3xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl p-5 sm:p-6 relative backdrop-blur-2xl max-h-[92dvh] overflow-y-auto overscroll-contain text-left"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Ambient Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Edit My Name & Partner's Name</h2>
              <p className="text-[11px] text-zinc-400">Directly customize both names & avatars on this screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Filter Bar */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 rounded-2xl border border-zinc-800 mt-3.5">
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'both' ? 'bg-white text-black shadow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Both Names</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('self')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'self' ? 'bg-emerald-400 text-black shadow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Name</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('partner')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              viewMode === 'partner' ? 'bg-amber-400 text-black shadow' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Partner's Name</span>
          </button>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mt-3.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-4 mt-4">

          {/* ================= SECTION 1: MY NAME (YOUR DISPLAY NAME) ================= */}
          {(viewMode === 'both' || viewMode === 'self') && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">1. Your Name (My Name)</h3>
                    <p className="text-[10px] text-zinc-400">Shown to partner on chat header and bubbles</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                  Public
                </span>
              </div>

              {/* Name Input */}
              <div className="space-y-1 text-left relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setDisplayName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave(e);
                    }
                  }}
                  placeholder="Enter your name (e.g. Bala Vishwanath)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 pr-12 text-sm text-white font-bold focus:outline-none focus:border-emerald-400 transition shadow-inner"
                />
                {displayName && (
                  <button
                    type="button"
                    onClick={() => {
                      hasUserEditedRef.current = true;
                      setDisplayName('');
                    }}
                    className="absolute right-2.5 top-2.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 font-mono transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* My Avatar & Emoji Quick Select */}
              <div className="pt-1 flex items-center justify-between gap-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-sm text-white overflow-hidden shrink-0 shadow-inner">
                    {isImageAvatar(avatarUrl) ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{avatarUrl || (displayName ? displayName.slice(0, 2).toUpperCase() : 'ME')}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => selfFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isUploadingSelf ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={selfFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSelfPhotoUpload}
                    />
                  </div>
                </div>

                {/* Emojis */}
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        hasUserEditedRef.current = true;
                        setAvatarUrl(emoji);
                      }}
                      className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition hover:scale-110 cursor-pointer ${
                        avatarUrl === emoji ? 'border border-emerald-400 bg-emerald-500/20' : 'border border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        hasUserEditedRef.current = true;
                        setAvatarUrl('');
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white font-mono bg-zinc-900 border border-zinc-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: PARTNER'S NAME ================= */}
          {(viewMode === 'both' || viewMode === 'partner') && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">2. Partner's Name (Nickname)</h3>
                    <p className="text-[10px] text-zinc-400">Replaces partner name on your chat header and bubbles</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5" />
                  <span>Your View</span>
                </span>
              </div>

              {/* Partner Name Input */}
              <div className="space-y-1 text-left relative">
                <input
                  type="text"
                  value={partnerAlias}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setPartnerAlias(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave(e);
                    }
                  }}
                  placeholder="Enter partner's name (e.g. My Sweet Angel, Honey, Bestie)"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 pr-12 text-sm text-white font-bold focus:outline-none focus:border-amber-400 transition shadow-inner"
                />
                {partnerAlias && (
                  <button
                    type="button"
                    onClick={() => {
                      hasUserEditedRef.current = true;
                      setPartnerAlias('');
                    }}
                    className="absolute right-2.5 top-2.5 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 font-mono transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Partner Avatar & Emoji Quick Select */}
              <div className="pt-1 flex items-center justify-between gap-3 border-t border-zinc-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center font-bold text-sm text-white overflow-hidden shrink-0 shadow-inner">
                    {isImageAvatar(partnerAvatar) ? (
                      <img src={partnerAvatar} alt="Partner" className="w-full h-full object-cover" />
                    ) : (
                      <span>{partnerAvatar || (partnerAlias ? partnerAlias.slice(0, 2).toUpperCase() : (livePartner?.display_name ? livePartner.display_name.slice(0, 2).toUpperCase() : 'P'))}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => partnerFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {isUploadingPartner ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3 text-amber-400" />}
                      <span>Upload Photo</span>
                    </button>
                    <input
                      ref={partnerFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePartnerPhotoUpload}
                    />
                  </div>
                </div>

                {/* Emojis */}
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {PARTNER_EMOJIS.slice(0, 5).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        hasUserEditedRef.current = true;
                        setPartnerAvatar(emoji);
                      }}
                      className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition hover:scale-110 cursor-pointer ${
                        partnerAvatar === emoji ? 'border border-amber-400 bg-amber-500/20' : 'border border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  {partnerAvatar && (
                    <button
                      type="button"
                      onClick={() => {
                        hasUserEditedRef.current = true;
                        setPartnerAvatar('');
                      }}
                      className="px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white font-mono bg-zinc-900 border border-zinc-800 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Private Partner Note */}
              <div className="space-y-1 text-left pt-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase font-mono">Personal Note About Partner (Private)</label>
                <textarea
                  rows={2}
                  value={partnerNote}
                  onChange={(e) => {
                    hasUserEditedRef.current = true;
                    setPartnerNote(e.target.value);
                  }}
                  placeholder="Private notes, anniversaries, favorite things..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition resize-none"
                />
              </div>
            </div>
          )}

          {/* ================= SECTION 3: LOGIN CREDENTIALS & IDENTITY ================= */}
          <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                Verified Credentials
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Active 1-on-1 Pair</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-lg bg-zinc-800 text-emerald-400 shrink-0">
                  {isEmail ? <Mail className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-white block truncate select-all">
                    {userIdentifier || 'Active Account'}
                  </span>
                  <span className="text-[9px] text-zinc-400 block">Linked Partner: {partnerIdentifier || 'Connected'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyIdentifier}
                title="Copy Identifier"
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer shrink-0 border border-zinc-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingSelf || isUploadingPartner}
              className="flex-1 py-3 px-4 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-xs transition active:scale-95 shadow flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

