import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  Lock, 
  Users, 
  ShieldCheck,
  Send
} from 'lucide-react';
import { requestOtp, verifyOtp, establishPairApi } from '../services/api';
import AlreadyConnectedModal from './AlreadyConnectedModal';

export default function AuthView({ onLoginSuccess }) {
  // Check if this device already has a registered email/phone with established pair
  const savedIdentifier = localStorage.getItem('cranckeyy_saved_identifier') || '';

  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [step, setStep] = useState('identifier'); // 'identifier' | 'otp' | 'pairing'
  const [otp, setOtp] = useState('');
  const [channel, setChannel] = useState('email');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [person2Id, setPerson2Id] = useState('');
  const [blockedPartner, setBlockedPartner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Detect whether current input looks like email or phone
  const isInputEmail = identifier.includes('@');

  const handleRequestOtp = async (targetId = identifier, isAuto = false) => {
    if (!targetId || targetId.trim().length < 3) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    if (!isAuto) setLoading(true);
    setError('');

    try {
      const res = await requestOtp(targetId.trim());
      if (res.success) {
        setChannel(res.channel || (targetId.includes('@') ? 'email' : 'sms'));
        setStep('otp');
        setSuccessMsg(res.message || `OTP dispatched to your registered ${targetId.includes('@') ? 'email' : 'mobile'}.`);
      } else {
        setError(res.error || 'Failed to dispatch OTP');
      }
    } catch {
      setError('Connection error. Please check backend server.');
    } finally {
      if (!isAuto) setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    try {
      const res = await requestOtp(identifier.trim());
      if (res.success) {
        setSuccessMsg(`New OTP sent to your registered ${identifier.includes('@') ? 'email' : 'mobile'}.`);
      } else {
        setError(res.error || 'Failed to resend OTP');
      }
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtp(identifier.trim(), otp.trim());
      if (res.success) {
        localStorage.setItem('cranckeyy_saved_identifier', identifier.trim());

        // Check if user already has an established connection
        if (res.isPaired) {
          // Returning user: connection established! Directly enters chat!
          onLoginSuccess(res.user);
        } else {
          // New user: must enter Person 2's email or phone number to establish pair!
          setVerifiedUser(res.user);
          setStep('pairing');
          setSuccessMsg('OTP verified! Now enter Person 2\'s email or phone to establish your pair.');
        }
      } else {
        setError(res.error || 'Invalid or expired OTP code');
      }
    } catch {
      setError('Verification failed. Check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleEstablishPair = async (e) => {
    if (e) e.preventDefault();
    if (!person2Id || person2Id.trim().length < 3) {
      setError('Please enter a valid email or phone number for Person 2');
      return;
    }
    if (person2Id.trim().toLowerCase() === identifier.trim().toLowerCase()) {
      setError('Person 2 must be different from your own email/phone');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await establishPairApi(identifier.trim(), person2Id.trim());
      if (res.success) {
        localStorage.setItem('cranckeyy_saved_identifier', identifier.trim());
        onLoginSuccess(verifiedUser);
      } else {
        if (res.alreadyConnected || res.error?.includes('Already connected with')) {
          setBlockedPartner(res.particularUser || person2Id.trim());
        }
        setError(res.error || 'Failed to establish connection');
      }
    } catch {
      setError('Failed to establish exclusive connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-6 bg-zinc-950 text-zinc-100 selection:bg-zinc-700 relative overflow-y-auto overscroll-contain">
      
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-zinc-800/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full rounded-3xl bg-zinc-900/95 border border-zinc-800 p-5 sm:p-8 shadow-2xl relative z-10 backdrop-blur-2xl my-auto">
        
        {/* App Logo */}
        <div className="text-center space-y-2 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-white text-black mx-auto flex items-center justify-center font-black text-2xl tracking-tighter shadow-lg">
            ck
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">cranckeyy</h1>
          <p className="text-xs text-zinc-400">Exclusive 1-on-1 Messenger • Email & Mobile OTP</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: ENTER EMAIL OR PHONE NUMBER */}
        {step === 'identifier' && (
          <form onSubmit={(e) => { e.preventDefault(); handleRequestOtp(); }} className="space-y-5">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Enter Your Email or Phone Number</label>
              <div className="relative flex items-center">
                {isInputEmail ? (
                  <Mail className="w-4 h-4 absolute left-3.5 text-zinc-500" />
                ) : (
                  <Smartphone className="w-4 h-4 absolute left-3.5 text-zinc-500" />
                )}
                <input
                  type="text"
                  placeholder="name@example.com or +91 94949 49494"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                A 6-digit OTP will be sent directly to this email or mobile number.
              </p>
            </div>



            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: ENTER OTP (STANDARD EXPIRY - NO 60s RELOADING) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            
            {/* Header / Info */}
            <div className="flex flex-col items-center justify-center space-y-2 pb-1">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400 shadow-inner">
                {identifier.includes('@') ? <Mail className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
              </div>
              <div className="text-center">
                <span className="text-xs font-mono text-zinc-300 font-semibold">{identifier}</span>
                <p className="text-[11px] text-zinc-500">
                  OTP sent to your {identifier.includes('@') ? 'email' : 'phone number'}.
                </p>
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); }}
                  className="block text-[11px] text-zinc-500 hover:text-white underline mx-auto mt-1"
                >
                  (Change email/phone)
                </button>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <span className="font-semibold text-zinc-300 block">Check your {identifier.includes('@') ? 'Email' : 'SMS'}</span>
              <p className="text-[11px] text-zinc-500">
                Please enter the 6-digit verification code delivered to your registered {identifier.includes('@') ? 'email inbox (or spam)' : 'phone messages'}.
              </p>
            </div>

            {/* 6-Digit OTP Input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Enter 6-Digit Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Verify OTP & Enter</span>
                </>
              )}
            </button>

            {/* Resend OTP Button */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-xs text-zinc-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Resending code...' : 'Didn\'t receive code? Resend OTP'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ESTABLISH CONNECTION (One-Time Setup for Brand New Users) */}
        {step === 'pairing' && (
          <form onSubmit={handleEstablishPair} className="space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">One-Time Setup: Link Partner</h3>
              <p className="text-xs text-zinc-400">
                You are registered as <span className="font-mono text-zinc-200">{identifier}</span>. Enter your partner's email address or phone number. Once linked, you will never be asked this again.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Partner's Email or Phone Number</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="partner@example.com or +91 98844 88448"
                  value={person2Id}
                  onChange={(e) => setPerson2Id(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all font-mono"
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Your partner can log in using this email or mobile without needing to link again.
              </p>
            </div>



            <button
              type="submit"
              disabled={loading || !person2Id.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Establish 1-on-1 Chat</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>

      {/* Pop up message: Already connected with @particular user */}
      <AlreadyConnectedModal
        isOpen={Boolean(blockedPartner)}
        particularUser={blockedPartner}
        onClose={() => setBlockedPartner(null)}
      />

    </div>
  );
}
