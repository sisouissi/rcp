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
  // Instead, the application will load, and any Supabase operations (like login) will fail.
  // This provides a better user experience, as the user will see a "Login Failed" message
  // and can check the console for this more detailed warning.
  console.warn(`
    *****************************************************************
    * WARNING: Supabase credentials are not configured.             *
    * The application will not connect to the backend.              *
    * Please configure SUPABASE_URL and SUPABASE_ANON_KEY env vars. *
    *****************************************************************
  `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);