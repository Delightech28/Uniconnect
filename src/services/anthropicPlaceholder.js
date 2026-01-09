// Placeholder Anthropic/Claude service.
// This intentionally throws a clear error until a real implementation and API key are provided.
// To fully enable Claude Haiku 4.5 for clients:
// 1. Set VITE_AI_PROVIDER=claude-haiku-4.5 in your .env (or override at runtime).
// 2. Add VITE_CLAUDE_API_KEY to your .env (do NOT commit the real key).
// 3. Implement network calls to the Anthropic/Claude API or install an official SDK.
// 4. Replace this placeholder with the real implementation.

export async function generateWithClaude(prompt, opts = {}) {
  throw new Error(
    'Claude integration not implemented. To enable: set VITE_AI_PROVIDER=claude-haiku-4.5 and provide VITE_CLAUDE_API_KEY in your environment, then replace this placeholder with the Anthropic API implementation.'
  );
}

export default {
  generateWithClaude,
};
