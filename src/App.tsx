/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, db } from './services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Pages (to be created)
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import { InactivityHandler } from './components/InactivityHandler';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  useEffect(() => {
    // Initial load from localStorage
    const savedCart = localStorage.getItem('nt_cart');
    const savedWishlist = localStorage.getItem('nt_wishlist');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  useEffect(() => {
    localStorage.setItem('nt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('nt_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user && user.emailVerified) {
        // Super admin check by email
        if (user.email === 'naisiaetext@gmail.com') {
          setIsAdmin(true);
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A1628]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C8961A]"></div>
      </div>
    );
  }

  return (
    <Router>
      <InactivityHandler>
        <Routes>
          <Route path="/" element={<HomePage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
          <Route path="/about" element={<AboutPage cart={cart} setCart={setCart} wishlist={wishlist} setWishlist={setWishlist} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin/*" 
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InactivityHandler>
    </Router>
  );
}

