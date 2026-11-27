import { getSupabaseServiceClient, hasServiceCredentials } from '@/lib/supabase/service';
import { createHmac } from 'crypto';
import { isIP } from 'net';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS: RateLimitConfig[] = [
  { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  { windowMs: 24 * 60 * 60 * 1000, maxRequests: 20 },
];

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitRpcResponse {
  data: unknown;
  error: { message?: string } | null;
}

export interface RateLimitDatabase {
  rpc: (functionName: string, args: Record<string, unknown>) => Promise<RateLimitRpcResponse>;
}

export function getReviewRateLimitSecret(): string {
  const secret = process.env.REVIEW_RATE_LIMIT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('SERVICE_UNAVAILABLE: REVIEW_RATE_LIMIT_SECRET is not configured.');
  }
  return secret;
}

export function hashReviewIdentifier(identifier: string): string {
  const secret = getReviewRateLimitSecret();
  return createHmac('sha256', secret).update(identifier).digest('hex');
}

export function getClientIdentifier(request: Request): string {
  const netlifyIp = request.headers.get('x-nf-client-connection-ip');
  if (!netlifyIp || netlifyIp.trim().length === 0) {
    throw new Error('UNABLE_TO_IDENTIFY_CLIENT: No trusted client IP is available.');
  }

  const clientIp = netlifyIp.trim();
  if (isIP(clientIp) === 0) {
    throw new Error('UNABLE_TO_IDENTIFY_CLIENT: Invalid trusted client IP.');
  }

  return clientIp;
}

export async function checkRateLimit(
  request: Request,
  database: RateLimitDatabase = getSupabaseServiceClient() as unknown as RateLimitDatabase
): Promise<RateLimitResult> {
  getReviewRateLimitSecret();

  if (!hasServiceCredentials()) {
    throw new Error('SERVICE_UNAVAILABLE: Review service credentials not configured.');
  }

  const shortWindow = RATE_LIMITS[0];
  const longWindow = RATE_LIMITS[1];
  if (!shortWindow || !longWindow) {
    throw new Error('RATE_LIMIT_DB_ERROR: Rate limit configuration is invalid.');
  }

  const clientIp = getClientIdentifier(request);
  const hashedIp = hashReviewIdentifier(clientIp);

  const { data, error } = await database.rpc('check_review_rate_limits', {
    p_client_ip_hash: hashedIp,
    p_short_window_ms: shortWindow.windowMs,
    p_short_window_max: shortWindow.maxRequests,
    p_long_window_ms: longWindow.windowMs,
    p_long_window_max: longWindow.maxRequests,
  });

  if (error) {
    throw new Error('RATE_LIMIT_DB_ERROR: Rate limit service failed.');
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result !== 'object') {
    throw new Error('RATE_LIMIT_DB_ERROR: Rate limit response is invalid.');
  }

  const row = result as {
    allowed?: unknown;
    remaining?: unknown;
    reset_time?: unknown;
    retry_after_seconds?: unknown;
  };

  if (typeof row.allowed !== 'boolean') {
    throw new Error('RATE_LIMIT_DB_ERROR: Rate limit response is invalid.');
  }

  const resetTime = typeof row.reset_time === 'string' ? Date.parse(row.reset_time) : Number.NaN;
  if (!Number.isFinite(resetTime)) {
    throw new Error('RATE_LIMIT_DB_ERROR: Rate limit response is invalid.');
  }

  const remaining = typeof row.remaining === 'number' && Number.isFinite(row.remaining)
    ? Math.max(0, Math.trunc(row.remaining))
    : 0;

  const derivedRetryAfter = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  const retryAfter = typeof row.retry_after_seconds === 'number' && Number.isFinite(row.retry_after_seconds)
    ? Math.max(0, Math.ceil(row.retry_after_seconds))
    : derivedRetryAfter;

  return {
    allowed: row.allowed,
    remaining: row.allowed ? remaining : 0,
    resetTime,
    retryAfter: row.allowed ? undefined : retryAfter,
  };
}

export async function cleanupOldRateLimits(): Promise<void> {
  if (!hasServiceCredentials()) return;

  const supabase = getSupabaseServiceClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('review_rate_limits')
    .delete()
    .lt('updated_at', cutoff);

  if (error) {
    throw new Error('Failed to clean up old review rate limits.');
  }
}

export async function cleanupOldSubmissionKeys(maxAgeDays = 30): Promise<void> {
  if (!hasServiceCredentials()) return;

  const supabase = getSupabaseServiceClient();
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('review_submission_keys')
    .delete()
    .lt('created_at', cutoff);

  if (error) {
    throw new Error('Failed to clean up old review submission keys.');
  }
}
