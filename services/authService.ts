import { supabase } from './supabaseClient';
import { User } from '../types';
import { AuthError, Session, User as SupabaseUser } from '@supabase/supabase-js';

const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    return data;
};

const signOut = async () => {
    await supabase.auth.signOut();
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
    }
}


const onAuthStateChange = (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
            callback(null);
            return;
        }

        if (session?.user) {
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name, role, specialty')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching user profile in auth change:', profileError.message);
                    callback(null);
                    return;
                }

                if (profile) {
                    const appUser: User = {
                        id: session.user.id,
                        email: session.user.email,
                        name: profile.full_name,
                        role: profile.role,
                        specialty: profile.specialty,
                    };
                    callback(appUser);
                } else {
                    // User exists in auth but not in profiles table
                    callback(null);
                }
            } catch (e) {
                console.error('Error in onAuthStateChange:', e);
                callback(null);
            }
        } else if (event !== 'USER_DELETED') { // if no session, but not because of deletion, it's a signed out state
            callback(null);
        }
    });

    return subscription;
};

const updateUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        console.error("Error updating password:", error.message);
        throw new Error(`Erreur lors de la mise à jour du mot de passe: ${error.message}`);
    }
};

export const authService = {
  signIn,
  signOut,
  getUser,
  onAuthStateChange,
  getSession,
  updateUserPassword,
};
