## 2026-09-21 - Loader Animation for Async Operations

**Learning:** Replacing text inside a button during async operations (e.g. from "Search" to "Searching...") causes a frustrating layout shift because the button expands to fit the wider text.
**Action:** When adding visual loading indicators (like `Loader2` from `lucide-react`) to action buttons, combine it with a `min-w-[size]` utility class and standard flex centering to prevent the button size from rapidly changing during state updates, ensuring a stable layout structure for users. Also, always add `aria-hidden="true"` to the decorative spinner to avoid screen reader clutter if the text implies a loading action.
