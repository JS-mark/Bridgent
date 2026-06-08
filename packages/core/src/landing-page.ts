/**
 * A browser-friendly landing page for the MCP HTTP endpoint.
 *
 * MCP Streamable HTTP servers reject naive browser visits with
 * `406 Not Acceptable` (the spec requires `Accept: text/event-stream`),
 * which makes for a confusing first-time experience. When we detect a
 * plain browser GET on the endpoint URL (Accept lists text/html but
 * not application/json), we serve this page instead — it explains the
 * URL is meant for MCP clients and offers copy-paste config snippets.
 *
 * Real MCP clients (Inspector, Claude Code, Cursor, …) advertise
 * `Accept: application/json, text/event-stream` and so always fall
 * through to the underlying transport. Spec compliance is preserved.
 */

export interface LandingPageOptions {
  name: string
  version: string
  url: string
}

/** True when the request *looks* like a plain browser visit. */
export function wantsLandingPage(method: string, acceptHeader: string | null | undefined): boolean {
  if (method !== 'GET')
    return false
  const accept = (acceptHeader ?? '').toLowerCase()
  if (!accept.includes('text/html'))
    return false
  // Real MCP clients advertise application/json + text/event-stream.
  // If either is present, fall through to the MCP transport.
  if (accept.includes('application/json'))
    return false
  if (accept.includes('text/event-stream'))
    return false
  return true
}

export function renderLandingPage(opts: LandingPageOptions): string {
  const { name, version, url } = opts
  const escapedName = escapeHtml(name)
  const escapedVersion = escapeHtml(version)
  const escapedUrl = escapeHtml(url)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapedName} — Bridgent AI MCP endpoint</title>
  <style>
    :root { color-scheme: light dark; }
    body { font: 15px/1.55 -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif; max-width: 720px; margin: 4rem auto; padding: 0 1.25rem; color: #111; }
    @media (prefers-color-scheme: dark) { body { color: #e6e6e6; background: #0b0b0c; } a { color: #76b9ff; } pre, code { background: #16181c; } }
    h1 { font-size: 1.4rem; margin-bottom: 0.25rem; letter-spacing: -0.01em; }
    .meta { color: #888; font-size: 0.9rem; margin-bottom: 1.75rem; }
    h2 { font-size: 1rem; margin-top: 2rem; letter-spacing: -0.005em; }
    p { margin: 0.5rem 0 1rem; }
    pre { background: #f4f4f5; border-radius: 6px; padding: 0.75rem 1rem; overflow-x: auto; font-size: 0.875rem; line-height: 1.5; }
    code { font: 0.9em SF Mono, Menlo, monospace; background: #f4f4f5; padding: 0.05em 0.35em; border-radius: 3px; }
    pre code { background: transparent; padding: 0; }
    .pill { display: inline-block; font-size: 0.78rem; padding: 0.15em 0.55em; border-radius: 999px; background: #1f6feb; color: #fff; margin-left: 0.4em; vertical-align: middle; }
    .footer { margin-top: 3rem; font-size: 0.85rem; color: #888; }
    a { color: #1f6feb; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${escapedName}<span class="pill">v${escapedVersion}</span></h1>
  <p class="meta">This is an <strong>MCP Streamable HTTP endpoint</strong>, meant to be consumed by an MCP client — not browsed directly.</p>

  <h2>Inspect interactively</h2>
  <p>Open the official <a href="https://github.com/modelcontextprotocol/inspector" target="_blank" rel="noopener">MCP Inspector</a> and connect to <code>${escapedUrl}</code>:</p>
  <pre><code>pnpm dlx @modelcontextprotocol/inspector
# In the UI: Transport = "Streamable HTTP", URL = ${escapedUrl}</code></pre>

  <h2>Wire into Claude Code / Cursor / Codex / Gemini CLI</h2>
  <pre><code>{
  "mcpServers": {
    "${escapedName}": {
      "transport": "streamable-http",
      "url": "${escapedUrl}"
    }
  }
}</code></pre>

  <h2>Why a 406 from <code>curl ${escapedUrl}</code>?</h2>
  <p>The MCP Streamable HTTP spec requires clients to advertise <code>Accept: application/json, text/event-stream</code>. Your browser (or a bare <code>curl</code>) doesn't, so the server politely declines — that's expected behaviour, not a bug.</p>

  <p class="footer">Powered by <a href="https://js-mark.com/Bridgent/" target="_blank" rel="noopener">Bridgent AI</a> — expose any API, database, or function as a production-ready MCP server.</p>
</body>
</html>
`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
