# Work packet: edit src/components/admin/super-admin-hr-detail-drawer.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-031  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:556-567 — Grant picker directly shows scoped college options, optional DatePicker end-of-day.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:253-357 — Details disclosure, relationship selector and HTML date input; blank defaults three months.
- Fix: Expose picker/expiry/grant inline and map expiry semantics.

## G2-10-021-054  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-298; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-149 — POST grant and DELETE revoke by college numeric ID.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:253-357; src/modules/placements/super-admin-hr-validation.ts:68-74 — New grant by companyRelationshipId and ISO offset validUntil.
- Fix: Resolve selected company relationship to college and expiry precisely.

## G2-10-021-063  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:269-279 — Expiry blank passes null (unbounded), selected day end-of-day timestamp.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:296-302 — Blank explicitly expires in three months.
- Fix: Decide default expiry and notify operator before grant.

## G2-10-021-107  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:523-572 — Direct in-drawer grant editor with optional unlimited grant expiry.
- vNext now: src/components/admin/super-admin-hr-detail-drawer.tsx:253-357 — Collapsed grant editor, default 3-month access.
- Fix: Resolve expiry product decision and expose date affordance.

## G2-10-021-038  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:75-95,432-433 — College options failure separately warns and Retry, disables create.
- vNext now: src/components/admin/super-admin-hr-accounts.tsx:187-230; src/components/admin/super-admin-hr-detail-drawer.tsx:312-327 — Relationship options failure inline, can render create dialog error after open.
- Fix: Show top-level missing-colleges banner and disable create when unverifiable.
