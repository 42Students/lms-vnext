/**
 * Fixed-window limiter used only for the write budget on shim routes. It has its own bounded map so request-volume
 * attacks cannot fill the login/OTP limiter in src/auth/ip-rate-limit.ts, and it fails OPEN when full: the write
 * budget is abuse control, not authentication, so availability wins (the per-address bucket still bounds each host).
 */
export function createMemoryLimiter(options: { maxKeys: number; onSaturated?: () => void }) {
  const windows = new Map<string, { start: number; count: number }>();
  let nextSweepAt = 0;
  return function allow(key: string, limit: number, windowMs = 60_000, now = Date.now()): boolean {
    if (windows.size >= options.maxKeys && !windows.has(key)) {
      if (now >= nextSweepAt) {
        for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
        nextSweepAt = now + Math.max(1_000, Math.trunc(windowMs / 4));
      }
      if (windows.size >= options.maxKeys) {
        options.onSaturated?.();
        return true;
      }
    }
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    current.count += 1;
    return current.count <= limit;
  };
}
