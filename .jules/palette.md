## 2024-05-22 - Context-Aware Filter Buttons
**Learning:** Filter buttons that depend on a parent selection (like Platform -> Filters) confuse users if they remain interactive when no filters are available.
**Action:** Always disable the filter toggle and provide a tooltip explaining why (e.g., "Select a platform to enable filters") when the current view has no filter options.
