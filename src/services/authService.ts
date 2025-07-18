import { User } from '../types';
import { AuthError, Session, User as SupabaseUser, AuthResponse, AuthChangeEvent } from '@supabase/supabase-js';

const signIn = async (email: string, password: string): Promise<AuthResponse['data']> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) throw error;
    return data;
};

const signOut = async (): Promise<void> => {
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

    const profileResponse = await supabase
        .from('profiles')
        .select('full_name, role, specialty')
        .eq('id', session.user.id)
        .single();
    
    if(profileResponse.error) {
        console.error('Error fetching user profile:', profileResponse.error.message);
        // This might happen if a user exists in auth but not in profiles. Sign them out.
        await supabase.auth.signOut();
        return null;
    }
    
    if(!profileResponse.data) return null;

    const profile = profileResponse.data;

    return {
        id: session.user.id,
        email: session.user.email,
        name: profile.full_name,
        role: profile.role,
        specialty: profile.specialty,
    }
}


const onAuthStateChange = (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT' || !session) {
            callback(null);
            return;
        }

        // For any event that results in a session, get the user profile.
        try {
            const profileResponse = await supabase
                .from('profiles')
                .select('full_name, role, specialty')
                .eq('id', session.user.id)
                .single();

            if (profileResponse.error) {
                console.error('Error fetching profile on auth change:', profileResponse.error.message);
                await supabase.auth.signOut();
                callback(null);
                return;
            }
            
            const profile = profileResponse.data;
            if (profile) {
                 const user: User = {
                    id: session.user.id,
                    email: session.user.email,
                    name: profile.full_name,
                    role: profile.role,
                    specialty: profile.specialty,
                };
                callback(user);
            } else {
                console.warn(`User ${session.user.id} is signed in but has no profile. Signing out.`);
                await supabase.auth.signOut();
                callback(null);
            }
        } catch (e) {
            console.error("Unexpected error in onAuthStateChange handler:", e);
            callback(null);
        }
    });

    return subscription;
}

export const authService = {
  signIn,
  signOut,
  getUser,
  onAuthStateChange,
  getSession,
};
