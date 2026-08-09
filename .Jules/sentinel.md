## 2026-08-09 - Remove plaintext password logging
**Vulnerability:** Plaintext password logging in frontend application
**Learning:** Development console logs for sensitive data (like passwords) can easily leak into production if not carefully managed or removed before commit.
**Prevention:** Never log sensitive user credentials (passwords, tokens, API keys) under any circumstances, even during development. Use mocked secure credentials or omit them from logging entirely.
