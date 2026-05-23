// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  error: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Messages d'erreur Supabase → Français
function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials'))
    return 'Email ou mot de passe incorrect.';
  if (message.includes('Email not confirmed'))
    return 'Email non confirmé. Vérifiez votre boîte mail.';
  if (message.includes('User already registered'))
    return 'Un compte existe déjà avec cet email.';
  if (message.includes('Password should be at least'))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (message.includes('Unable to validate email'))
    return 'Adresse email invalide.';
  if (message.includes('rate limit'))
    return 'Trop de tentatives. Réessayez dans quelques minutes.';
  return message;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer pour nettoyage automatique des messages d'erreur (évite timers orphelins)
  const errorTimerRef = useRef<number | null>(null);

  // Évite les double-fetch lors des re-renders
  const fetchingRef = useRef(false);

  async function fetchProfile(userId: string) {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        setError(`Erreur de chargement du profil : ${fetchError.message}`);
        return;
      }

      setProfile((data as Profile | null) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setProfile(null);
    } finally {
      fetchingRef.current = false;
    }
  }

  async function refreshProfile() {
    if (!user) return;
    await fetchProfile(user.id);
  }

  useEffect(() => {
    // 1. Session initiale
    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        void fetchProfile(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Changements d'état (login, logout, confirmation email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // EMAIL_CONFIRMED ou SIGNED_IN → fetch profil
          void fetchProfile(currentSession.user.id).finally(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    // Validation basique côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = 'Adresse email invalide';
      setError(msg);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000) as unknown as number;
      return { error: new Error(msg) };
    }

    if (password.length < 8) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères';
      setError(msg);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000) as unknown as number;
      return { error: new Error(msg) };
    }

    // Clear previous error timer and state
    setError(null);
    if (errorTimerRef.current) {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const msg = translateAuthError(authError.message);
      setError(msg);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000) as unknown as number;
      return { error: new Error(msg) };
    }

    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    // Validation basique côté client
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      const msg = 'Adresse email invalide';
      setError(msg);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000) as unknown as number;
      return { error: new Error(msg) };
    }

    if (password.length < 8) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères';
      setError(msg);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000) as unknown as number;
      return { error: new Error(msg) };
    }

    // Clear previous error timer and state
    setError(null);
    if (errorTimerRef.current) {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // ✅ Après clic sur lien de confirmation → redirige vers /login
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (authError) {
      const msg = translateAuthError(authError.message);
      setError(msg);
      if (errorTimerRef.current) window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setError(null), 5000) as unknown as number;
      return { error: new Error(msg) };
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setError(null);
    setProfile(null);
  }

  // Cleanup des timers si le provider se démonte
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        window.clearTimeout(errorTimerRef.current);
        errorTimerRef.current = null;
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, error, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}