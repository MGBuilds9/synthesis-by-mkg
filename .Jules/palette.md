## 2024-05-23 - Accessibility Patterns
**Learning:** Multiple icon-only buttons (Settings, Filter) and inputs across the dashboard lack `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Systematically check and add `aria-label` to all icon-only interactive elements in future updates.

## 2024-05-23 - Interaction Feedback
**Learning:** Primary action buttons (like "Send") often lack visual feedback during async operations, leading to user uncertainty.
**Action:** Standardize a "Loading" state pattern for all async action buttons using the `Loader2` icon and disabled state.

## 2024-05-24 - Screen Reader Feedback
**Learning:** Visual-only loading indicators (bouncing dots) leave screen reader users in the dark about async processes.
**Action:** Always pair visual loading animations with `role="status"` and `sr-only` text description.

## 2026-02-10 - Filter Group Accessibility
**Learning:** Filter controls often use multiple buttons that act as a single choice group (like radio buttons) but lack `role="group"` and `aria-pressed` states, making the selection semantics unclear to screen readers.
**Action:** Always wrap related filter buttons in a container with `role="group"` and an accessible label, and use `aria-pressed` to indicate the active state.

## 2026-02-11 - Conversational Onboarding
**Learning:** Empty chat states often leave users with "blank page syndrome". Suggestion chips (actionable prompts) significantly improve feature discoverability and reduce cognitive load.
**Action:** Implement clickable suggestion chips in all conversational empty states to guide initial user interaction.

## 2026-02-12 - External Link Clarity
**Learning:** Links that open in a new tab without visual indicators or accessible descriptions ("Open, link") create confusion and anxiety for users, especially those using screen readers who lose context.
**Action:** Always pair external links with an `ExternalLink` icon and an `aria-label` that describes the destination and the behavior (e.g., "Open [filename] in new tab").

## 2026-02-13 - Search Interaction
**Learning:** Search inputs without a quick way to clear the query force users to manually delete text, creating friction in exploratory tasks.
**Action:** Implement a clear button (X icon) inside search inputs that appears when text is present, allowing one-click reset of the query and results.

## 2026-02-14 - Keyboard Shortcut Pattern
**Learning:** Platform-specific keyboard shortcuts (Cmd vs Ctrl) require client-side detection via `navigator.platform` which triggers a re-render. This is a known trade-off for accurate UX.
**Action:** Standardize the `shortcutSymbol` state pattern with `useEffect` across all search inputs to ensure correct keyboard hints.
## 2026-04-13 - Search Keyboard Hints
**Learning:** Hardcoded keyboard hints like "Search files... (⌘+K)" violate accessibility rules when the literal symbol is used, and dynamic resolution of the key binding can trigger react state errors if not handled correctly. Additionally, duplicate aria-labels are a common anti-pattern that fails build steps.
**Action:** Always ensure that search inputs use a single semantic aria-label, properly clean up any duplicated aria-label properties in JSX elements.
## 2024-05-23 - Conditionally rendered elements and aria-controls
**Learning:** When using aria-controls to link a toggle button to a collapsible panel, the attribute must point to a valid ID. If the target panel is conditionally rendered, the aria-controls attribute should also be conditionally applied to prevent referencing an element that doesn't exist in the DOM.
**Action:** Always conditionally apply aria-controls using logic that strictly matches the target element's exact rendering condition.

## 2026-06-09 - External Link Interaction
**Learning:** Referenced sources returned by the AI assistant often have valid URLs but were only displaying a visual icon without an actual anchor tag, breaking the expected interaction pattern for users trying to access original source material.
**Action:** Always verify that elements visually representing external links (like the `ExternalLink` icon) are wrapped in functional `<a>` tags with proper `target="_blank"` and `rel="noopener noreferrer"` attributes when destination URLs are present.
## 2026-07-16 - Focus Visible Styles for Dashboard Cards
**Learning:** Card-based navigation links often lack explicit keyboard focus states, making them difficult to navigate for keyboard-only users because the browser's default outline might be suppressed or hard to see against the UI.
**Action:** Always add explicit `focus-visible` utility classes (e.g., `focus-visible:ring-2`) to interactive card elements to ensure clear keyboard accessibility.
