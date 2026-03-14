import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client using the service_role key.
 * Bypasses RLS — use only in server-side API routes.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
