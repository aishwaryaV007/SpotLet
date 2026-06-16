import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  signInWithOTP: (phone: string) => Promise<boolean>;
  verifyOTP: (phone: string, token: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  // Check session on mount
  useEffect(() => {
    checkSession();
    
    // SAFETY NET: Force isLoading to false after 5 seconds no matter what
    const safetyTimer = setTimeout(() => {
      setState(prev => {
        if (prev.isLoading) {
          console.warn('Safety timeout: forcing isLoading to false');
          return { ...prev, isLoading: false };
        }
        return prev;
      });
    }, 5000);
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setState({
            user: session.user as any,
            session: session as any,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      // Add a timeout so the app doesn't hang forever if Supabase is unreachable
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timed out')), 10000)
      );
      
      const sessionPromise = supabase.auth.getSession();
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      const session = result?.data?.session;
      const error = result?.error;
      
      if (error) {
        console.warn('Session check returned error, clearing storage:', error.message);
        // Automatically clear invalid token from AsyncStorage
        await supabase.auth.signOut();
      }
      
      if (session) {
        setState({
          user: session.user as any,
          session: session as any,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      console.warn('Session check failed:', error.message);
      // Try to clear session if it failed/threw
      try {
        await supabase.auth.signOut();
      } catch (e) {}
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: error.message,
      });
    }
  }

  async function signInWithOTP(phone: string) {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        return false;
      }

      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
      return false;
    }
  }

  async function verifyOTP(phone: string, token: string) {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms',
      });

      if (error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        return false;
      }

      // Session is set automatically via onAuthStateChange listener
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
      return false;
    }
  }

  async function signOut() {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
        return false;
      }

      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
      return false;
    }
  }

  const value: AuthContextType = {
    ...state,
    signInWithOTP,
    verifyOTP,
    signOut,
    isLoggedIn: !!state.session && !!state.user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
