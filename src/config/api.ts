/**
 * KutunzaCare API Configuration
 *
 * HOW TO SET YOUR API KEY (choose one):
 *
 * Option A — Expo Constants (recommended for dev/staging):
 *   1. Create .env file in project root:
 *      EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here
 *   2. Access via process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY
 *
 * Option B — Backend Proxy (required for production):
 *   1. Deploy a small server (Node/Express, Supabase Edge Function, etc.)
 *   2. Server holds the key, app calls your server instead of Anthropic directly
 *   3. Set USE_PROXY=true and PROXY_URL below
 *
 * NEVER commit your actual API key to source control.
 * The key below is a placeholder — the app will show a clear error if not set.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

// Set to true to route AI calls through your own backend (production-safe)
const USE_PROXY = false;
const PROXY_BASE_URL = 'https://your-backend.com/api';

// Direct Anthropic API (fine for dev / internal testing)
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com';

// Read key from Expo env variable (set in .env → EXPO_PUBLIC_ANTHROPIC_API_KEY)
// Falls back to placeholder so we can show a helpful error instead of crashing
const API_KEY = (globalThis as any).process?.env?.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export const API_CONFIG = {
  /** Full messages endpoint */
  messagesUrl: USE_PROXY
    ? `${PROXY_BASE_URL}/ai/messages`
    : `${ANTHROPIC_BASE_URL}/v1/messages`,

  /** Headers for direct Anthropic calls (omitted when using proxy) */
  headers: USE_PROXY
    ? { 'Content-Type': 'application/json' } as Record<string, string>
    : {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      } as Record<string, string>,

  /** Whether the key looks configured */
  isConfigured: USE_PROXY || (API_KEY.length > 10 && API_KEY.startsWith('sk-')),

  /** Model to use for all requests */
  model: 'claude-sonnet-4-20250514',

  /** Max tokens for chat responses */
  chatMaxTokens: 1200,

  /** Max tokens for photo analysis (needs more for structured JSON) */
  photoMaxTokens: 1400,
};

/**
 * Returns true if the API is configured and ready.
 * Call this before making any AI request and show the setup screen if false.
 */
export function isApiReady(): boolean {
  return API_CONFIG.isConfigured;
}

/**
 * Helpful error message shown when key is not configured.
 */
export const API_NOT_CONFIGURED_MSG =
  'Kutu AI is not yet configured.\n\n' +
  'To enable AI features, add your Anthropic API key:\n\n' +
  '1. Create a file named .env in the project root\n' +
  '2. Add: EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...\n' +
  '3. Restart the Expo dev server\n\n' +
  'Get a key at console.anthropic.com';
