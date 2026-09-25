// A small "not too many requests" guard for the price lookups and the problem reports, kept in the server's memory. It is best effort
// (each server instance counts on its own); the shared answer cache is what really protects the search quota.
const hits = new Map<string, number[]>();

export function tooManyRequests(request: { headers: { get(name: string): string | null } }, bucket: string, limit: number, windowMs = 60_000): boolean {
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const key = `${bucket}|${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value as string);
  return recent.length > limit;
}
