import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { LogIn, ShieldCheck, Mail, ArrowRight, Lock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handlePostLogin = async (user: any) => {
    // Check if user exists in database and what their role is
    let userDoc;
    try {
      userDoc = await getDoc(doc(db, 'users', user.uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      throw err;
    }
    
    if (!userDoc.exists()) {
      // First time login - check for active invitations
      const adminEmails = [
        'naisiaetext@gmail.com',
        'Kirigommk@gmail.com',
        'Kgeokom@gmail.com',
        'naisiaetextile@gmail.com'
      ];
      const isAnyAdmin = user.email && adminEmails.includes(user.email);
      let role = isAnyAdmin ? 'admin' : 'user';
      
      try {
        const inviteDoc = await getDoc(doc(db, 'invites', user.email));
        if (inviteDoc.exists()) {
          role = inviteDoc.data().role === 'admin' && !adminEmails.includes(user.email) ? 'user' : inviteDoc.data().role;
          // Delete invitation after use
          try {
            await deleteDoc(doc(db, 'invites', user.email));
          } catch (e) {
            console.error("Failed to cleanup invitation:", e);
          }
        }

        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          role: role,
          lastLogin: new Date().toISOString()
        });
        
        if (isAnyAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        throw err;
      }
    } else {
      const userData = userDoc.data();
      const adminEmails = [
        'naisiaetext@gmail.com',
        'Kirigommk@gmail.com',
        'Kgeokom@gmail.com',
        'naisiaetextile@gmail.com'
      ];
      const isAnyAdmin = user.email && adminEmails.includes(user.email);
      
      // AUTO-UPGRADE logic for admins
      if (isAnyAdmin && userData.role !== 'admin') {
        try {
          await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
          navigate('/admin');
          return;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }

      if (isAnyAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostLogin(result.user);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during Google login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(result.user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. If you haven\'t set a password yet, please use the Google login method above.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please use Google Login to register automatically.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again or use Google Login.');
      } else {
        setError('An error occurred during sign in. We recommend using Google Login for faster access.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08047D] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden text-center">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#08047D]/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FA9411]/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-[#152849]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-[#08047D] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#08047D]/20 rotate-3">
            <ShieldCheck size={32} className="text-white -rotate-3" />
          </div>
          <h1 className="font-display text-3xl tracking-[3px] text-[#FA9411] mb-2 uppercase">Platform Secure Login</h1>
          <p className="text-gray-400 text-sm">Protected administrator management portal for Naisiae Textiles Limited</p>
        </div>

        {/* Method Switcher */}
        <div className="flex p-1 bg-black/20 rounded-xl mb-8">
          <button 
            onClick={() => setLoginMethod('google')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'google' ? 'bg-[#FA9411] text-[#08047D]' : 'text-white/40 hover:text-white/60'}`}
          >
            Google OAuth
          </button>
          <button 
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'email' ? 'bg-[#FA9411] text-[#08047D]' : 'text-white/40 hover:text-white/60'}`}
          >
            Email & Pass
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loginMethod === 'google' ? (
            <motion.div
              key="google"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button 
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full h-14 bg-white hover:bg-gray-50 text-[#08047D] font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] relative group overflow-hidden"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-gray-100 border-t-[#08047D] rounded-full animate-spin"></div>
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Sign in with Google Account
                    <ArrowRight size={18} className="absolute right-6 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all" />
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleEmailLogin}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Administrator ID</label>
                <div className="relative group">
                  <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#FA9411] transition-colors" />
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your identifier..."
                    className="w-full h-12 bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 text-sm text-white outline-none focus:border-[#FA9411]/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#FA9411] transition-colors" />
                  <input 
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12 bg-black/20 border border-white/5 rounded-xl pl-12 pr-4 text-sm text-white outline-none focus:border-[#FA9411]/50 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#08047D] hover:bg-[#050259] text-white font-black uppercase tracking-[2px] text-xs rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-red-200 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn size={18} />
                    Secure Sign In
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest leading-relaxed">
            By continuing, you agree to the Naisiae Textiles Limited <br /> data processing and security terms.
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="text-[10px] text-[#FA9411] font-bold uppercase tracking-widest hover:text-white transition-colors">
              ← Back to Uhuru Market Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
