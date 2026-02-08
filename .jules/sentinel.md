## 2025-02-18 - IDOR in AI Chat Session
**Vulnerability:** A Critical IDOR vulnerability was found in `POST /api/ai/chat` where any user could access another user's chat session (and thus context) by guessing the `sessionId`. The API retrieved the session by ID without checking if it belonged to the authenticated user.
**Learning:** `findUnique` in Prisma (and most ORMs) does not implicitly filter by ownership even if relations exist. Authentication checks at the beginning of the route are insufficient for object-level authorization.
**Prevention:** Always verify `resource.userId === session.user.id` immediately after retrieving any resource by ID, or use `findFirst` with `{ where: { id: ..., userId: ... } }`.
