// lib/supabase.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// This module is intended for server-side usage only (project/lib).
// It prefers server env var names (no VITE_ prefix). If you need a
// client-side supabase instance, use `project/src/lib/supabase.ts` which
// intentionally reads from `import.meta.env` (Vite) and uses the ANON key.

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

// Prefer the SERVICE ROLE KEY for server-side admin operations if present.
// WARNING: the SERVICE ROLE KEY bypasses RLS and MUST NEVER be used in the browser.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Missing Supabase environment variables:\n' +
    `  - SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓' : '✗'}\n` +
    `  - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '✗'}\n` +
    'Check your server environment variables or .env file'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('✅ Server Supabase client initialized (lib/supabase)')

