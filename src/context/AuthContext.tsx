import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
// We model our user to map nicely to Supabase User or Mock User
interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isMock = !isSupabaseConfigured;

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // 1. Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          });
        }
        setLoading(false);
      });

      // 2. Listen for auth state shifts
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback LocalStorage Auth
      const storedSession = localStorage.getItem('adv_mock_user');
      if (storedSession) {
        setUser(JSON.parse(storedSession));
      }
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      // Mock Sign In: any non-empty password is fine
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }
      const mockUser: AuthUser = {
        id: 'mock-user-123',
        email: email,
        user_metadata: { name: email.split('@')[0] },
      };
      localStorage.setItem('adv_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const signUp = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } else {
      if (!email || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      const mockUser: AuthUser = {
        id: 'mock-user-123',
        email: email,
        user_metadata: { name: email.split('@')[0] },
      };
      localStorage.setItem('adv_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      localStorage.removeItem('adv_mock_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isMock }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
