import React from 'react';
import { Plus, X, Sparkles, Clock, ArrowRight, RefreshCw } from 'lucide-react';

export default function NewSessionModal({
  isOpen,
  onClose,
  onConfirm,
  isCreating = false,
  currentMessageCount = 0,
  onOpenSessionsArchive
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="max-w-md w-full rounded-3xl bg-zinc-900/95 border border-zinc-700/80 p-5 sm:p-7 shadow-2xl relative z-10 backdrop-blur-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isCreating}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Emerald Plus Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center shadow-inner">
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Fresh 1-on-1 Canvas
          </span>
          <h3 className="text-xl font-black text-white tracking-tight">
            Start a New Session?
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
            This will seal your current conversation and start a clean chat from the beginning for you and your partner.
          </p>
        </div>

        {/* Informational Card */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Current Session:</span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold">
              {currentMessageCount} {currentMessageCount === 1 ? 'message' : 'messages'}
            </span>
          </div>
          <div className="flex items-start gap-2 pt-1.5 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
            <span>
              All current messages are saved and permanently accessible in <strong className="text-zinc-200">Settings → Sessions Archive</strong>.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCreating}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all active:scale-95 shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Starting Fresh Session...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Yes, Start Fresh Session</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            className="w-full py-2.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Quick link to view past sessions */}
        {onOpenSessionsArchive && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSessionsArchive();
              }}
              className="text-[11px] text-zinc-400 hover:text-white transition flex items-center justify-center gap-1 mx-auto font-mono cursor-pointer"
            >
              <span>View previous sessions in Archive</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
