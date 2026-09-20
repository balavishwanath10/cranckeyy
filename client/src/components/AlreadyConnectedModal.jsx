import React from 'react';
import { ShieldAlert, Lock, X, ArrowRight } from 'lucide-react';

export default function AlreadyConnectedModal({
  isOpen,
  onClose,
  particularUser
}) {
  if (!isOpen) return null;

  const displayUser = particularUser?.startsWith('@') ? particularUser : `@${particularUser}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="max-w-sm w-full rounded-3xl bg-zinc-900/95 border border-red-500/40 p-5 sm:p-6 shadow-2xl relative z-10 backdrop-blur-2xl text-center space-y-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Badge Icon */}
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 mx-auto flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Header & Exact Pop-up Message */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            Exclusive 1-on-1 Limit
          </span>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Connection Blocked
          </h3>
          
          {/* THE EXACT REQUIRED POP UP MESSAGE */}
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 font-mono text-sm font-bold break-all shadow-inner">
            Already connected with {displayUser}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            cranckeyy strictly limits connections to an exclusive pair. This account already has a locked 1-on-1 channel.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all active:scale-95 shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Try Another Contact</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
