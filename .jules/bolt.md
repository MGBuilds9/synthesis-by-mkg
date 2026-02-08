## 2026-01-28 - Broken Build Due to Unused File
**Learning:** The `server/db.ts` file contained imports for missing dependencies (`drizzle-orm`, `@neondatabase/serverless`) which broke the build. This file appeared unused in the `prisma`-based project.
**Action:** When encountering build failures in apparently unused files, verify usage with `grep` and disable/remove the file to unblock verification.

## 2026-01-29 - Optimizing Prisma Selections
**Learning:** Fetching full Prisma models with `include` retrieves all scalar fields, including large `Text` or `Json` columns (e.g., `htmlContent`), even if unused.
**Action:** Use `select` to explicitly fetch only required fields when querying models with potentially large columns, especially in high-traffic or list views.

## 2026-01-30 - Optimizing Relation Loading in Prisma
**Learning:** When using `include` to load relations, Prisma fetches all fields of the related model by default. For models with large columns (like `sources` JSON), this causes unnecessary data transfer.
**Action:** Nest `select` inside `include` to fetch only the fields required for the operation. Ensure fallback queries (like `create`) use the same selection shape to maintain type compatibility.

## 2026-02-18 - Avoid Unnecessary Relation Joins for FK Access
**Learning:** Fetching a relation (e.g., `include: { connectedAccount: true }`) just to access its ID is wasteful if the foreign key (e.g., `connectedAccountId`) is already present on the source model.
**Action:** Check if the required fields (like IDs) are available on the current model before joining a relation. Use `select` to fetch only specific fields if a relation must be accessed.

## 2026-02-18 - Optimized AI Chat Context Loading
**Learning:** Fetching the entire message history for an AI chat session causes performance degradation and token limit issues as the conversation grows.
**Action:** Limit message retrieval to a fixed window (e.g., last 50 messages) using `take` and `orderBy: desc`, then reverse the array in code to restore chronological order for the LLM.

## 2026-05-21 - Dynamic Prisma Includes and Type Safety
**Learning:** Constructing Prisma `include` objects dynamically (e.g., using `any`) breaks type inference for the result. TypeScript may infer incorrect types or default to `any`, requiring explicit type casting or handling.
**Action:** When using dynamic `include`, explicitly type the result variable (e.g., `as any` or a specific payload type) and cast related properties to avoid implicit 'any' errors.

## 2026-05-22 - Memoization for High-Frequency State Updates
**Learning:** In interactive components like chat interfaces, typing into an input field updates state on every keystroke, causing the entire component tree to re-render. If the component includes a long list (like chat history), this causes significant performance degradation.
**Action:** Extract static or append-only lists (like message history) into separate components and wrap them in `React.memo` to prevent re-renders when only unrelated parent state (like input value) changes.

## 2026-05-23 - Avoiding Implicit Joins on Large Tables
**Learning:** Filtering a large table (e.g., `MessageThread`) by a relation's field (e.g., `connectedAccount.userId`) forces a database join or subquery, which can be slow.
**Action:** Fetch the related IDs first (e.g., `connectedAccountIds`) and use `IN` clause (e.g., `connectedAccountId: { in: ids }`) to leverage indexes on foreign keys directly and avoid the join.
