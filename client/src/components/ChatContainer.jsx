import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  Smile, 
  Send, 
  X, 
  ArrowRight,
  ArrowDown,
  ShieldAlert,
  Clock,
  Archive,
  Edit3,
  Trash2
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import EmojiPicker from './EmojiPicker';
import { uploadMedia } from '../services/api';

export default function ChatContainer({
  messages = [],
  currentSession,
  currentUser,
  partnerUser,
  isPartnerTyping = false,
  bubbleBoxColor,
  bubbleTextColor,
  wallpaperUrl,
  wallpaperType,
  wallpaperBrightness = 60,
  activeTheme,
  onSendMessage,
  onEditMessage,
  onReactMessage,
  onTyping,
  onReturnToActiveSession,
  onOpenSession,
  onDeleteSession,
  onOpenSelfProfile
}) {
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevMessagesCountRef = useRef(messages.length);

  // Auto-resize textarea to fit content up to max height, then scroll
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 140)}px`;
    }
  }, [inputText]);

  // Directly scroll the message container without touching page window
  const scrollToBottom = (smooth = true) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  // Detect scroll position: Allows user to scroll up and read without fighting auto-scroll!
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If within 140px of bottom, consider user "at bottom"
    const atBottom = scrollHeight - scrollTop - clientHeight < 140;
    isNearBottomRef.current = atBottom;
    setShowScrollBottomBtn(!atBottom);
  };

  // Scroll logic when messages update
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const prevCount = prevMessagesCountRef.current;
    const currentCount = messages.length;
    prevMessagesCountRef.current = currentCount;

    // Only consider scrolling if new messages were added
    if (currentCount > prevCount) {
      const myKey = (currentUser?.identifier || currentUser?.phone_number || '').toLowerCase();
      const lastMsg = messages[messages.length - 1];
      const isMyMessage = lastMsg && (lastMsg.sender_phone || lastMsg.sender_id || '').toLowerCase() === myKey;

      // If current user just sent a message, scroll smoothly to the bottom
      // Or if the user was already near the bottom, stay attached to the bottom
      // BUT if the user scrolled up to read earlier messages, NEVER interrupt them!
      if (isMyMessage || isNearBottomRef.current) {
        scrollToBottom(true);
      }
    }
  }, [messages, currentUser]);

  // Initial scroll to bottom on session change or mount
  useEffect(() => {
    scrollToBottom(false);
  }, [currentSession?.id]);

  // Smoothly follow typing indicator if user is already near bottom
  useEffect(() => {
    if (isPartnerTyping && isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [isPartnerTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    if (onTyping) {
      if (!val.trim()) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        onTyping(false);
      } else {
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 1800);
      }
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (onTyping) onTyping(false);

    onSendMessage({
      text: inputText.trim(),
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, sender_phone: replyTo.sender_phone } : null
    });

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setReplyTo(null);
    setShowEmojiPicker(false);
    // User sent message -> ensure immediate smooth scroll to bottom
    setTimeout(() => scrollToBottom(true), 50);
  };

  const handleKeyDown = (e) => {
    // Enter without Shift sends the message on desktop keyboards
    // Shift+Enter inserts a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadMedia(file);
      if (res.success) {
        onSendMessage({
          text: '',
          mediaUrl: res.url,
          mediaType: res.mimetype,
          replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, sender_phone: replyTo.sender_phone } : null
        });
        setReplyTo(null);
        setTimeout(() => scrollToBottom(true), 50);
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const insertEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Dynamic wallpaper styling
  const getWallpaperClasses = () => {
    if (wallpaperType === 'dots') return 'dot-grid-dark';
    if (wallpaperType === 'mesh') return 'mesh-gradient';
    return '';
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl transition-all w-full">
      
      {/* Background Wallpaper Layer - Fully Responsive via Media Queries */}
      <div
        className={`wallpaper-viewport pointer-events-none rounded-2xl sm:rounded-3xl ${getWallpaperClasses()}`}
        style={
          wallpaperUrl
            ? {
                backgroundImage: `url('${wallpaperUrl}')`,
                filter: `brightness(${wallpaperBrightness}%)`,
                opacity: Math.min(1, Math.max(0.12, (wallpaperBrightness / 100) * 0.95))
              }
            : {}
        }
      />

      {/* Messages Stream with Full Scroll Control */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 min-h-0 p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        
        {/* Archived Session Notice Banner */}
        {currentSession && currentSession.is_active === 0 && (
          <div className="sticky top-0 z-20 flex items-center justify-between p-2.5 px-3 sm:px-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs backdrop-blur-md shadow-md mb-2 animate-in fade-in flex-wrap sm:flex-nowrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Archive className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate font-medium">
                Viewing Archived Session • {new Date(currentSession.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({messages.length} messages)
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto sm:ml-2">
              {onDeleteSession && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Permanently Delete Session"
                  className="px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold text-[11px] transition shadow cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenSession ? onOpenSession(currentSession) : onReturnToActiveSession()}
                className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] transition shadow cursor-pointer flex items-center gap-1 active:scale-95"
              >
                <span>Open & Chat Here</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Active Session & Inactivity Status Banner */}
        {(!currentSession || currentSession.is_active === 1) && (
          <div className="flex items-center justify-center my-1">
            <div className="flex items-center gap-2 text-[10px] font-mono px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-zinc-900/85 border border-zinc-800 text-zinc-400 backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Active Session • Latest Open • 20m OTP Guard</span>
            </div>
          </div>
        )}

        {/* Dual Names & Quick Edit Bar - Always Visible */}
        <div className="flex items-center justify-center my-1.5 px-2">
          <div className="flex items-center justify-between gap-2 max-w-md w-full px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 text-xs">
              <span className="text-emerald-400 font-bold truncate max-w-[85px] sm:max-w-[120px]" title="Your Name">
                {currentUser?.display_name || 'You'}
              </span>
              <span className="text-zinc-500 font-mono text-[11px]">⇄</span>
              <span className="text-amber-400 font-bold truncate max-w-[85px] sm:max-w-[120px]" title="Partner's Name">
                {currentUser?.partner_alias || partnerUser?.display_name || 'Partner'}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSelfProfile}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
              title="Click to change your name and partner's name"
            >
              <Edit3 className="w-3 h-3" />
              <span>Change Names</span>
            </button>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6 text-zinc-500">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-mono text-zinc-400">
              ck
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-semibold text-zinc-300">
                  Exclusive Chat with {currentUser?.partner_alias || partnerUser?.display_name || 'Partner'}
                </p>
                {onOpenSelfProfile && (
                  <button
                    type="button"
                    onClick={onOpenSelfProfile}
                    title="Edit Partner Name & Your Name"
                    className="p-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition cursor-pointer border border-amber-500/40 flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Names</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-500 max-w-xs mt-1">
                Messages sent here are private and preserved in your ongoing conversation session.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const myKey = (currentUser?.identifier || currentUser?.phone_number || '').toLowerCase();
            const senderKey = (msg.sender_phone || msg.sender_id || '').toLowerCase();
            const isSender = senderKey === myKey;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isSender={isSender}
                senderPhone={myKey}
                partnerName={currentUser?.partner_alias || partnerUser?.display_name || 'Partner'}
                bubbleBoxColor={bubbleBoxColor}
                bubbleTextColor={bubbleTextColor}
                onReply={(targetMsg) => setReplyTo(targetMsg)}
                onEdit={onEditMessage}
                onReact={onReactMessage}
                activeTheme={activeTheme}
              />
            );
          })
        )}

        {/* Live Partner Typing Bubble Indicator */}
        {isPartnerTyping && (
          <div className="flex items-end gap-2 text-left animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Partner Mini Avatar */}
            <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-white overflow-hidden shadow shrink-0">
              {(() => {
                const customAvatar = currentUser?.partner_avatar;
                if (customAvatar) {
                  const isImg = customAvatar.startsWith('/') || customAvatar.startsWith('http') || customAvatar.startsWith('data:');
                  if (isImg) return <img src={customAvatar} alt="Partner" className="w-full h-full object-cover" />;
                  return <span>{customAvatar}</span>;
                }
                const avatar = partnerUser?.avatar_url;
                if (avatar && (avatar.startsWith('/') || avatar.startsWith('http') || avatar.startsWith('data:'))) {
                  return <img src={avatar} alt="Partner" className="w-full h-full object-cover" />;
                }
                const pName = currentUser?.partner_alias || partnerUser?.display_name || 'P2';
                return <span>{avatar || pName.slice(0, 2).toUpperCase()}</span>;
              })()}
            </div>

            {/* Typing bubble with 3 animated bouncing dots */}
            <div className="px-3.5 py-2 rounded-2xl rounded-bl-sm bg-zinc-900/90 border border-zinc-800 shadow-md flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400">
                {currentUser?.partner_alias || partnerUser?.display_name || 'Partner'} is typing
              </span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Breathing room spacer so latest messages are never obscured by bottom bar */}
        <div className="h-4 sm:h-6 shrink-0" />
      </div>

      {/* Floating "Jump to Latest Messages" button when scrolled up */}
      {showScrollBottomBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-20 right-4 sm:right-6 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-white border border-zinc-700 shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 transition active:scale-95 cursor-pointer"
          title="Scroll to latest messages"
        >
          <ArrowDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span className="text-[11px]">Recent messages</span>
        </button>
      )}

      {/* Bottom Input Area */}
      <div className="relative z-20 p-2 sm:p-3 md:p-4 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        
        {/* Quoted Reply Preview */}
        {replyTo && (
          <div className="mb-2 p-2 px-3 rounded-2xl bg-zinc-900/95 border border-zinc-700 flex items-center justify-between text-xs animate-in fade-in duration-150 shadow-md">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-bold text-emerald-400 font-mono">Replying:</span>
              <span className="text-zinc-300 truncate text-[11px]">"{replyTo.text || '[Attachment]'}"</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="p-1 text-zinc-400 hover:text-white transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Comprehensive System & Unicode Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 sm:bottom-20 left-2 right-2 sm:right-auto sm:left-4 z-50 max-w-[calc(100vw-1rem)] sm:max-w-md shadow-2xl">
            <EmojiPicker
              onSelectEmoji={insertEmoji}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {/* If viewing past session, show quick re-open reminder banner */}
        {currentSession && currentSession.is_active === 0 && (
          <div className="mb-2 p-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center flex items-center justify-between gap-2 shadow-inner flex-wrap sm:flex-nowrap">
            <span className="text-[11px] text-amber-300 font-medium truncate text-left">
              Archived session. Sending a message or tapping Re-open makes it active!
            </span>
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              {onDeleteSession && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Permanently Delete Session"
                  className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-semibold text-[10px] transition shrink-0 cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Trash2 className="w-2.5 h-2.5 text-red-400" />
                  <span>Delete</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenSession ? onOpenSession(currentSession) : onReturnToActiveSession()}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] transition shrink-0 cursor-pointer active:scale-95"
              >
                Re-open Session
              </button>
            </div>
          </div>
        )}

        {/* Message Input Form - Multiline auto-expanding like messaging apps */}
        <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-1 sm:p-1.5 pl-2 sm:pl-2.5 focus-within:border-white transition-all shadow-xl">
          
          {/* Media attachment button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Attach Media / Image / Audio"
            className="p-1.5 sm:p-2 mb-0.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,audio/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            title="Insert Emoji"
            className="p-1.5 sm:p-2 mb-0.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition active:scale-95 shrink-0 cursor-pointer"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Multiline auto-expanding textarea */}
          <div className="flex-1 min-w-0 py-1">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={isUploading ? "Uploading attachment..." : "Type a message..."}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isUploading}
              className="w-full bg-transparent text-[16px] sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none px-1.5 py-0.5 leading-relaxed resize-none overflow-y-auto overscroll-contain block"
              style={{ minHeight: '26px', maxHeight: '140px' }}
            />
          </div>

          {/* Ergonomic Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && !isUploading}
            title="Send Message"
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 mb-0.5 rounded-xl bg-gradient-to-r from-zinc-100 via-white to-zinc-200 text-black hover:from-white hover:to-zinc-100 transition-all active:scale-95 shadow font-bold text-xs shrink-0 group border border-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="hidden min-[440px]:inline">Send</span>
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-black text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-sm">
              <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </div>
          </button>

        </form>

        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-500 mt-1 sm:mt-1.5 px-1 sm:px-2 font-mono">
          <span>Swipe right on message to reply</span>
          <span>Editable for 15m</span>
        </div>

      </div>

      {/* Permanent Delete Session Confirmation Modal */}
      {showDeleteConfirm && currentSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Permanently Delete Session?</h4>
                <p className="text-[11px] text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800 space-y-1">
              <p>Are you sure you want to permanently delete this session?</p>
              <div className="font-mono text-[11px] text-zinc-400 flex items-center justify-between pt-1">
                <span>{messages.length} message{messages.length === 1 ? '' : 's'} recorded</span>
                <span className="text-zinc-300">
                  {new Date(currentSession.started_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSession}
                onClick={async () => {
                  if (!currentSession || !onDeleteSession) return;
                  setIsDeletingSession(true);
                  try {
                    await onDeleteSession(currentSession.id);
                    setShowDeleteConfirm(false);
                  } catch (err) {
                    console.error('Failed to delete session:', err);
                  } finally {
                    setIsDeletingSession(false);
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
  );
}
