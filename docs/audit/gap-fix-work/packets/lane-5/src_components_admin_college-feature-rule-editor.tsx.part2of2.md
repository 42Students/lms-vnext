# Work packet: edit src/components/admin/college-feature-rule-editor.tsx (part 2 of 2)

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/cross-settings-feature-flags.md, docs/audit/gap2/lane-1/l14-u024-superadmin-feature-controller.md, docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-9-036-041  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:180-187` exact Turn off Projects? / Turn off Projects danger copy
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:96-100` generic Confirm college feature policy / Apply change
- Fix: Match Projects disable title and destructive CTA

## G2-9-036-042  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:235-244` exact Turn off Placements for [college]? / Turn off Placements
- vNext now: `src/components/admin/college-feature-rule-editor.tsx:96-100` generic title and CTA
- Fix: Match college-specific Placements warning copy

## G2-9-036-115  [P2] GAP  facet F08  effort S
- Legacy: Legacy toggled success toast '<module> updated for <college>' only after refetch `docs/legacy-source/frontend/src/pages/superadmin/sections/FeatureControlsHub.js:126-135`
- vNext now: New editor success inline Saved. Effective policy is refreshed `src/components/admin/college-feature-rule-editor.tsx:59-69`
- Fix: Restore exact toast timing and message.

## G2-14-024-018  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminFeatureController.java:222-223 — 200 OK empty data on success
- vNext now: src/components/admin/college-feature-rule-editor.tsx:65-69 — Saved. Effective policy is refreshing. feedback banner
- Fix: Align success confirmation wording and explicit persisted status.

## G2-10-019-044  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:448-452 — Lock changes toast 'Locked'/'Unlocked'.
- vNext now: src/components/admin/college-feature-rule-editor.tsx:61-69 — Generic 'Saved. Effective policy is refreshing.'
- Fix: Use lock-specific message and explicit scope.
