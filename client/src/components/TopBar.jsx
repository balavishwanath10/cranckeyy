import React, { useState, useRef, useEffect } from 'react';
import { 
  Moon, 
  Sun, 
  Settings, 
  Layers, 
  ChevronDown,
  ShieldCheck,
  Plus
} from 'lucide-react';
import SettingsDropdown from './SettingsDropdown';

export default function TopBar({
  currentUser,
  partnerUser,
  onOpenSelfProfile,
  onNewSession,
  activeTheme,
  onCycleTheme,
  themeMode,
  onToggleThemeMode,
  onOpenPanel,
  wallpaperUrl,
  onWallpaperChange,
  wallpaperBrightness,
  onWallpaperBrightnessChange,
  messageFontSize = 14,
  onMessageFontSizeChange,
  onLockNow,
  onLogout,
  isPartnerOnline = false,
  isPartnerTyping = false
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const settingsContainerRef = useRef(null);

  // Close dropdown on outside click or tap
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (e) => {
      if (settingsContainerRef.current && !settingsContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isDropdownOpen]);

  const getThemeDisplayName = () => {
    switch (activeTheme) {
      case 'swiss': return 'Swiss Mono';
      case 'nordic': return 'Nordic Glass';
      case 'cyber': return 'Cyber-Tactile';
      default: return 'Swiss Mono';
    }
  };

  const partnerName = currentUser?.partner_alias || partnerUser?.display_name || 'Partner';
  const selfName = currentUser?.display_name || 'You';

  const renderAvatar = (user, fallback = 'U') => {
    const avatar = user?.avatar_url;
    const isImage = avatar && (avatar.startsWith('/') || avatar.startsWith('http') || avatar.startsWith('data:'));
    if (isImage) {
      return <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />;
    }
    const name = user?.display_name || user?.partner_alias || '';
    const text = avatar || (name ? name.slice(0, 2).toUpperCase() : fallback);
    return <span>{text}</span>;
  };

  const renderPartnerAvatar = () => {
    const customAvatar = currentUser?.partner_avatar;
    if (customAvatar) {
      const isImg = customAvatar.startsWith('/') || customAvatar.startsWith('http') || customAvatar.startsWith('data:');
      if (isImg) {
        return <img src={customAvatar} alt="Partner" className="w-full h-full object-cover rounded-xl" />;
      }
      return <span>{customAvatar}</span>;
    }
    return renderAvatar(partnerUser, 'P2');
  };

  return (
    <header className="relative z-30 flex items-center justify-between p-2.5 sm:p-3 px-3 sm:px-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md backdrop-blur-xl gap-1.5 sm:gap-2 shrink-0 w-full">
      
      {/* Partner Info & App Status (Click to edit names) */}
      <button 
        type="button"
        onClick={onOpenSelfProfile}
        title="Click to edit partner name and your name"
        className="flex items-center gap-2 sm:gap-3 min-w-0 text-left cursor-pointer hover:opacity-90 transition active:scale-[0.98] bg-transparent border-0 p-0 select-none"
      >
        <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-white shadow-inner overflow-hidden">
          {renderPartnerAvatar()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate max-w-[85px] min-[380px]:max-w-[130px] min-[480px]:max-w-[180px] sm:max-w-[240px]">
              {partnerName}
            </h1>
            <span className="hidden md:inline text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300 bg-zinc-800/80">
              {getThemeDisplayName()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] h-4">
            {isPartnerTyping ? (
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold animate-in fade-in duration-150">
                <span className="flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="text-[10px] tracking-tight">typing...</span>
              </div>
            ) : (
              <>
                <span className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></span>
                <span className={isPartnerOnline ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                  {isPartnerOnline ? 'Online • 1-on-1' : 'Offline'}
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Top Right Controls: New Session (+), Self Profile, Theme Quick Switch, Dark/Light Mode, and Settings */}
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 relative shrink-0">

        {/* + New Session Button (Create New Session & Chat from Start) */}
        <button
          type="button"
          onClick={onNewSession}
          title="Start New Session (Chat from start)"
          className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition active:scale-95 shadow-md group cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span className="hidden sm:inline font-bold text-xs">New Session</span>
        </button>

        {/* User's Own Profile Button (Credentials & Customizable Avatar) */}
        <button
          type="button"
          onClick={onOpenSelfProfile}
          title="Your Profile & Identity"
          aria-label="Your Profile and Identity"
          className="flex items-center gap-1.5 p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700 text-xs font-semibold text-zinc-200 transition active:scale-95 shadow-sm group cursor-pointer shrink-0"
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-emerald-400 overflow-hidden shrink-0 shadow-inner">
            {renderAvatar(currentUser, 'ME')}
          </div>
          <div className="text-left flex items-center gap-1">
            <div className="max-w-[55px] min-[380px]:max-w-[75px] sm:max-w-[100px]">
              <span className="block leading-tight font-bold text-white text-xs truncate">{selfName}</span>
              <span className="block text-[8px] sm:text-[9px] text-emerald-400 font-mono leading-none">You</span>
            </div>
          </div>
        </button>
        
        {/* 3 Themes 1-Click Switcher */}
        <button
          type="button"
          onClick={onCycleTheme}
          title="Click to cycle theme: Swiss -> Nordic -> Cyber"
          className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition active:scale-95 shadow-sm shrink-0"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">{getThemeDisplayName()}</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={onToggleThemeMode}
          title="Toggle Light / Dark Mode"
          className="p-1.5 sm:p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition active:scale-95 shadow-sm shrink-0"
        >
          {themeMode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Settings Hub Button & Dropdown */}
        <div ref={settingsContainerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(prev => !prev)}
            title="cranckeyy Settings Menu"
            className="flex items-center gap-1 p-1.5 sm:p-2 px-2 sm:px-3 rounded-xl bg-white text-black hover:bg-zinc-200 border border-white font-bold text-xs transition active:scale-95 shadow shrink-0"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
            <ChevronDown className="w-3 h-3 text-zinc-600" />
          </button>

          {/* Vertical Dropdown Menu */}
          <SettingsDropdown
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpenPanel={onOpenPanel}
            onOpenSelfProfile={onOpenSelfProfile}
            currentUser={currentUser}
            wallpaperUrl={wallpaperUrl}
            onWallpaperChange={onWallpaperChange}
            wallpaperBrightness={wallpaperBrightness}
            onWallpaperBrightnessChange={onWallpaperBrightnessChange}
            messageFontSize={messageFontSize}
            onMessageFontSizeChange={onMessageFontSizeChange}
            onLockNow={onLockNow}
            onLogout={onLogout}
          />
        </div>

      </div>

    </header>
  );
}
