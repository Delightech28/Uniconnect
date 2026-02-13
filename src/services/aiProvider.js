// Small helper to surface the default AI provider for the app.
// Defaults to `claude-haiku-4.5` unless overridden in env.
export function getAIProvider() {
  // Vite exposes env vars on import.meta.env. Support both Vite and CRA-style envs.
  try {
    const vite = import.meta && import.meta.env && import.meta.env.VITE_AI_PROVIDER;
    return vite || process?.env?.REACT_APP_AI_PROVIDER || 'claude-haiku-4.5';
  } catch (e) {
    return process?.env?.REACT_APP_AI_PROVIDER || 'claude-haiku-4.5';
  }
}

export const DEFAULT_AI_PROVIDER = getAIProvider();

export function isClaudeProvider() {
  const p = getAIProvider();
  return String(p).toLowerCase().startsWith('claude');
}
