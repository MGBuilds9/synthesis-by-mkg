## 2026-03-03 - Skipping Expensive Count Queries in Prisma
**Learning:** Prisma's `count()` function can be very slow on large tables, performing O(N) scans. Always executing it on endpoints that support infinite scrolling (where total count is unused) is a major performance bottleneck.
**Action:** Make `count()` queries optional on list endpoints by accepting an `includeCount` query parameter. Default it to true (e.g. `includeCount !== 'false'`) for backward compatibility, and return `-1` when skipped.
