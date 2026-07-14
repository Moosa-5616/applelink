import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ AppleLink: Missing Supabase environment variables.\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.\n' +
    'See .env.example for reference.'
  )
}

// Validate the URL format to prevent crashing if the user left the default placeholder in .env
const isValidUrl = (url) => {
  try {
    return Boolean(new URL(url));
  } catch (e) {
    return false;
  }
};

const finalUrl = supabaseUrl && isValidUrl(supabaseUrl) 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';

export const supabase = createClient(
  finalUrl,
  supabaseAnonKey || 'placeholder-key'
)
