## 2024-04-14 - Empty States to Actions
**Learning:** Found an opportunity where "Empty States" across multiple pages (Inbox, Notion) contained static text advising users to "Connect your account". Users must navigate to settings independently to resolve this state.
**Action:** Transformed static advisory text into direct inline `<Link>` components routing users directly to `/dashboard/settings`. Next time, look for unhelpful static text in empty states and evaluate if it can be turned into a direct call-to-action to reduce user friction.
