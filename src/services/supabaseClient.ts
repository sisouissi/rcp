import { createClient } from '@supabase/supabase-js';

// --- IMPORTANT ---
// You must provide your Supabase project credentials for the application to work.
// 1. Create a project at https://supabase.com/
// 2. Find your Project URL and anon public key in Project Settings > API.
// 3. Set them as environment variables: SUPABASE_URL and SUPABASE_ANON_KEY.
// For local development, you can replace the placeholder values below.

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-anon-key") {
  // We don't throw an error here, as it would crash the entire application.
  // Instead, the application will load in a 'demo mode' using mock data.
  // The user will see a login screen with demo credentials and this warning in the console.
  console.warn(`
    *****************************************************************
    * WARNING: Supabase credentials are not configured.             *
    * The application will run in DEMO MODE.                        *
    * Please configure SUPABASE_URL and SUPABASE_ANON_KEY env vars. *
    *****************************************************************
  `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);