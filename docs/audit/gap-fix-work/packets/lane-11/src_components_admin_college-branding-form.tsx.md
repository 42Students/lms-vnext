# Work packet: edit src/components/admin/college-branding-form.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-college-branding.md, docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-9-030-032  [P1] MISSING  facet F09  effort M
- Legacy: useUnsavedFormGuard blocks dirty navigation `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:30-36`
- vNext now: New form has values/version but no beforeunload guard `src/components/admin/college-branding-form.tsx:68-95`
- Fix: Implement dirty navigation confirmation

## G2-15-020-027  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:145-153 error Alert 'Branding could not be loaded' with Retry
- vNext now: src/components/admin/college-branding-form.tsx:115-121 field issue errors only
- Fix: Render page-level reload error distinct from field invalid.

## G2-15-020-030  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:76 unsaved branding discarded warning
- vNext now: src/components/admin/college-branding-form.tsx:85-88 updates values without scope-switch warning
- Fix: Warn and confirm before throwing away dirty values.

## G2-9-030-026  [P2] GAP  facet F07  effort M
- Legacy: Branding could not be loaded with Retry, Save disabled `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:145-154`
- vNext now: Server loader and editable form have no equivalent error banner `src/components/admin/college-branding-form.tsx:90-139`
- Fix: Restore loading/error/retry

## G2-9-030-027  [P2] GAP  facet F07  effort S
- Legacy: Couldn't save branding: reason toast `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:109-113`
- vNext now: Status-specific Check highlighted fields and connectivity error `src/components/admin/college-branding-form.tsx:123-136`
- Fix: Align failure title while preserving status-specific diagnosis

## G2-15-020-026  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:111-112 failure toast 'Couldn't save branding' prefix
- vNext now: src/components/admin/college-branding-form.tsx:123-135 tailored permission/conflict/network toasts
- Fix: Align visible error copy while protecting internal details.

## G2-15-020-029  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:91 warning 'Choose a college first'
- vNext now: src/components/admin/college-branding-form.tsx:148 read-only text instead
- Fix: Restore exact no-selection warning.

## G2-15-020-032  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:111-112 error toast includes failure reason
- vNext now: src/components/admin/college-branding-form.tsx:135 network-specific error
- Fix: Match toast placement and duration.

## G2-9-030-030  [P3] GAP  facet F08  effort S
- Legacy: Busy button loading with Save label `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeBranding.js:236-238`
- vNext now: Saving…/Save branding `src/components/admin/college-branding-form.tsx:217-220`
- Fix: Use exact Save/disabled display
