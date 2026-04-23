const actionTimestamps = new Map();

/**
 * Lightweight client-side throttle to reduce accidental request spam.
 * This is UX protection only; backend rate limiting remains the security control.
 */
export const enforceClientRateLimit = (actionKey, minIntervalMs = 1500) => {
  const now = Date.now();
  const lastRun = actionTimestamps.get(actionKey) || 0;
  const elapsed = now - lastRun;

  if (elapsed < minIntervalMs) {
    const retryAfterMs = minIntervalMs - elapsed;
    const err = new Error(`Please wait ${Math.ceil(retryAfterMs / 1000)}s before trying again.`);
    err.code = 'CLIENT_RATE_LIMIT';
    err.retryAfterMs = retryAfterMs;
    throw err;
  }

  actionTimestamps.set(actionKey, now);
};
