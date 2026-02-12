## 2024-05-22 - Fail Open Rate Limiting
**Vulnerability:** The AI Chat endpoint (`/api/ai/chat`) had a rate limiting mechanism that "failed open" - if the database check for message count failed (e.g. timeout), the error was logged but the request was allowed to proceed.
**Learning:** Security controls that depend on external services (like DB) must handle failures explicitly. "Failing open" (allowing access on error) defeats the purpose of the control during high-stress scenarios (DoS) or outages.
**Prevention:** Always use `try...catch` blocks around security checks to catch errors and return a secure error response (Fail Closed), unless availability is strictly prioritized over security (rare for rate limits).

## 2024-05-23 - LLM Model Validation
**Vulnerability:** The AI Chat endpoint allowed arbitrary model strings, potentially enabling access to expensive or restricted models (Resource Exhaustion/Unauthorized Access).
**Learning:** LLM providers often accept any model string. Application layer must enforce an allowlist of supported models to control costs and capabilities.
**Prevention:** Maintain a strict allowlist of models per provider and validate all requests against it.
