## 2026-01-28 - Broken Build Due to Unused File
**Learning:** The `server/db.ts` file contained imports for missing dependencies (`drizzle-orm`, `@neondatabase/serverless`) which broke the build. This file appeared unused in the `prisma`-based project.
**Action:** When encountering build failures in apparently unused files, verify usage with `grep` and disable/remove the file to unblock verification.

## 2026-01-29 - Optimizing Prisma Selections
**Learning:** Fetching full Prisma models with `include` retrieves all scalar fields, including large `Text` or `Json` columns (e.g., `htmlContent`), even if unused.
**Action:** Use `select` to explicitly fetch only required fields when querying models with potentially large columns, especially in high-traffic or list views.

## 2026-01-30 - Optimizing Relation Loading in Prisma
**Learning:** When using `include` to load relations, Prisma fetches all fields of the related model by default. For models with large columns (like `sources` JSON), this causes unnecessary data transfer.
**Action:** Nest `select` inside `include` to fetch only the fields required for the operation. Ensure fallback queries (like `create`) use the same selection shape to maintain type compatibility.
