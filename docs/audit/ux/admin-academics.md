# UX — /admin/academics

- **Source review:** Followed signed-off LMS UX playbook; original strings, route parameters, tenant scope checks and existing component-owned forms/states are unchanged.
- **Improvement:** Updated 5 short touch targets, 5 low-contrast link/label classes, and 0 nested main landmarks where present. Added phone-safe min-width containment without changing navigation or actions.
- **States:** Existing permission/scope denial, list/empty conditions and service error handling remain; shared workspace and dialogs still own their mutation feedback. No fabricated empty/result copy.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-academics-01`. Source assertion only; orchestrator device/keyboard/AT/browser run pending.
