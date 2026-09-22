#!/bin/bash
          PR_NUMBER="123"
          PR_TITLE="Test title"
          PR_URL="http://test.com"
          PR_BODY="- 🚨 Severity: MEDIUM
- 💡 Vulnerability: `console.error` was used to log backend internal errors, potentially leaking stack traces or un-redacted state into stdout.
- 🎯 Impact: Sensitive stack traces and potentially internal application structure or data could be exposed via raw output logs rather than being captured by the centralized, secure logger.
- 🔧 Fix: Swapped `console.error` for the centralized `logger.error` using the `@/lib/logger` structured logger that provides better formatting and controls. Associated tests have also been updated to spy on the mocked logger correctly.
- ✅ Verification: Run `npm test` and ensure all tests pass. Review `tests/lib/sync/engine.test.ts` to ensure it successfully captures the updated `logger.error` call."
          CHANGED_FILES="- file1.txt"
          EXISTING_ID=""
          ISSUE_COUNT="0"

          DISPLAY_TITLE="Audit: synthesis-by-mkg - PR #${PR_NUMBER} - ${PR_TITLE}"

          # Build a structured markdown description
          DESCRIPTION=$(cat <<- ENDDESC
          ## Pull Request #${PR_NUMBER}

          **URL:** ${PR_URL}

          **Title:** ${PR_TITLE}

          **Description:**
          ${PR_BODY:-_No description provided._}

          **Changed Files:**
          ${CHANGED_FILES:-_No files changed or unable to fetch._}
          ENDDESC
          )

          echo "$DESCRIPTION"
