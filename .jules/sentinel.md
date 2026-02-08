# Sentinel's Journal

## 2025-02-18 - IDOR in AI Chat Session Retrieval

**Vulnerability:** A High-severity Insecure Direct Object Reference (IDOR) vulnerability was found in the `POST /api/ai/chat` endpoint. The endpoint retrieved `AiChatSession` objects by `sessionId` (provided in the request body) without verifying that the authenticated user owned the session. This would allow an attacker to read chat history and inject messages into another user's session if they knew the `sessionId`.

**Learning:** The vulnerability existed because the code relied on `prisma.aiChatSession.findUnique({ where: { id: sessionId } })` which returns the record regardless of ownership. While `getServerSession` was used to authenticate the user, the authorization check linking the resource to the user was missing.

**Prevention:** Always scope database queries to the current user (e.g., `where: { userId: session.user.id }`) or explicitly verify ownership immediately after retrieval (e.g., `if (resource.userId !== session.user.id) throw new Error('Unauthorized')`). Security tests should specifically target cross-user access scenarios.
