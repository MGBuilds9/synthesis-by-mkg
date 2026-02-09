## 2025-02-18 - IDOR in AI Chat Session
**Vulnerability:** A Critical IDOR vulnerability was found in `POST /api/ai/chat` where any user could access another user's chat session (and thus context) by guessing the `sessionId`. The API retrieved the session by ID without checking if it belonged to the authenticated user.
**Learning:** `findUnique` in Prisma (and most ORMs) does not implicitly filter by ownership even if relations exist. Authentication checks at the beginning of the route are insufficient for object-level authorization.
**Prevention:** Always verify `resource.userId === session.user.id` immediately after retrieving any resource by ID, or use `findFirst` with `{ where: { id: ..., userId: ... } }`.

## 2025-02-18 - Missing Rate Limiting on LLM Endpoint
**Vulnerability:** The `POST /api/ai/chat` endpoint lacked rate limiting and input validation, allowing users to abuse expensive LLM resources and potentially cause Denial of Service via large payloads.
**Learning:** High-cost operations (like LLM calls) must be protected by strict rate limits and input size constraints to prevent resource exhaustion. Database-backed rate limiting is a viable initial strategy for low-volume apps but may need scaling (e.g., Redis) later.
**Prevention:** Implemented per-user rate limiting (10 req/min) and strict input validation (max 5000 chars) using Zod.
