# UX — /admin/announcements

- **Source review:** Followed signed-off LMS UX playbook; original strings, route parameters, tenant scope checks and existing component-owned forms/states are unchanged.
- **Improvement:** Updated 2 short touch targets, 2 low-contrast link/label classes, and 0 nested main landmarks where present. Added phone-safe min-width containment without changing navigation or actions.
- **States:** Existing permission/scope denial, list/empty conditions and service error handling remain; shared workspace and dialogs still own their mutation feedback. No fabricated empty/result copy.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-announcements-01`. Source assertion only; orchestrator device/keyboard/AT/browser run pending.

## Cross-audit chat-12 — A12-136 (MAJOR)

The previous rollout retained native page-local text/search/date/number/select or submit controls. At 320/360/390px these lack a consistently guaranteed 16px input font, accessible 44px focus target and audited shared focus styling. Reused the existing shared `Input` (1), `Select` (4), `Button` (1). Kept every original label, filter key/default, GET request, hidden scope control and business action. Announcement primary action no longer requests `text-primary-foreground` against the bright brand fill. Targeted source contract: `tests/unit/UX-admin-announcements-12-01.test.ts`. Real viewport, TypeScript, Vitest and native WebView checks remain orchestrator work; no runtime pass is claimed.
