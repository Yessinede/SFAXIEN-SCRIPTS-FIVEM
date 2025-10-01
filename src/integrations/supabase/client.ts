import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bqawmmungxkrfpjdinog.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxYXdtbXVuZ3hrcmZwamRpbm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzY1NzQsImV4cCI6MjA2NjQ1MjU3NH0.B2RC3TpKGCH1l7GIGnOQkfzOz7s_lfix7oyHNeIqV6c";


export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);