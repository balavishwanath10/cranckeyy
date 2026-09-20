import React, { useState, useRef } from 'react';
import { 
  Reply, 
  Edit3, 
  Copy, 
  Check, 
  MoreVertical, 
  CheckCheck,
  CornerDownRight,
  SmilePlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { isSameUser } from '../services/api';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export default function MessageBubble({
  message,
  isSender,
  senderPhone,
  partnerName = 'Partner',
  bubbleBoxColor,
  bubbleTextColor,
  onReply,
  onEdit,
  onReact,
  activeTheme
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');
  
  // Touch Swipe to Reply state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const canEdit = isSender && (Date.now() - message.created_at <= FIFTEEN_MINUTES_MS);

  // Handle Swipe-to-reply without interfering with vertical scroll
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e) => {
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;

    // If movement is predominantly vertical, let native scrolling take over
    if (!isHorizontalSwipe.current && Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }

    // Only activate swipe if horizontal swipe is clearly intended (> 15px)
    if (diffX > 15 && diffX < 85 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      isHorizontalSwipe.current = true;
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset >= 45) {
      onReply(message);
      if (navigator.vibrate) navigator.vibrate(20);
    }
    setSwipeOffset(0);
    isHorizontalSwipe.current = false;
  };

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReactionClick = (emoji) => {
    onReact(message.id, emoji);
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.8 }
    });
    setShowMenu(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText !== message.text) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  // Timestamp formatting (e.g. 11:34 PM)
  const timeStr = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Dynamic bubble styling depending on theme and 2-color customizer
  const getBubbleStyle = () => {
    if (isSender) {
      return {
        backgroundColor: bubbleBoxColor,
        color: bubbleTextColor,
        borderColor: 'rgba(255,255,255,0.18)'
      };
    }

    if (activeTheme === 'nordic') {
      return {
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        color: '#f4f4f5',
        borderColor: 'rgba(255, 255, 255, 0.12)'
      };
    }

    if (activeTheme === 'cyber') {
      return {
        backgroundColor: '#141619',
        color: '#e4e4e7',
        borderColor: 'rgba(52, 211, 153, 0.25)'
      };
    }

    // Default Swiss Mono
    return {
      backgroundColor: '#18181b',
      color: '#f4f4f5',
      borderColor: '#27272a'
    };
  };

  return (
    <div 
      className={`relative flex items-end gap-2 group transition-transform ${isSender ? 'justify-end ml-auto max-w-[70%]' : 'justify-start mr-auto max-w-[70%]'}`}
      style={{ transform: `translateX(${swipeOffset}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Visual swipe reply indicator */}
      {swipeOffset > 25 && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-zinc-400 animate-pulse">
          <Reply className="w-5 h-5" />
        </div>
      )}

      {/* Receiver Avatar Initials */}
      {!isSender && (
        <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] flex items-center justify-center font-bold text-zinc-300 shrink-0 mb-1">
          {partnerName && partnerName !== 'Partner' ? partnerName.slice(0, 2).toUpperCase() : (message.sender_phone ? message.sender_phone.slice(-2) : 'P2')}
        </div>
      )}

      <div className={`space-y-1 ${isSender ? 'items-end text-right' : 'items-start text-left'} max-w-full flex flex-col`}>
        
        {/* Quoted Reply Reference */}
        {message.reply_to && (
          <div className="text-left text-xs p-2 px-3 rounded-xl bg-zinc-900/80 border-l-2 border-emerald-400 text-zinc-400 max-w-full w-fit mb-0.5 backdrop-blur-sm shadow-sm">
            <span className="font-semibold text-zinc-200 text-[10px] block">
              Replying to {isSameUser(message.reply_to.sender_phone || message.reply_to.sender_id, senderPhone) ? 'You' : partnerName}
            </span>
            <p className="truncate text-[11px] text-zinc-300">{message.reply_to.text || '[Media]'}</p>
          </div>
        )}

        {/* Bubble Box - Stays within 70% container width */}
        <div
          onClick={(e) => {
            if (e.target.closest('a') || e.target.closest('img') || e.target.closest('audio') || e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
              return;
            }
            setShowMenu(prev => !prev);
          }}
          className={`p-3 sm:p-3.5 rounded-2xl text-sm shadow-md relative border transition-all select-text w-fit max-w-full ${
            isSender ? 'rounded-br-sm' : 'rounded-bl-sm'
          }`}
          style={getBubbleStyle()}
        >
          
          {/* Media Attachment if present */}
          {message.media_url && (
            <div className="mb-2 rounded-xl overflow-hidden border border-black/10 max-w-full">
              {message.media_type?.startsWith('image') || message.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img
                  src={message.media_url}
                  alt="Attachment"
                  className="w-full h-auto object-cover max-h-72 hover:scale-105 transition duration-300 cursor-pointer"
                  onClick={() => window.open(message.media_url, '_blank')}
                />
              ) : message.media_type?.startsWith('audio') ? (
                <audio controls className="w-full mt-1">
                  <source src={message.media_url} type={message.media_type} />
                </audio>
              ) : (
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 bg-black/20 text-xs underline truncate"
                >
                  View Attachment
                </a>
              )}
            </div>
          )}

          {/* Text or Inline Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2 mt-1 min-w-[200px]">
              <textarea
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit(e);
                  }
                }}
                className="w-full bg-black/20 text-inherit border border-current rounded-lg p-2 text-xs focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              <div className="flex justify-end gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-0.5 rounded bg-black/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded bg-white text-black font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <p className="whitespace-pre-wrap break-words [word-break:break-word] leading-relaxed text-[13px]">{message.text}</p>
          )}

          {/* Footer: Edited badge, Timestamp, and Delivery status */}
          <div className="flex items-center justify-end gap-2 mt-1.5 text-[10px] opacity-75 font-mono">
            {message.is_edited === 1 && (
              <span className="text-[9px] bg-black/10 px-1 py-0.2 rounded font-sans">
                edited
              </span>
            )}
            <span>{timeStr}</span>
            {isSender && (
              message.is_read === 1 ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-400 shrink-0 inline" title="Seen by partner" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0 inline opacity-60" title="Delivered" />
              )
            )}
          </div>

          {/* Emoji Reactions Badges */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="absolute -bottom-2.5 right-2 flex items-center gap-1">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleReactionClick(emoji)}
                  className="bg-zinc-800/95 border border-zinc-700 text-xs px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-md hover:scale-110 transition"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] text-zinc-300 font-mono">{users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hover / Tap Action Bar (React, Reply, Edit, Copy) */}
          <div className={`absolute -top-4 right-2 ${showMenu ? 'flex' : 'hidden'} group-hover:flex items-center gap-1 bg-zinc-900/95 border border-zinc-700 px-2 py-1 rounded-full text-xs shadow-xl backdrop-blur-md z-20`}>
            <button
              type="button"
              onClick={() => handleReactionClick('❤️')}
              className="hover:scale-125 transition p-0.5 cursor-pointer"
              title="Love"
            >
              ❤️
            </button>
            <button
              type="button"
              onClick={() => handleReactionClick('🔥')}
              className="hover:scale-125 transition p-0.5 cursor-pointer"
              title="Fire"
            >
              🔥
            </button>
            <button
              type="button"
              onClick={() => handleReactionClick('👍')}
              className="hover:scale-125 transition p-0.5 cursor-pointer"
              title="Thumbs Up"
            >
              👍
            </button>

            <span className="w-[1px] h-3 bg-zinc-700 mx-0.5"></span>

            <button
              type="button"
              onClick={() => { onReply(message); setShowMenu(false); }}
              className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Reply to message"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => { setIsEditing(true); setShowMenu(false); }}
                className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Edit message (15m window)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => { handleCopy(); setTimeout(() => setShowMenu(false), 800); }}
              className="p-1 text-zinc-300 hover:text-white transition cursor-pointer"
              title="Copy text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
