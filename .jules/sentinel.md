## 2026-02-06 - IDOR in AI Chat Session

**Vulnerability:** The `app/api/ai/chat/route.ts` endpoint retrieved chat sessions using only `sessionId` via `findUnique`, allowing any user to access and manipulate another user's chat session if they guessed the ID.
**Learning:** Never assume a resource ID provided by the client belongs to the authenticated user. Unique IDs (CUID/UUID) are not a security control against IDOR.
**Prevention:** Always scope database queries to the current `userId` when retrieving user-owned resources, using `findFirst` with `{ id, userId }` instead of `findUnique`.
