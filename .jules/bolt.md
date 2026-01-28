## 2026-01-28 - Broken Build Due to Unused File
**Learning:** The `server/db.ts` file contained imports for missing dependencies (`drizzle-orm`, `@neondatabase/serverless`) which broke the build. This file appeared unused in the `prisma`-based project.
**Action:** When encountering build failures in apparently unused files, verify usage with `grep` and disable/remove the file to unblock verification.
