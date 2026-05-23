// lib/supabase.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Missing Supabase environment variables:\n' +
        `  - VITE_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}\n` +
        `  - VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '✗'}\n` +
        'Check your .env file');
}
export const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client initialized');
