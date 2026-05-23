// server/.env.check.ts
// Simple startup check to ensure the Supabase Service Role key is present
// on the server and not accidentally exposed via VITE_ environment variables.

const { env } = process;

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;

if (!serviceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set. This key is required for server-side operations that must bypass RLS (audit logs, admin writes).');
  console.error('Set SUPABASE_SERVICE_ROLE_KEY in the server environment and do NOT expose it to the client.');
  process.exit(1);
}

const exposedVars = Object.keys(env).filter(k => k.startsWith('VITE_') && env[k]);
const badExposed = exposedVars.filter(k => {
  if (!env[k]) return false;
  // If any VITE_ var equals the service key, or looks like a service key name, it's dangerous
  return env[k] === serviceKey || /SERVICE_ROLE|SUPABASE_SERVICE|SUPABASE_SECRET/i.test(k);
});

if (badExposed.length > 0) {
  console.error('ERROR: Found environment variables that expose sensitive Supabase keys to the client:');
  badExposed.forEach(k => console.error(` - ${k}`));
  console.error('Remove these VITE_* variables and ensure the service role key is only available server-side.');
  process.exit(1);
}

console.log('Environment check passed: SUPABASE_SERVICE_ROLE_KEY present and not exposed to client.');

// Exit 0 so this script can be used in CI or as part of server startup.
process.exit(0);
