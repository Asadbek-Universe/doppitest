import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserType = 'student' | 'center';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userType?: UserType,
    options?: { centerName?: string; centerEmail?: string }
  ) => Promise<{ error: Error | null; user: User | null; requiresConfirmation?: boolean; session?: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!cancelled) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // Check for existing session - always resolve loading even on error/timeout
    const resolveAuth = () => {
      if (!cancelled) {
        setLoading(false);
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      })
      .catch((err) => {
        console.warn('Auth getSession failed:', err);
      })
      .finally(resolveAuth);

    // Fallback: if still loading after 8s (e.g. network hang), force resolve
    const timeoutId = setTimeout(resolveAuth, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userType: UserType = 'student',
    options?: { centerName?: string; centerEmail?: string }
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          app_role: userType === 'center' ? 'center' : 'user',
          ...(userType === 'center' && options && {
            center_name: options.centerName ?? '',
            center_email: options.centerEmail ?? email,
          }),
        },
      },
    });

    const requiresConfirmation = !!data.user && !data.session;

    return {
      error: error as Error | null,
      user: data.user ?? null,
      requiresConfirmation,
      session: data.session ?? null,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error as Error | null };
    }

    // Block suspended users based on profiles.blocked_at
    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('blocked_at')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profile?.blocked_at) {
        await supabase.auth.signOut();
        return {
          error: new Error(
            'Your account has been suspended. Please contact support.'
          ),
        };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
