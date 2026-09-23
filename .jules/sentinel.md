## 2026-09-23 - Next.js Development vs Production CSP Requirements

**Vulnerability:** The Content-Security-Policy `script-src` directive in `middleware.ts` unconditionally allowed `'unsafe-eval'`, which is a significant XSS risk in production environments.
**Learning:** Next.js Fast Refresh requires `'unsafe-eval'` in development mode, leading developers to often mistakenly leave it enabled globally in the CSP header.
**Prevention:** Always conditionally append development-only CSP directives like `'unsafe-eval'` based on `process.env.NODE_ENV !== 'production'` rather than hardcoding them into the static policy string.
