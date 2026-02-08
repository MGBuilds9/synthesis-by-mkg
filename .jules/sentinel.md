## 2026-02-07 - [CRITICAL] IDOR in AI Chat Session
**Vulnerability:** The `POST /api/ai/chat` endpoint retrieved `AiChatSession` by `sessionId` without verifying that the session belonged to the authenticated user. This allowed any authenticated user to access and append messages to any other user's chat session if they knew the ID.
**Learning:** `findUnique` makes it easy to forget ownership checks. API endpoints handling user-specific resources must explicitly verify `resource.userId === session.user.id`.
**Prevention:** Always verify ownership immediately after retrieval or use `findFirst` with `userId` in the `where` clause.
