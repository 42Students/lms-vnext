# Work packet: edit src/components/admin/super-admin-hr-accounts.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-10-021-012  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:323-323 — Status ACTIVE green, SUSPENDED orange, DELETED red Tag.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:630-638; src/components/admin/super-admin-hr-types.ts:1-4 — ACTIVE, ARCHIVED shown Suspended, DISABLED shown Disabled.
- Fix: Map status lifecycle accurately, expose DELETED separately from disabled.

## G2-10-021-016  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:406-417 — Overview fourth metric 'Deleted on page'.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:682-684 — Fourth metric 'Disabled' global summary.
- Fix: Compute deleted-on-current-page separately, do not conflate disabled identity.

## G2-10-021-053  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:196-226; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:84-102 — POST/PUT create/update recruiter with split name and companyName.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:316-434; src/modules/placements/super-admin-hr-validation.ts:34-66 — POST/PATCH canonical displayName/relationship fields.
- Fix: Document field migration, existing identity reuse and contact updates.

## G2-10-021-065  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:335-351 — ACTIVE can suspend; SUSPENDED reactivate; DELETED displays Deleted.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:570-577; src/components/admin/super-admin-hr-types.ts:92-108 — ARCHIVED maps suspended; DISABLED separate canonical platform status.
- Fix: Define DELETED ↔ ARCHIVED/DISABLED mapping and resurrection.

## G2-3-031-041  [P1] MISSING  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-536`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:560-581`
- Fix: Legacy detail Drawer has explicit Delete recruiter action; vNext account actions offer Suspend/Reactivate, session termination, grant edits but not deletion. Record product decision.

## G2-3-031-072  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-536`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:560-581`
- Fix: Delete recruiter not represented in new visible actions; verify separate authorized deletion route before dropping.

## G2-10-021-038  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:75-95,432-433 — College options failure separately warns and Retry, disables create.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:187-230; src/components/admin/super-admin-hr-detail-drawer.tsx:312-327 — Relationship options failure inline, can render create dialog error after open.
- Fix: Show top-level missing-colleges banner and disable create when unverifiable.

## G2-3-031-029  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:209-221`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:328-445`
- Fix: Legacy recruiter duplicate mobile returns recruiterId to open existing account with warning; vNext create response reports Recruiter account found but UI branch/lookup differs.

## G2-3-031-030  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:286-291`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:459-495`
- Fix: Legacy Could not give access and College access given; vNext gives success but distinct relationship input errors.

## G2-3-031-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:182-182`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:500-558`
- Fix: Legacy invalid validUntil displays INVALID_VALID_UNTIL precise expected datetime; vNext validation error uses central service vocabulary.

## G2-10-021-037  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:430-433 — Recruiter list error has Alert 'Recruiter accounts could not be loaded' Retry.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:745-756 — ErrorState title 'Could not load recruiter accounts'.
- Fix: Use source heading and alert placement.

## G2-10-021-039  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:210-219 — Existing mobile conflict opens existing detail with warning.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:350-356 — Same behavior, toast is success 'Recruiter account found'.
- Fix: Use warning tone and exact copy.

## G2-10-021-044  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:390-391 — Revoke toast 'College access removed'.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:525-529 — 'College access revoked'.
- Fix: Use source success wording.

## G2-10-021-045  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:355-357 — Sign-out toast 'All sessions ended'.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:545-546 — 'All sessions terminated'.
- Fix: Use source success wording.

## G2-3-031-034  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:258-258`
- vNext now: `src/components/admin/super-admin-hr-accounts.tsx:512-545`
- Fix: Legacy Sign out success All sessions ended; vNext All sessions terminated and explanatory detail.
