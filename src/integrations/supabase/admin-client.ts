import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jczawpxfipfceactrwry.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjemF3cHhmaXBmY2VhY3Ryd3J5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTcyMjc3MywiZXhwIjoyMDY1Mjk4NzczfQ.LWVY3WiiuiTYPAMNMgSF1Zb1duESidsYzOhYgl_sB8A";

// IMPORTANT: This client has admin privileges and should only be used in
// secure server environments or trusted admin-only functions.
// Never expose this client to the browser.

export const adminSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
); 