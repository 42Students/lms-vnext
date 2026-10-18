# /tpo/settings/rules — UX rollout

- **Change:** Replaced an h2-only page heading with shared PageHeader h1 (Placement rules) while retaining existing helper text and headings below.
- **Preserved:** All existing legacy copy, filtering and server permission checks, conditional storage states, existing form values and actions.
- **Source states reviewed:** Navigation, settings ready/unavailable states and authorized control presentation. UX device/browser coverage remains to be captured.
- **Test:** `tests/unit/chat2-ux-tpo-settings-b.test.ts` — `UX-tpo-tpo-settings-rules-01`.
- **Evidence status:** Source review only, TypeScript/CI and physical keyboard/mobile/AT evidence not executed. Checklist stays unchecked until verified.
