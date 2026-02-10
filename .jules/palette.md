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
