const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * In-memory fixed-window limiter for the public write routes. It is per
 * instance, so it blunts scripts and accidental double submits rather than a
 * determined distributed attacker — a real limit belongs in the reverse proxy
 * once the platform runs on the VPS.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > 5000) {
    buckets.forEach((entry, key) => {
      if (entry.resetAt <= now) buckets.delete(key);
    });
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count += 1;
  return entry.count <= limit;
}

export function clientIpOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
