import { supabase } from './supabaseClient';
import type { AuthResponse, AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Type interne enrichi (ajoute le profil)
export type User = {
  id: string;
  email: string | undefined;
  name: string;
  role: string;
  specialty?: string;
};

/* ---------- AUTHENTIFICATION ---------- */

const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse['data']> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/* ---------- SESSION / PROFIL ---------- */

const getSession = async (): Promise<{
  session: Session | null;
  error: AuthError | null;
}> => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

const getUser = async (): Promise<User | null> => {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.user) return null;

  const { user: authUser } = sessionData.session;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, specialty')
    .eq('id', authUser.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError.message);
    await supabase.auth.signOut();
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email,
    name: profile.full_name,
    role: profile.role,
    specialty: profile.specialty ?? undefined,
  };
};

/* ---------- LISTENER ---------- */

const onAuthStateChange = (callback: (user: User | null) => void) => {
  const { data: subscription } = supabase.auth.onAuthStateChange(
    async (_event: string, session: Session | null) => {
      if (!session?.user) {
        callback(null);
        return;
      }

      const user = await getUser();
      callback(user);
    }
  );

  return subscription;
};

/* ---------- EXPORT ---------- */

export const authService = {
  signIn,
  signOut,
  getUser,
  getSession,
  onAuthStateChange,
};
