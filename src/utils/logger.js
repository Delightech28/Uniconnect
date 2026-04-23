/**
 * logger.js — Sanitized, dev-only logger for UniConnect
 *
 * Rules enforced:
 *  - All output is silenced in production (import.meta.env.DEV must be true)
 *  - Sensitive keys are automatically redacted before anything is printed
 *  - Never pass raw auth objects, tokens, or full user payloads to this logger
 */

const IS_DEV = import.meta.env.DEV;

/** Keys whose values will be replaced with "[REDACTED]" */
const SENSITIVE_KEYS = new Set([
  'token',
  'idToken',
  'accessToken',
  'refreshToken',
  'password',
  'secret',
  'apiKey',
  'api_key',
  'publicKey',
  'public_key',
  'privateKey',
  'private_key',
  'serviceId',
  'service_id',
  'templateId',
  'template_id',
  'authorization',
  'Authorization',
  'x-api-key',
  'approve_link',   // contains token in query string
  'reject_link',    // contains token in query string
]);

/**
 * Recursively strip sensitive fields from an object so it is safe to log.
 * @param {unknown} value
 * @returns {unknown}
 */
const sanitize = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitize);

  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      if (SENSITIVE_KEYS.has(k)) return [k, '[REDACTED]'];
      return [k, sanitize(v)];
    })
  );
};

/**
 * Internal print helper — only prints in DEV.
 * @param {'log'|'warn'|'error'|'info'} level
 * @param {string} prefix   e.g. '[verificationService]'
 * @param {string} message  Status-only string, no raw objects
 * @param {unknown} [data]  Optional safe/sanitized extra context
 */
const print = (level, prefix, message, data) => {
  if (!IS_DEV) return;
  const tag = `${prefix} ${message}`;
  if (data !== undefined) {
    // eslint-disable-next-line no-console
    console[level](tag, sanitize(data));
  } else {
    // eslint-disable-next-line no-console
    console[level](tag);
  }
};

/**
 * Create a scoped logger for a given module.
 *
 * @example
 * import { createLogger } from '../utils/logger';
 * const log = createLogger('verificationService');
 *
 * log.info('Verification request saved');           // ✅ status only
 * log.info('User data', { role: user.role });       // ✅ safe field only
 * log.warn('Email send failed', { code: err.code }); // ✅
 * // log.info('token', token);                      // ❌ NEVER do this
 *
 * @param {string} module
 */
export const createLogger = (module) => {
  const prefix = `[${module}]`;
  return {
    info:  (msg, data) => print('log',   prefix, msg, data),
    warn:  (msg, data) => print('warn',  prefix, msg, data),
    error: (msg, data) => print('error', prefix, msg, data),
    debug: (msg, data) => print('log',   prefix, `[debug] ${msg}`, data),
  };
};

/** Drop-in global logger (use createLogger for modules instead) */
export const logger = createLogger('app');
