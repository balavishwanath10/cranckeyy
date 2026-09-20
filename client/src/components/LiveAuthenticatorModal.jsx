import React, { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, X, Smartphone, RefreshCw, KeyRound } from 'lucide-react';

export default function LiveAuthenticatorModal({
  isOpen,
  onClose,
  phone,
  onSelectCode
}) {
  const [otp, setOtp] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !phone) return;

    let isMounted = true;

    const fetchOtp = async () => {
      try {
        const res = await fetch(`/api/auth/live-otp/${encodeURIComponent(phone.trim())}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setOtp(data.code);
          setSecondsRemaining(data.secondsRemaining || 60);
        }
      } catch (err) {
        console.error('Failed to fetch live OTP:', err);
      }
    };

    fetchOtp();

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          fetchOtp();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, phone]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (otp) {
      navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onSelectCode) onSelectCode(otp);
    }
  };

  const formattedOtp = otp ? `${otp.slice(0, 3)} ${otp.slice(3, 6)}` : '• • •  • • •';
  const strokeDashoffset = 100 - (secondsRemaining / 60) * 100;
  const isExpiringSoon = secondsRemaining <= 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 selection:bg-zinc-700 animate-in fade-in duration-150">
      <div className="max-w-sm w-full rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 space-y-6 relative">
        
        {/* Header (Google Authenticator Style) */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs shadow">
              G
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">cranckeyy Authenticator</h3>
              <p className="text-[10px] text-zinc-400">Live 1-Minute TOTP Generator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google Authenticator Account Card */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative group">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
              <span>cranckeyy ({phone || 'Account'})</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500">60s TOTP</span>
          </div>

          <div className="flex items-center justify-between py-1">
            {/* Big 6-digit code */}
            <span className="font-mono text-3xl font-bold tracking-wider text-white">
              {formattedOtp}
            </span>

            {/* Circular Countdown Progress (Like Google Authenticator) */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-zinc-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isExpiringSoon ? 'text-red-500 transition-all duration-1000' : 'text-emerald-400 transition-all duration-1000'}
                  strokeDasharray="100, 100"
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute font-mono text-[10px] font-bold ${isExpiringSoon ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`}>
                {secondsRemaining}s
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 font-mono">
            <span>Valid for current minute</span>
            <span className="text-emerald-400">Live Synced</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 border border-zinc-700"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy 6-Digit Code</span>
              </>
            )}
          </button>

          {onSelectCode && (
            <button
              type="button"
              onClick={() => { onSelectCode(otp); onClose(); }}
              className="flex-1 py-3 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shadow flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Use to Unlock</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
