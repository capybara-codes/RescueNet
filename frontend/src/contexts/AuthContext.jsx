import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo session first
    const demoRole = localStorage.getItem('rescuenet_demo_role');
    if (demoRole) {
      setUser({ uid: `demo_uid_${demoRole}`, email: `demo_${demoRole}@example.com`, isDemo: true });
      refreshProfile().finally(() => setLoading(false));
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => {
    localStorage.removeItem('rescuenet_demo_role');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = (email, password) => {
    localStorage.removeItem('rescuenet_demo_role');
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const demoLogin = async (role) => {
    setLoading(true);
    localStorage.setItem('rescuenet_demo_role', role);
    setUser({ uid: `demo_uid_${role}`, email: `demo_${role}@example.com`, isDemo: true });
    await refreshProfile();
    setLoading(false);
  };

  const googleLogin = () => {
    localStorage.removeItem('rescuenet_demo_role');
    return signInWithPopup(auth, new GoogleAuthProvider());
  };

  const logout = async () => {
    localStorage.removeItem('rescuenet_demo_role');
    await signOut(auth);
    setProfile(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, login, signup, googleLogin, logout, refreshProfile, demoLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
