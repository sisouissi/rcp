import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { mockUsers } from '../data/mockData';
import { supabase } from '../services/supabaseClient';

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const isDemoMode = supabaseUrl === "https://placeholder.supabase.co";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For demo mode, we don't need to check for a live session.
    // We start with no user logged in.
    if (isDemoMode) {
        setIsLoading(false);
        return;
    }

    // For live mode, immediately check for an existing session.
    const checkUser = async () => {
        const currentUser = await authService.getUser();
        setUser(currentUser);
        setIsLoading(false);
    };

    checkUser();

    // Subscribe to future auth state changes.
const { data: authListener } = supabase.auth.onAuthStateChange(
  async () => {
    const currentUser = await authService.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }
);

    // Cleanup subscription on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
     if (isDemoMode) {
        if (password !== 'password') { // Hardcoded password for demo
          throw new Error("Mot de passe incorrect. Utilisez 'password' pour le mode démo.");
        }
        const foundUser = mockUsers.find(u => u.email === email);
        if (!foundUser) {
          throw new Error("Utilisateur non trouvé.");
        }
        setUser(foundUser);
        return foundUser;
    } else {
        const { user: supabaseUser } = await authService.signIn(email, password);
        // The onAuthStateChange listener will handle setting the user state.
        return supabaseUser;
    }
  };

  const signOut = async () => {
     if (isDemoMode) {
        setUser(null);
    } else {
        await authService.signOut();
        // The onAuthStateChange listener will handle setting user to null.
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
