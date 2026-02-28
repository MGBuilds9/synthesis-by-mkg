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

## 2026-02-28 - Missing Rate Limiting on Resource-Intensive Endpoint
**Vulnerability:** The `/api/messages/list` endpoint lacked rate limiting entirely, leaving it vulnerable to Denial of Service (DoS) via repeated requests, and potential brute-forcing/data scraping.
**Learning:** Inconsistent application of security controls across similar endpoints (e.g., `/api/files/list` had rate limiting, but `/api/messages/list` did not).
**Prevention:** Ensure shared utility functions (like `lib/ratelimit.ts`) are consistently applied to all API routes, particularly those that fetch lists, perform joins, or consume significant resources.
