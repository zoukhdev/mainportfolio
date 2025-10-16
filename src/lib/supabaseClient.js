import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cwbekupebkpiadygfykx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YmVrdXBlYmtwaWFkeWdmeWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjY0MTYsImV4cCI6MjA3NjIwMjQxNn0.Q2CQKzQeEdu8zCwGFpAwMcO3r07lvxzMkk5fVG0-j2o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
