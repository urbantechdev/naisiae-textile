import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
  ShoppingCart,
  Store,
  User as UserIcon,
  Delete,
  Search,
  Phone,
  UserPlus,
  Key,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { useNotification, AnimatedErrorCross } from '../context/NotificationContext';
import { api } from '../api';

type RoleCategory = 'ADMIN' | 'ACCOUNTANT' | 'STAFF';

interface StaffUserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  branchName: string;
  phone: string;
  hasPin: boolean;
}

const GoogleSignInButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  label?: string;
}> = ({ onClick, disabled, label = 'Sign in with Google as Administrator' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full min-h-[48px] flex items-center justify-center space-x-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm py-3 px-4 rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
  >
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
    <span className="truncate">{label}</span>
  </button>
);

export const LoginView: React.FC = () => {
  const { login, setupPrimaryAdmin, loginWithGoogleAdmin, loginWithPin } = useAuth();
  const { notify } = useNotification();

  // Setup mode when database has zero users
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Setup Form States
  const [setupForm, setSetupForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    pin: '',
  });

  // Standard Login States
  const [selectedRole, setSelectedRole] = useState<RoleCategory>('ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Staff PIN Authentication States
  const [staffList, setStaffList] = useState<StaffUserItem[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState<StaffUserItem | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [useEmailForStaff, setUseEmailForStaff] = useState(false);

  // Check setup status on initial mount
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const status = await api.getSetupStatus();
        if (isMounted) {
          setNeedsSetup(!status.hasUsers);
        }
      } catch (err) {
        console.warn('Failed to fetch setup status:', err);
      } finally {
        if (isMounted) {
          setIsCheckingSetup(false);
        }
      }
    };
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Google Admin Login
  const handleGoogleAdminLogin = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginWithGoogleAdmin();
      notify({
        type: 'SUCCESS',
        title: 'Google Sign-In Successful',
        message: 'Welcome to Naisiae ERP Administrator Workspace',
      });
      setNeedsSetup(false);
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed before completing authentication.');
      } else {
        setErrorMessage(err.message || 'Google administrator authentication failed');
      }
      notify({
        type: 'ERROR',
        title: 'Google Sign-In Failed',
        message: err.message || 'Authentication error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Initial Admin Registration
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!setupForm.name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!setupForm.email.trim() || !setupForm.email.includes('@')) {
      setErrorMessage('Please enter a valid administrator email address');
      return;
    }
    if (setupForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }
    if (setupForm.password !== setupForm.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (setupForm.pin && setupForm.pin.length !== 6) {
      setErrorMessage('Station PIN must be exactly 6 digits (or left blank)');
      return;
    }

    setIsSubmitting(true);
    try {
      await setupPrimaryAdmin({
        name: setupForm.name.trim(),
        email: setupForm.email.trim(),
        password: setupForm.password,
        phone: setupForm.phone.trim() || undefined,
        pin: setupForm.pin.trim() || undefined,
      });

      notify({
        type: 'SUCCESS',
        title: 'System Initialized',
        message: `Welcome, ${setupForm.name}! Primary administrator account created successfully.`,
      });
      setNeedsSetup(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create primary administrator');
      notify({
        type: 'ERROR',
        title: 'Setup Error',
        message: err.message || 'Could not initialize administrator account',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load staff users when tapping STAFF
  const loadStaffUsers = async () => {
    setIsLoadingStaff(true);
    try {
      const data = await api.getStaffUsers();
      const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
      setStaffList(sorted);
    } catch (err: any) {
      console.warn('Failed to load staff list:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Switch role category tab
  const handleSelectRole = (role: RoleCategory) => {
    setSelectedRole(role);
    setErrorMessage('');
    setEnteredPin('');
    setSelectedStaffUser(null);
    setUseEmailForStaff(false);
    setEmail('');
    setPassword('');

    if (role === 'STAFF') {
      loadStaffUsers();
    }
  };

  // Standard Email + Password submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login({ email: email.trim(), password });
      notify({
        type: 'SUCCESS',
        title: 'Authentication Successful',
        message: `Welcome to Naisiae ERP`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      notify({
        type: 'ERROR',
        title: 'Login Failed',
        message: err.message || 'Invalid credentials or inactive account',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // PIN Authentication Submission
  const handlePinSubmit = useCallback(
    async (pinToSubmit?: string) => {
      const pin = pinToSubmit || enteredPin;
      if (!selectedStaffUser) return;
      if (pin.length !== 6) {
        setErrorMessage('Please enter your full 6-digit PIN');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage('');

      try {
        await loginWithPin({ userId: selectedStaffUser.id, pin });
        notify({
          type: 'SUCCESS',
          title: 'Station Unlocked',
          message: `Welcome, ${selectedStaffUser.name}`,
        });
      } catch (err: any) {
        setErrorMessage(err.message || 'Incorrect 6-digit PIN. Please try again.');
        setEnteredPin('');
        notify({
          type: 'ERROR',
          title: 'PIN Verification Failed',
          message: err.message || 'Incorrect PIN entered',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [enteredPin, selectedStaffUser, loginWithPin, notify]
  );

  // Keypad Handlers
  const handleKeypadPress = (num: string) => {
    if (enteredPin.length < 6 && !isSubmitting) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);
      setErrorMessage('');
      if (newPin.length === 6) {
        setTimeout(() => handlePinSubmit(newPin), 80);
      }
    }
  };

  const handleKeypadBackspace = () => {
    if (enteredPin.length > 0 && !isSubmitting) {
      setEnteredPin(enteredPin.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleKeypadClear = () => {
    setEnteredPin('');
    setErrorMessage('');
  };

  // Keyboard Listener
  useEffect(() => {
    if (selectedRole !== 'STAFF' || !selectedStaffUser || useEmailForStaff) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleKeypadClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (enteredPin.length === 6) {
          handlePinSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRole, selectedStaffUser, enteredPin, useEmailForStaff, handlePinSubmit]);

  // Filtered staff list
  const filteredStaff = staffList.filter((s) => {
    const q = staffSearchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.branchName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center p-4">
        <div className="w-9 h-9 border-3 border-[#030A91] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-600">Connecting to Naisiae ERP...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] flex flex-col justify-between select-none">
      {/* ==================================================== */}
      {/* END-TO-END HEADER WITH SIGNATURE BOTTOM WAVE CURVE   */}
      {/* ==================================================== */}
      <header className="w-full relative bg-gradient-to-r from-[#02066F] via-[#030A91] to-[#0412B3] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-5 sm:pt-16 sm:pb-12 text-center relative z-10">
          <div className="inline-flex items-center justify-center space-x-3 sm:space-x-4">
            <img
              src="https://plain-eeur-prod-public.komododecks.com/202605/07/1sm3ITZIdJmYjyTcxmiP/image.png"
              alt="Naisia Textiles Logo"
              className="w-14 h-14 sm:w-22 sm:h-22 object-contain shrink-0 drop-shadow-md rounded-2xl bg-white/10 p-1.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <div className="text-left">
              <h1 className="text-xl sm:text-4xl font-black tracking-tight leading-none text-white drop-shadow-sm">
                NAISIAE ERP
              </h1>
              <p className="text-[11px] sm:text-sm text-[#FACB00] font-bold tracking-widest mt-1 uppercase">
                TEXTILES &amp; UNIFORMS
              </p>
            </div>
          </div>
        </div>

        {/* SIGNATURE SINGLE WAVE CURVED BOTTOM EDGE (INCREASED 50%) */}
        <div className="w-full leading-none overflow-hidden select-none -mb-[1px]">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-12 sm:h-24 md:h-28 block"
            preserveAspectRatio="none"
          >
            {/* Subtle Golden Accent Wave shadow behind */}
            <path
              d="M0,20 C360,95 1080,-10 1440,65 L1440,120 L0,120 Z"
              fill="#FACB00"
              fillOpacity="0.25"
            />
            {/* Primary Background wave cut */}
            <path
              d="M0,0 C380,85 1060,-20 1440,50 L1440,120 L0,120 Z"
              fill="#F4F4F4"
            />
          </svg>
        </div>
      </header>

      {/* ==================================================== */}
      {/* MAIN CONTENT / MOBILE CONTAINER                      */}
      {/* ==================================================== */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 -mt-6 sm:-mt-12 md:-mt-16 py-4 sm:py-8 w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto z-10">
        {/* ==================================================== */}
        {/* 1. INITIAL ADMIN SETUP FLOW (WHEN DB HAS 0 USERS)    */}
        {/* ==================================================== */}
        {needsSetup ? (
          <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#030A91] to-[#0412B3] text-white text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/15 mx-auto flex items-center justify-center mb-2 shadow-inner">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-[#FACB00]" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">System Administrator Setup</h2>
              <p className="text-xs text-blue-200 mt-0.5">
                No users configured. Sign in with Google or create credentials to initialize.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs">
                  <AnimatedErrorCross size={22} className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Fast Google Admin Setup */}
              <div>
                <GoogleSignInButton
                  onClick={handleGoogleAdminLogin}
                  disabled={isSubmitting}
                  label="Initialize with Google Account"
                />
                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400">
                    Or create password manually
                  </span>
                </div>
              </div>

              <form onSubmit={handleSetupSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={setupForm.name}
                      onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
                      placeholder="e.g. Master Administrator"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoCapitalize="none"
                      autoCorrect="off"
                      inputMode="email"
                      autoComplete="email"
                      value={setupForm.email}
                      onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                      placeholder="admin@yourdomain.com"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password (min. 6 chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={setupForm.password}
                        onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={setupForm.confirmPassword}
                        onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={setupForm.phone}
                        onChange={(e) => setSetupForm({ ...setupForm, phone: e.target.value })}
                        placeholder="+254 700 000 000"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Station PIN (6 Digits, Optional)
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={setupForm.pin}
                        onChange={(e) => setSetupForm({ ...setupForm, pin: e.target.value.replace(/\D/g, '') })}
                        placeholder="e.g. 123456"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] mt-2 py-3 bg-[#030A91] hover:bg-blue-900 active:bg-blue-950 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Creating Administrator...' : 'Initialize & Open ERP'}</span>
                  <ArrowRight className="w-4 h-4 text-[#FACB00]" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ==================================================== */
          /* 2. OPERATIONAL MODE WITH ERGONOMIC MOBILE TABS       */
          /* ==================================================== */
          <div className="w-full space-y-3">
            {/* MOBILE & DESKTOP ERGONOMIC DEPARTMENT SEGMENTED TABS */}
            <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center shadow-inner">
              <button
                type="button"
                onClick={() => handleSelectRole('ADMIN')}
                className={`flex-1 min-h-[42px] sm:min-h-[44px] rounded-xl flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'bg-[#030A91] text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('ACCOUNTANT')}
                className={`flex-1 min-h-[42px] sm:min-h-[44px] rounded-xl flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'ACCOUNTANT'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span className="truncate">Finance</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRole('STAFF')}
                className={`flex-1 min-h-[42px] sm:min-h-[44px] rounded-xl flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === 'STAFF'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span className="truncate">POS PIN</span>
              </button>
            </div>

            {/* ERROR BANNER */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2.5 text-rose-800 text-xs animate-in fade-in">
                <AnimatedErrorCross size={22} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB CONTENT: ADMIN PORTAL */}
            {selectedRole === 'ADMIN' && (
              <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
                <div className="text-center pb-2 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#030A91] mx-auto flex items-center justify-center mb-1.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Administrator Sign In
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-branch control, user management &amp; settings
                  </p>
                </div>

                {/* PROMINENT GOOGLE SIGN-IN BUTTON */}
                <div>
                  <GoogleSignInButton
                    onClick={handleGoogleAdminLogin}
                    disabled={isSubmitting}
                    label="Sign In with Google as Admin"
                  />
                  <div className="relative my-3 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400">
                      Or use password
                    </span>
                  </div>
                </div>

                {/* EMAIL & PASSWORD FORM */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoCapitalize="none"
                        autoCorrect="off"
                        inputMode="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@yourdomain.com"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#030A91] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] py-3 bg-[#030A91] hover:bg-blue-900 active:bg-blue-950 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                    <ArrowRight className="w-4 h-4 text-[#FACB00]" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: ACCOUNTANT / FINANCE PORTAL */}
            {selectedRole === 'ACCOUNTANT' && (
              <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 space-y-4 animate-in fade-in duration-150">
                <div className="text-center pb-2 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center mb-1.5">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Accountant Sign In
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Invoicing, financial ledgers, taxes &amp; KRA eTIMS
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Finance Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        autoCapitalize="none"
                        autoCorrect="off"
                        inputMode="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="accountant@yourdomain.com"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[48px] py-3 bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Finance'}</span>
                    <ArrowRight className="w-4 h-4 text-[#FACB00]" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: STAFF / POS TERMINAL */}
            {selectedRole === 'STAFF' && (
              <div className="w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in duration-150">
                {!useEmailForStaff && !selectedStaffUser ? (
                  /* 3A. STAFF CASHIER SELECTION LIST */
                  <div className="p-4 sm:p-6 space-y-3">
                    <div className="text-center pb-2 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-1.5">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        Select POS Cashier Account
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tap your name to enter your 6-digit terminal PIN
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        placeholder="Search cashier name or station..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
                      />
                    </div>

                    {isLoadingStaff ? (
                      <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
                        Loading cashier profiles...
                      </div>
                    ) : filteredStaff.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl p-4">
                        <p className="font-bold text-slate-700 mb-1">No staff cashier accounts found.</p>
                        <p className="text-slate-500 mb-3">
                          {staffList.length === 0
                            ? 'The administrator can add staff members in User Management.'
                            : 'No staff profiles match your search query.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setUseEmailForStaff(true)}
                          className="min-h-[44px] px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Sign In with Email &amp; Password Instead
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-0.5">
                        {filteredStaff.map((staff) => (
                          <div
                            key={staff.id}
                            onClick={() => {
                              setSelectedStaffUser(staff);
                              setEnteredPin('');
                              setErrorMessage('');
                            }}
                            className="p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 active:bg-emerald-100 transition cursor-pointer flex items-center space-x-3 text-left"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#030A91] text-[#FACB00] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-sm text-slate-900 truncate block">
                                {staff.name}
                              </span>
                              <span className="text-xs text-slate-500 truncate block">
                                {staff.branchName}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              PIN &rarr;
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setUseEmailForStaff(true)}
                        className="text-slate-600 hover:text-[#030A91] font-semibold underline cursor-pointer py-1"
                      >
                        Sign in with email &amp; password
                      </button>
                      <span className="text-slate-400 text-[11px]">
                        {filteredStaff.length} Cashier{filteredStaff.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                ) : !useEmailForStaff && selectedStaffUser ? (
                  /* 3B. ERGONOMIC TOUCH PIN KEYPAD */
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffUser(null);
                          setEnteredPin('');
                          setErrorMessage('');
                        }}
                        className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        <span>Back</span>
                      </button>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Station POS
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#030A91] text-[#FACB00] mx-auto flex items-center justify-center font-bold text-base shadow-sm mb-1.5">
                        {selectedStaffUser.name.slice(0, 2).toUpperCase()}
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{selectedStaffUser.name}</h4>
                      <p className="text-xs text-slate-500">{selectedStaffUser.branchName}</p>
                    </div>

                    {/* PIN INDICATORS */}
                    <div>
                      <div className="flex items-center justify-center space-x-3 my-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const isFilled = index < enteredPin.length;
                          return (
                            <div
                              key={index}
                              className={`w-3.5 h-3.5 rounded-full transition-all duration-100 ${
                                isFilled
                                  ? 'bg-[#030A91] ring-3 ring-[#FACB00] scale-110 shadow-xs'
                                  : 'border-2 border-slate-300 bg-slate-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* MOBILE THUMB TOUCH KEYPAD */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleKeypadPress(digit)}
                          className="min-h-[52px] sm:min-h-[56px] rounded-2xl bg-slate-100 hover:bg-[#030A91] hover:text-[#FACB00] active:bg-[#030A91] active:text-[#FACB00] text-slate-800 font-black text-2xl transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          {digit}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={isSubmitting || enteredPin.length === 0}
                        onClick={handleKeypadClear}
                        className="min-h-[52px] sm:min-h-[56px] rounded-2xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 text-slate-500 font-bold text-xs uppercase tracking-wider transition-all shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-30"
                      >
                        Clear
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleKeypadPress('0')}
                        className="min-h-[52px] sm:min-h-[56px] rounded-2xl bg-slate-100 hover:bg-[#030A91] hover:text-[#FACB00] active:bg-[#030A91] active:text-[#FACB00] text-slate-800 font-black text-2xl transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
                      >
                        0
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || enteredPin.length === 0}
                        onClick={handleKeypadBackspace}
                        className="min-h-[52px] sm:min-h-[56px] rounded-2xl bg-slate-100 hover:bg-amber-100 hover:text-amber-800 active:bg-amber-200 text-slate-600 font-bold transition-all shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-30"
                      >
                        <Delete className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting || enteredPin.length !== 6}
                      onClick={() => handlePinSubmit()}
                      className="w-full min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md disabled:opacity-40 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'Verifying PIN...' : 'Unlock POS Station'}</span>
                      <ArrowRight className="w-4 h-4 text-[#FACB00]" />
                    </button>
                  </div>
                ) : (
                  /* 3C. STAFF EMAIL/PASSWORD FORM FALLBACK */
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() => setUseEmailForStaff(false)}
                        className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        <span>Use PIN Pad</span>
                      </button>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Staff Password
                      </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Staff Email
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            inputMode="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="staff@yourdomain.com"
                            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Staff'}</span>
                        <ArrowRight className="w-4 h-4 text-[#FACB00]" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* SIGNATURE FOOTER WITH MATCHING TOP EDGE WAVE CURVE   */}
      {/* ==================================================== */}
      <footer className="w-full relative bg-gradient-to-r from-[#02066F] via-[#030A91] to-[#0412B3] text-white mt-auto">
        {/* TOP EDGE WAVE CURVE TRANSITION */}
        <div className="w-full leading-none overflow-hidden select-none -mt-[1px]">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-7 sm:h-12 md:h-14 block"
            preserveAspectRatio="none"
          >
            {/* Upper slice matching page background #F4F4F4 */}
            <path
              d="M0,0 L1440,0 L1440,55 C1080,115 360,15 0,80 Z"
              fill="#F4F4F4"
            />
            {/* Subtle Golden Accent ribbon along the wave */}
            <path
              d="M0,80 C360,15 1080,115 1440,55 L1440,70 C1080,130 360,30 0,95 Z"
              fill="#FACB00"
              fillOpacity="0.32"
            />
          </svg>
        </div>

        {/* FOOTER CONTENT */}
        <div className="max-w-7xl mx-auto px-4 pt-1 pb-4 sm:pb-6 text-center text-xs text-blue-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-white tracking-wide text-xs sm:text-sm">NAISIAE ERP</span>
            <span className="text-[#FACB00] font-black">&bull;</span>
            <span className="text-blue-200 text-[11px] sm:text-xs">Naisia Textiles Enterprise</span>
          </div>
          <div className="text-[11px] sm:text-xs text-blue-200/90 font-medium">
            &copy; {new Date().getFullYear()} All Rights Reserved &bull; Multi-Branch Operational Management
          </div>
        </div>
      </footer>
    </div>
  );
};
