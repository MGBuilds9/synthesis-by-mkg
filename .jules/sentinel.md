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

## 2024-05-24 - Insecure Logging
**Vulnerability:** The AI Chat API endpoint (`/api/ai/chat`) used `console.error` to log internal errors, potentially leaking sensitive stack traces or application state into standard output streams where they could be exposed to unauthorized parties or not centrally monitored.
**Learning:** Backend errors should never be logged using raw console outputs in production environments.
**Prevention:** Always use a centralized, structured logger (like Winston via `@/lib/logger`) that handles redaction, secure storage, and proper log levels, and ensure test suites mock the logger appropriately.

## 2024-05-25 - Credential Leakage in Frontend
**Vulnerability:** The Sign-In frontend component (`app/auth/signin/page.tsx`) logged the user's password in plaintext to the browser console.
**Learning:** Browser extensions and XSS attacks can read the console, and users can be shoulder-surfed or have their console dumped. Passwords should never be logged, even locally on the client.
**Prevention:** Never log sensitive credentials like passwords anywhere in the application. Remove all such debugging artifacts before pushing to production.
