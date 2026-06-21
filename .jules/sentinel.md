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

## 2024-05-25 - Shell Injection in GitHub Actions
**Vulnerability:** A GitHub Action workflow (`github-to-linear-sync.yml`) passed user-controlled input (`${{ github.event.pull_request.body }}`) directly into a bash script using inline string interpolation, causing backticks in the PR body to be executed as subcommands.
**Learning:** Inline string interpolation of GitHub context variables (`${{ ... }}`) into bash scripts creates critical shell injection vulnerabilities. If the variable contains backticks (`\``), quotes, or `$()`, the shell will attempt to evaluate them as commands.
**Prevention:** Always pass user-controlled input to bash scripts via the `env` context block in GitHub Actions (e.g., `PR_BODY: ${{ github.event.pull_request.body }}`) and reference them as environment variables (e.g., `$PR_BODY`), rather than interpolating them directly into the script content.

## 2026-06-21 - Unhandled NaN in Prisma Queries
**Vulnerability:** The `offset` parameter from URL query strings was parsed using `parseInt` without validating against `NaN`. When passed to Prisma's `skip` method, it would cause an unhandled query exception, potentially leading to a Denial of Service (500 errors).
**Learning:** Parsing numeric inputs from user queries can yield `NaN`, which ORMs like Prisma may not gracefully handle in pagination fields like `skip` or `take`.
**Prevention:** Always explicitly validate parsed numeric inputs using `isNaN()` and provide a safe fallback (e.g., 0) before passing them to ORM methods.
