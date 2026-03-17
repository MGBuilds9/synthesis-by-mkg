1. Use `replace_with_git_merge_diff` to update `app/api/messages/list/route.ts` to make the `prisma.messageThread.count()` query optional via an `includeCount` query parameter.
   - Extract `includeCount` with `const includeCount = searchParams.get('includeCount') !== 'false'` to default to true for backward compatibility.
   - Update `Promise.all` count call to `includeCount ? prisma.messageThread.count({ where: whereClause }) : Promise.resolve(-1)`.
   - Also update `const [threads, total]` to use `total` correctly in the response.

2. Use `replace_with_git_merge_diff` to add a new test case to `tests/api/messages-list.test.ts` to verify the `includeCount=false` behavior.
   - The test will verify `prisma.messageThread.count` is not called when `includeCount` is `'false'`.

3. Use `run_in_bash_session` to append a new entry to `.jules/bolt.md` using `cat << 'EOF' >>`. The entry will state:
   `## 2026-06-03 - Optional Prisma Count Queries
   **Learning:** Executing `prisma.count()` queries on every list request can be an expensive bottleneck. When adding optional boolean query parameters (like `includeCount`), parsing with `=== 'true'` introduces a bug by defaulting to `false` when omitted.
   **Action:** Always make expensive count operations optional and check `!== 'false'` to default to `true` and preserve backward compatibility with existing clients.`

4. Run the linter and test suite using `run_in_bash_session` to execute `npm run lint && npm run test`.

5. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

6. Submit the change using the `submit` tool.
   - branch_name: `bolt-optional-message-count`
   - title: `⚡ Bolt: Make expensive count query optional in message list`
   - description: `💡 What: Make the prisma.messageThread.count() query optional via an includeCount parameter in /api/messages/list.
   🎯 Why: Executing a count query on every list request is an expensive database operation. Allowing clients to opt-out improves response latency.
   📊 Impact: Reduces database load and API response time for clients that do not need total counts (e.g. infinite scrolling).
   🔬 Measurement: Check the API response and verify the total is -1 when includeCount=false is provided.`
