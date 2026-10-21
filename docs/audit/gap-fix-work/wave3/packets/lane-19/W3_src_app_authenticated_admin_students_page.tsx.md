# Work packet (wave 3): edit src/app/(authenticated)/admin/students/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-14-002-013  [P1] MISSING  facet F03  effort L
- Legacy: Legacy non-suspended superadmin can Impersonate; vNext row lacks it — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1008-1027`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Route security-approved audited support impersonation or explicitly retire

## G2-14-002-057  [P1] MISSING  facet F10  effort L
- Legacy: Legacy impersonate fetches tokens and replaces active session; vNext no student row entry — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:668-683`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`
- Fix: Add audited support mode with explicit exit, or document deprecation

## G2-19-001-049  [P1] MISSING  facet F10  effort L
- Legacy: Legacy hard delete via `/api/v1/learner/delete/{id}` then refresh `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:581-590`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:1116-1136`
- vNext now: vNext roster supplies no Delete action `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Agree on safe deletion policy, then expose permitted delete or explicit retention-oriented replacement.

## G2-19-001-050  [P1] MISSING  facet F10  effort L
- Legacy: Legacy impersonation writes access/refresh tokens and full navigates `/learn/courses` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:668-683`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminUserAdminController.java:309-347`
- vNext now: vNext no roster impersonation action `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Restore auditable support impersonation plus exact exit/restore semantics.

## G2-19-001-086  [P1] MISSING  facet F21  effort L
- Legacy: Legacy account impersonation from user-admin controller creates tokens and auditable start event `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminUserAdminController.java:309-347`
- vNext now: vNext student roster has no integration trigger for impersonation `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Add scoped impersonation integration plus exit flow with audit and session restoration.
