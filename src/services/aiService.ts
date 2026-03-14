/**
 * KutunzaCare AI Service
 * Central wrapper for all Anthropic API calls with:
 * - Auth headers injected automatically
 * - Rate limiting (max 1 request per 2s per call site)
 * - Automatic retry on 429/5xx
 * - Response validation
 * - Offline detection
 */

import { API_CONFIG } from '../config/api';

// ─── RATE LIMITER ─────────────────────────────────────────────────────────────

const lastCallTime: Record<string, number> = {};
const MIN_INTERVAL_MS = 2000; // 2 seconds between calls per callSite

function checkRateLimit(callSite: string): void {
  const now = Date.now();
  const last = lastCallTime[callSite] ?? 0;
  if (now - last < MIN_INTERVAL_MS) {
    throw new AIError('Please wait a moment before sending another message.', 'RATE_LIMITED');
  }
  lastCallTime[callSite] = now;
}

// ─── ERROR CLASS ──────────────────────────────────────────────────────────────

export class AIError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'AIError';
  }
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AIError) return err.message;
  if (err instanceof Error) {
    if (err.message.includes('Network request failed') || err.message.includes('fetch')) {
      return 'No internet connection. Please check your network and try again.';
    }
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  /** Used for rate limiting — use a unique string per screen */
  callSite?: string;
}

export interface ImageAnalysisOptions {
  imageBase64: string;
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp';
  prompt: string;
  maxTokens?: number;
}

// ─── CORE FETCH WITH RETRY ────────────────────────────────────────────────────

async function fetchWithRetry(
  body: object,
  maxRetries = 2,
): Promise<string> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(API_CONFIG.messagesUrl, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        // Rate limited by Anthropic — wait and retry
        const retryAfter = parseInt(res.headers.get('retry-after') ?? '5') * 1000;
        if (attempt < maxRetries) {
          await sleep(retryAfter || 5000);
          continue;
        }
        throw new AIError('Too many requests. Please wait a moment.', 'RATE_LIMITED');
      }

      if (res.status === 401) {
        throw new AIError(
          'API key is invalid or missing. Please check your configuration.',
          'UNAUTHORIZED',
        );
      }

      if (res.status === 400) {
        const body = await res.json().catch(() => ({}));
        throw new AIError(
          body?.error?.message ?? 'Invalid request to AI service.',
          'BAD_REQUEST',
        );
      }

      if (res.status >= 500) {
        if (attempt < maxRetries) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        throw new AIError('AI service is temporarily unavailable. Please try again.', 'SERVER_ERROR');
      }

      if (!res.ok) {
        throw new AIError(`Unexpected error (${res.status}). Please try again.`, 'UNKNOWN');
      }

      const data = await res.json();
      const text = data?.content?.[0]?.text;
      if (typeof text !== 'string') {
        throw new AIError('AI returned an unexpected response format.', 'PARSE_ERROR');
      }
      return text;

    } catch (err) {
      if (err instanceof AIError) throw err;
      lastError = err as Error;
      if (attempt < maxRetries) {
        await sleep(500 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Send a chat message to Kutu AI.
 */
export async function sendChatMessage(options: ChatOptions): Promise<string> {
  const site = options.callSite ?? 'chat';
  checkRateLimit(site);

  return fetchWithRetry({
    model: API_CONFIG.model,
    max_tokens: options.maxTokens ?? API_CONFIG.chatMaxTokens,
    system: options.system,
    messages: options.messages,
  });
}

/**
 * Analyse a food photo. Returns the raw text (JSON string) from Claude.
 */
export async function analyseImage(options: ImageAnalysisOptions): Promise<string> {
  checkRateLimit('photo');

  return fetchWithRetry({
    model: API_CONFIG.model,
    max_tokens: options.maxTokens ?? API_CONFIG.photoMaxTokens,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: options.mediaType ?? 'image/jpeg',
            data: options.imageBase64,
          },
        },
        { type: 'text', text: options.prompt },
      ],
    }],
  });
}

/**
 * Parse JSON from AI response — strips markdown fences and validates shape.
 * Returns null if parsing fails.
 */
export function parseAIJson<T>(raw: string, validator: (obj: unknown) => obj is T): T | null {
  try {
    const clean = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(clean);
    if (validator(parsed)) return parsed;
    console.warn('[AI] Response failed validation:', parsed);
    return null;
  } catch (e) {
    console.warn('[AI] JSON parse error:', e, '\nRaw:', raw.slice(0, 200));
    return null;
  }
}
