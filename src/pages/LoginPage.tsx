import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LogIn, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in database and what their role is
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        throw err;
      }
      
      if (!userDoc.exists()) {
        // First time login - set default role to 'user'
        try {
          await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === 'naisiaetext@gmail.com' ? 'admin' : 'user',
            lastLogin: new Date().toISOString()
          });
          
          if (user.email === 'naisiaetext@gmail.com') {
            navigate('/admin');
          } else {
            setError('Access denied. You do not have administrator privileges.');
            await auth.signOut();
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          throw err;
        }
      } else {
        const userData = userDoc.data();
        
        // AUTO-UPGRADE logic for the primary admin email
        if (user.email === 'naisiaetext@gmail.com' && userData.role !== 'admin') {
          try {
            await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
            navigate('/admin');
            return;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
        }

        if (userData.role === 'admin' || user.email === 'naisiaetext@gmail.com') {
          navigate('/admin');
        } else {
          setError('Access denied. You do not have administrator privileges.');
          await auth.signOut();
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#C8102E]/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#C8961A]/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md bg-[#152849]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-[#C8102E] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#C8102E]/20 rotate-3">
            <ShieldCheck size={32} className="text-white -rotate-3" />
          </div>
          <h1 className="font-['Bebas_Neue'] text-3xl tracking-[3px] text-[#C8961A] mb-2 uppercase">Platform Secure Login</h1>
          <p className="text-gray-400 text-sm">Protected administrator management portal for Naisiae Textile</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></div>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full h-14 bg-white hover:bg-gray-50 text-[#0A1628] font-bold rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] relative group overflow-hidden"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-gray-100 border-t-[#0A1628] rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Sign in with Google Account
                <ArrowRight size={18} className="absolute right-6 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all" />
              </>
            )}
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-white/5"></div>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[2px]">Admin Authentication</span>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>

          <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest leading-relaxed">
            By continuing, you agree to the Naisiae Textile <br /> data processing and security terms.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
