import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { validateRegistration } from '../utils/domain.mjs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(auth));
  const [registering, setRegistering] = useState(false);
  const [profileRequired, setProfileRequired] = useState(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (current) => {
      setUser(current);
      setProfileRequired(Boolean(current && !current.displayName?.trim()));
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function register(name, email, password) {
    const error = validateRegistration({ name, email, password, confirmation: password });
    if (error) throw new Error(error);
    setRegistering(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        await updateProfile(credential.user, { displayName: name.trim() });
        setProfileRequired(false);
      } catch {
        setProfileRequired(true);
        throw new Error('A conta foi criada, mas o nome não foi salvo. Complete seu nome para continuar.');
      }
      setUser(auth.currentUser);
    } finally {
      setRegistering(false);
    }
  }

  async function completeProfile(name) {
    if (!name.trim()) throw new Error('Informe seu nome.');
    await updateProfile(auth.currentUser, { displayName: name.trim() });
    setProfileRequired(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, registering, profileRequired, completeProfile, login, register, logout: () => signOut(auth) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
