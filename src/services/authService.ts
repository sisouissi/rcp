import { supabase } from './supabaseClient';
import { User } from '../types';
import { AuthError, Session, AuthResponse } from '@supabase/supabase-js';

const signIn = async (email: string, password: string): Promise<AuthResponse['data']> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    return data;
};

const signOut = async (): Promise<{ error: AuthError | null }> => {
    return await supabase.auth.signOut();
};

const getSession = async (): Promise<{session: Session | null, error: AuthError | null}> => {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}

const getUser = async (): Promise<User | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        return null;
    }

    if (!session?.user) {
        return null;
    }

    try {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, role, specialty')
            .eq('id', session.user.id)
            .single();
        
        if(profileError) {
            console.error('Error fetching user profile:', profileError.message);
            // This might happen if a user exists in auth but not in profiles. Sign them out.
            await signOut();
            return null;
        }
        
        if(!profile) return null;

        return {
            id: session.user.id,
            email: session.user.email,
            name: profile.full_name,
            role: profile.role,
            specialty: profile.specialty,
        };
    } catch(e) {
        console.error('Failed to get user', e);
        return null;
    }
}

export const authService = {
  signIn,
  signOut,
  getUser,
  getSession,
};