import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getSession, updateUserProfile } from '@/lib/supabase';
import { AuthState, AuthUser, AuthSession } from '@/types/auth';

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
      subscription?.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
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
      
      const { data, error } = await supabase.auth.signInWithOtp({
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
      
      const { data, error } = await supabase.auth.verifyOtp({
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
