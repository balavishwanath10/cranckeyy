import React, { useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Clock, 
  Palette, 
  UserCheck, 
  KeyRound, 
  Bell, 
  Lock, 
  LogOut, 
  ChevronRight, 
  Upload,
  SunMedium,
  Sun,
  User
} from 'lucide-react';
import { uploadMedia } from '../services/api';

export default function SettingsDropdown({
  isOpen,
  onClose,
  onOpenPanel,
  onOpenSelfProfile,
  currentUser,
  wallpaperUrl = '',
  onWallpaperChange,
  wallpaperBrightness = 60,
  onWallpaperBrightnessChange,
  onLockNow,
  onLogout
}) {
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadMedia(file);
      if (res.success) {
        onWallpaperChange(res.url, 'image');
        onClose();
      }
    } catch (err) {
      console.error('Failed to upload wallpaper photo:', err);
    }
  };

  return (
    <>
      {/* Invisible full-screen backdrop: Clicking or tapping anywhere on the screen immediately turns off settings */}
      <div 
        className="fixed inset-0 z-40 bg-transparent cursor-default" 
        onClick={onClose}
        onTouchStart={onClose}
        aria-hidden="true"
      />

      <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-zinc-900/95 border border-zinc-700 shadow-2xl p-2 z-50 backdrop-blur-2xl divide-y divide-zinc-800/80 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80dvh] overflow-y-auto overscroll-contain">
      
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
        <span>Settings Menu</span>
        <span className="text-emerald-400 font-bold">cranckeyy</span>
      </div>

      {/* 1. User Identity Card & Quick Edit Link */}
      <div className="p-1.5 pb-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSelfProfile?.();
          }}
          title="Your Profile & Identity"
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-left transition group cursor-pointer shadow-inner"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white overflow-hidden shrink-0 shadow">
              {currentUser?.avatar_url ? (
                currentUser.avatar_url.startsWith('/') || currentUser.avatar_url.startsWith('http') ? (
                  <img src={currentUser.avatar_url} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base">{currentUser.avatar_url}</span>
                )
              ) : (
                <span>{(currentUser?.display_name || 'U').slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <span className="block leading-tight text-white font-bold text-xs truncate">
                {currentUser?.display_name || 'Your Profile & Identity'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono truncate block">
                {currentUser?.identifier || currentUser?.phone_number || 'View & Edit Identity'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300 bg-zinc-800 group-hover:bg-zinc-700 group-hover:text-white px-2 py-1 rounded-lg border border-zinc-700 transition shrink-0">
            <span>Edit</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>
      </div>

      {/* Sequential Buttons One After The Other */}
      <div className="pt-1.5 space-y-1">
        
        {/* Direct Button: Change Wallpaper from Gallery / Photos */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 text-left text-xs font-semibold text-zinc-200 transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-fuchsia-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white font-bold">Change Wallpaper</span>
              <span className="text-[10px] text-zinc-400 font-normal">Pick photo from device gallery</span>
            </div>
          </div>
          <Upload className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </button>

        {/* Wallpaper Presets & Reset Quick Bar */}
        <div className="px-2 py-1.5 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-zinc-500 font-mono">Style:</span>
          <button
            type="button"
            onClick={() => onWallpaperChange('', 'dots')}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition cursor-pointer"
          >
            Dots
          </button>
          <button
            type="button"
            onClick={() => onWallpaperChange('', 'mesh')}
            className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono transition cursor-pointer"
          >
            Mesh
          </button>
          {wallpaperUrl && (
            <button
              type="button"
              onClick={() => onWallpaperChange('', 'none')}
              className="text-[10px] px-2 py-0.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-mono transition cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Dropdown: Wallpaper Brightness Adjuster */}
        <div className="px-3 py-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/80 space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-zinc-300">Wallpaper Brightness</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              {wallpaperBrightness}%
            </span>
          </div>

          {/* Preset Dropdown Menu */}
          <div className="relative">
            <select
              value={wallpaperBrightness}
              onChange={(e) => onWallpaperBrightnessChange?.(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white cursor-pointer font-sans appearance-none pr-7"
            >
              <option value={15}>15% - Stealth / Pitch Dark</option>
              <option value={30}>30% - Dim Mood Tint</option>
              <option value={50}>50% - Soft Balanced</option>
              <option value={65}>65% - Vibrant Background</option>
              <option value={80}>80% - Bright Photo</option>
              <option value={100}>100% - Original Full Brightness</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
              <ChevronRight className="w-3 h-3 rotate-90" />
            </div>
          </div>

          {/* Smooth Range Slider */}
          <div className="flex items-center gap-2 pt-0.5">
            <Sun className="w-3 h-3 text-zinc-500 shrink-0" />
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={wallpaperBrightness}
              onChange={(e) => onWallpaperBrightnessChange?.(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* Button: Sessions Archive (1-Hour Inactivity History) */}
        <button
          type="button"
          onClick={() => { onOpenPanel('sessions'); onClose(); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 text-left text-xs font-semibold text-zinc-200 transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white">Sessions Archive</span>
              <span className="text-[10px] text-zinc-400 font-normal">Stored conversation history</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
        </button>

        {/* Button: Bubble Two-Color Engine (Box Color & Text Color) */}
        <button
          type="button"
          onClick={() => { onOpenPanel('colors'); onClose(); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 text-left text-xs font-semibold text-zinc-200 transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-cyan-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white">Bubble Colors</span>
              <span className="text-[10px] text-zinc-400 font-normal">Box background & text color</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
        </button>

        {/* Button: Edit My Name & Partner's Name */}
        <button
          type="button"
          onClick={() => { onOpenSelfProfile?.(); onClose(); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left text-xs font-semibold text-zinc-200 transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white font-bold">Edit My Name & Partner's Name</span>
              <span className="text-[10px] text-amber-400 font-normal">Change both names, nicknames & avatars</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:text-white transition" />
        </button>

        {/* Button: Custom Profiles (Opens Dual Name & Profile Customizer) */}
        <button
          type="button"
          onClick={() => { onOpenSelfProfile?.(); onClose(); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 text-left text-xs font-semibold text-zinc-200 transition group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white font-bold">Custom Profiles Hub</span>
              <span className="text-[10px] text-zinc-400 font-normal">Partner nickname, photo & private note</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
        </button>

        {/* Button: Authenticator OTP */}
        <button
          type="button"
          onClick={() => { onOpenPanel('otp'); onClose(); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 text-left text-xs font-semibold text-zinc-200 transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-blue-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white">Security & OTP</span>
              <span className="text-[10px] text-zinc-400 font-normal">Email & Mobile Authentication</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
        </button>

        {/* Button: Notifications */}
        <button
          type="button"
          onClick={() => { onOpenPanel('notifications'); onClose(); }}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800 text-left text-xs font-semibold text-zinc-200 transition group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 text-purple-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight text-white">Notifications</span>
              <span className="text-[10px] text-zinc-400 font-normal">Sound chime & push alerts</span>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition" />
        </button>
      </div>

      {/* Security Actions: Lock Screen & Logout */}
      <div className="pt-1.5 mt-1 space-y-1">
        <button
          type="button"
          onClick={() => { onLockNow(); onClose(); }}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-500/10 text-left text-xs font-medium text-red-400 transition"
        >
          <Lock className="w-4 h-4" />
          <span>Lock App Now (Test 20m Lock)</span>
        </button>

        <button
          type="button"
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-800 text-left text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
    </>
  );
}
