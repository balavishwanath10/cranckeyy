import React, { useState } from 'react';
import { Lock, Unlock, RefreshCw, AlertCircle, KeyRound, Eye, EyeOff, Mail, Smartphone } from 'lucide-react';
import { verifyPasswordApi } from '../services/api';

export default function InactivityLockModal({ userIdentifier, onUnlock }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmail = userIdentifier?.includes('@');

  const handleVerifyPassword = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyPasswordApi(userIdentifier, password);
      if (res.success) {
        onUnlock();
      } else {
        setError(res.error || 'Incorrect password. Please try again.');
      }
    } catch {
      setError('Verification failed. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4 selection:bg-zinc-700 animate-in fade-in duration-150 overflow-y-auto">
      <div className="max-w-sm w-full rounded-3xl bg-zinc-900 border border-zinc-700/80 p-5 sm:p-8 text-center space-y-4 sm:space-y-5 shadow-2xl relative my-auto max-h-[92dvh] overflow-y-auto overscroll-contain">
        
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white text-black mx-auto flex items-center justify-center font-black text-2xl shadow-xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white tracking-tight">cranckeyy Locked</h3>
          <p className="text-xs text-zinc-400">
            Session locked due to inactivity. Enter your password to resume chatting.
          </p>
        </div>

        {/* User Identity Info */}
        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-left">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            {isEmail ? <Mail className="w-4 h-4 text-emerald-400 shrink-0" /> : <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span className="truncate">{userIdentifier}</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerifyPassword} className="space-y-4">
          <div className="relative flex items-center">
            <KeyRound className="w-4 h-4 absolute left-3.5 text-zinc-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all font-mono"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-zinc-400 hover:text-white transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                <span>Unlock Chat</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

