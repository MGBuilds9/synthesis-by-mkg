## 2024-05-22 - Fail Open Rate Limiting
**Vulnerability:** The AI Chat endpoint (`/api/ai/chat`) had a rate limiting mechanism that "failed open" - if the database check for message count failed (e.g. timeout), the error was logged but the request was allowed to proceed.
**Learning:** Security controls that depend on external services (like DB) must handle failures explicitly. "Failing open" (allowing access on error) defeats the purpose of the control during high-stress scenarios (DoS) or outages.
**Prevention:** Always use `try...catch` blocks around security checks to catch errors and return a secure error response (Fail Closed), unless availability is strictly prioritized over security (rare for rate limits).

## 2024-05-23 - LLM Model Validation
**Vulnerability:** The AI Chat endpoint allowed arbitrary model strings, potentially enabling access to expensive or restricted models (Resource Exhaustion/Unauthorized Access).
**Learning:** LLM providers often accept any model string. Application layer must enforce an allowlist of supported models to control costs and capabilities.
**Prevention:** Maintain a strict allowlist of models per provider and validate all requests against it.

## 2026-02-13 - Username Enumeration via Timing Attacks
**Vulnerability:** The `verifyUserCredentials` function returned immediately if a user was not found, while performing a slow `bcrypt.compare` operation if the user existed.
**Learning:** Authentication flows must have consistent response times regardless of the outcome (success, failure, user not found).
**Prevention:** Always perform a computationally equivalent operation (e.g., comparing against a pre-calculated dummy hash) even when the user is not found to normalize response times.

## 2026-02-13 - Privacy Bypass in AI Context
**Vulnerability:** The AI Chat endpoint ignored user-provided `contextDomains` preferences, retrieving and sending data from all connected accounts (including emails) to the LLM even when explicitly disabled by the user.
**Learning:** Frontend privacy toggles are cosmetic if the backend does not enforce them. API endpoints must validate and apply all user-provided constraints for data access.
**Prevention:** Explicitly filter data retrieval scopes on the backend based on request parameters, ensuring strict adherence to user consent before accessing sensitive data.

## 2026-02-13 - Missing Rate Limiting on Authenticated Endpoints
**Vulnerability:** The `GET /api/messages/list` endpoint lacked rate limiting, making it susceptible to DoS attacks from authenticated users despite having authentication checks.
**Learning:** Authenticated endpoints are still vulnerable to resource exhaustion (DoS) attacks, especially when they execute complex database queries or aggregations.
**Prevention:** Implement rate limiting using `lib/ratelimit.ts` on all sensitive or resource-intensive API endpoints (like list operations with counts), ensuring robust protection by returning `429 Too Many Requests` status codes and including standard `X-RateLimit-*` headers for transparency.
