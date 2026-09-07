/* =============================================================================
   SUPABASE CLIENT INITIALIZATION (JS/SUPABASE-CLIENT.JS)
   ============================================================================= */

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

// Helper for direct REST API calls using fetch
export async function supabaseFetch(endpoint, options = {}) {
    const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Supabase API Error [${endpoint}]:`, errorText);
        throw new Error(`Supabase API Error (${response.status}): ${errorText}`);
    }

    if (response.status === 204) return null; // No Content
    return await response.json();
}
