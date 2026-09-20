import React, { useState, useEffect } from 'react';
import { Lock, RefreshCw, KeyRound, AlertCircle, ShieldCheck, Mail, Smartphone } from 'lucide-react';
import { requestOtp, verifyOtp } from '../services/api';

export default function InactivityLockModal({ userIdentifier, onUnlock }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isEmail = userIdentifier?.includes('@');

  // When lock appears, automatically send fresh OTP to registered mobile or email!
  const sendFreshOtp = async () => {
    if (!userIdentifier) return;
    setError('');
    try {
      const res = await requestOtp(userIdentifier);
      if (res.success) {
        setInfoMsg(`A fresh OTP code has been sent to your registered ${isEmail ? 'email' : 'mobile'} (${userIdentifier}).`);
      } else {
        setError(res.error || 'Failed to dispatch OTP');
      }
    } catch (err) {
      console.error('Auto-lock OTP dispatch error:', err);
    }
  };

  useEffect(() => {
    sendFreshOtp();
  }, [userIdentifier]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await requestOtp(userIdentifier);
      if (res.success) {
        setInfoMsg(`New OTP sent to ${userIdentifier}.`);
      } else {
        setError(res.error || 'Failed to resend code');
      }
    } catch {
      setError('Resend failed.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtp(userIdentifier, otp.trim());
      if (res.success) {
        onUnlock();
      } else {
        setError(res.error || 'Incorrect or expired OTP');
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
        
        <div className="w-16 h-16 rounded-2xl bg-white text-black mx-auto flex items-center justify-center font-black text-2xl shadow-xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-white tracking-tight">cranckeyy Locked</h3>
          <p className="text-xs text-zinc-400">
            Session expired due to inactivity. A new OTP has been sent to your registered {isEmail ? 'email' : 'mobile'}.
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            {isEmail ? <Mail className="w-4 h-4 text-emerald-400" /> : <Smartphone className="w-4 h-4 text-emerald-400" />}
            <span className="truncate">{userIdentifier}</span>
          </div>
          {infoMsg && (
            <p className="text-[11px] text-zinc-400 font-sans">{infoMsg}</p>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            placeholder="• • • • • •"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
            autoFocus
          />

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify OTP & Resume</span>
              </>
            )}
          </button>
        </form>

        {/* Resend Button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-xs text-zinc-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
          <span>{resending ? 'Sending new code...' : 'Resend OTP code'}</span>
        </button>

      </div>
    </div>
  );
}
