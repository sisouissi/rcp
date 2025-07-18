import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { mockUsers } from '../data/mockData';

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const isDemoMode = supabaseUrl === "https://placeholder.supabase.co";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => void;
}

const register = async (email: string, password: string) => {
  // ton code
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
        setIsLoading(false);
        return; // No subscription needed for demo mode
    }

    const subscription = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
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
        const profile = await authService.getUser();
        setUser(profile);
        return supabaseUser;
    }
  };

  const signOut = async () => {
     if (isDemoMode) {
        setUser(null);
    } else {
        await authService.signOut();
        setUser(null);
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
