// EduManager V2 - Supabase Client Initialization
const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

// Create Client and assign to global dbClient to avoid variable name collision with window.supabase
const dbClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
window.dbClient = dbClient;
