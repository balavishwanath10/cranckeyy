import React, { useState } from 'react';
import { 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  Smartphone, 
  Mail, 
  CheckCircle2, 
  Lock, 
  Unlock,
  Users, 
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { checkUserApi, loginWithPasswordApi, setPasswordApi, establishPairApi } from '../services/api';
import AlreadyConnectedModal from './AlreadyConnectedModal';

export default function AuthView({ onLoginSuccess }) {
  // Check if this device already has a registered email/phone with established pair
  const savedIdentifier = localStorage.getItem('cranckeyy_saved_identifier') || '';

  const [identifier, setIdentifier] = useState(savedIdentifier);
  const [step, setStep] = useState('identifier'); // 'identifier' | 'password' | 'set_password' | 'pairing'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifiedUser, setVerifiedUser] = useState(null);
  const [person2Id, setPerson2Id] = useState('');
  const [blockedPartner, setBlockedPartner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Detect whether current input looks like email or phone
  const isInputEmail = identifier.includes('@');

  const handleCheckIdentifier = async (e) => {
    if (e) e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || cleanId.length < 2) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await checkUserApi(cleanId);
      if (res.hasPassword) {
        // User already has a password set -> proceed to enter password
        setStep('password');
        setPassword('');
        if (res.displayName) {
          setDisplayName(res.displayName);
        }
      } else {
        // User is new or has not set a password yet -> proceed to set password
        setStep('set_password');
        setPassword('');
        setConfirmPassword('');
        setSuccessMsg('Set a secure password for your account to continue.');
      }
    } catch {
      setError('Unable to reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginWithPasswordApi(identifier.trim(), password);
      if (res.success) {
        localStorage.setItem('cranckeyy_saved_identifier', identifier.trim());

        if (res.isPaired) {
          // Returning user with established pair: enters chat!
          onLoginSuccess(res.user);
        } else {
          // Returning user without established pair: prompt to link partner
          setVerifiedUser(res.user);
          setStep('pairing');
          setSuccessMsg('Password verified! Link your partner to begin chatting.');
        }
      } else {
        setError(res.error || 'Incorrect password. Please try again.');
      }
    } catch {
      setError('Login failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await setPasswordApi(identifier.trim(), password, displayName.trim());
      if (res.success) {
        localStorage.setItem('cranckeyy_saved_identifier', identifier.trim());

        if (res.isPaired) {
          onLoginSuccess(res.user);
        } else {
          setVerifiedUser(res.user);
          setStep('pairing');
          setSuccessMsg('Password set successfully! Link your partner to begin chatting.');
        }
      } else {
        setError(res.error || 'Failed to set password');
      }
    } catch {
      setError('Failed to set password. Check network connection.');
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
          <p className="text-xs text-zinc-400">Exclusive 1-on-1 Messenger • Password Protected</p>
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
          <form onSubmit={handleCheckIdentifier} className="space-y-5">
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
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                Log in or register with your personal email or mobile number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2A: ENTER EXISTING PASSWORD */}
        {step === 'password' && (
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Header / Account info */}
            <div className="flex flex-col items-center justify-center space-y-2 pb-1">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shadow-inner">
                <Lock className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-center">
                <span className="text-xs font-mono text-zinc-300 font-semibold">{identifier}</span>
                <p className="text-[11px] text-zinc-400">
                  {displayName ? `Welcome back, ${displayName}!` : 'Enter your password to access the chat.'}
                </p>
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); setError(''); setSuccessMsg(''); }}
                  className="block text-[11px] text-zinc-500 hover:text-white underline mx-auto mt-1"
                >
                  (Change account)
                </button>
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 absolute left-3.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-11 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all font-mono"
                  required
                  autoFocus
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
                  <span>Enter Chat</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2B: SET NEW PASSWORD */}
        {step === 'set_password' && (
          <form onSubmit={handleSetPassword} className="space-y-4">
            {/* Header / Account info */}
            <div className="flex flex-col items-center justify-center space-y-2 pb-1">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shadow-inner">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-center">
                <span className="text-xs font-mono text-zinc-300 font-semibold">{identifier}</span>
                <p className="text-[11px] text-zinc-400">
                  Create a password to protect your 1-on-1 chat.
                </p>
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); setError(''); setSuccessMsg(''); }}
                  className="block text-[11px] text-zinc-500 hover:text-white underline mx-auto mt-1"
                >
                  (Change account)
                </button>
              </div>
            </div>

            {/* Optional Display Name */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-zinc-300">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all"
              />
            </div>

            {/* Set Password */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-zinc-300">Create Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all font-mono"
                  required
                  autoFocus
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
            </div>

            {/* Confirm Password */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-zinc-300">Confirm Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-zinc-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-zinc-400 hover:text-white transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Set Password & Enter</span>
                </>
              )}
            </button>
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
