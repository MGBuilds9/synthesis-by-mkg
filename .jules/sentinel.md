## 2026-02-06 - IDOR in AI Chat Session
**Vulnerability:** IDOR (Insecure Direct Object Reference) in `app/api/ai/chat/route.ts`. The endpoint retrieved a chat session by ID without verifying if it belonged to the authenticated user.
**Learning:** Even with CUIDs, explicit ownership checks are mandatory. Retrieving an object by ID must always be followed by an ownership verification or be scoped by the user ID in the query.
**Prevention:** Always use `findFirst({ where: { id: ..., userId: ... } })` or explicitly check `item.userId === session.user.id` after retrieval.
