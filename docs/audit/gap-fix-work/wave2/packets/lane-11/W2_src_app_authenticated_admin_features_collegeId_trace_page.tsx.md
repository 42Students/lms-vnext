# Work packet (wave 2): edit src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-10-019-022  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:840-935 — Trace output each level, status decided/ignored/overridden, lock icon, source name.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:90-98; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:160-170 — New drawer concise module explanation; detailed trace delegated route.
- Fix: Surface level-by-level trace in drawer or explicit equivalent.

## G2-10-019-027  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:785-788 — Overrides drawer table 15/page.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:150-157; src/components/admin/learner-module-access-drawer.tsx:65-75 — Learner search listing is not overrides-only paginated roster.
- Fix: Provide distinct 15-row override register.

## G2-10-019-055  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:314-324; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ModuleAccessController.java:203-221 — GET /api/v1/admin/module-access/explain?learnerId on select.
- vNext now: src/components/admin/learner-module-access-drawer.tsx:31-45; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:124-148 — New trace fetch depends membership UUID not numeric learner ID.
- Fix: Map identity and preserve exact chain/status semantics.

## G2-10-019-110  [P2] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:704-940 — In-page history/overrides/full trace.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx:18-36; src/components/admin/learner-module-access-drawer.tsx:74-113; src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx:160-170 — New separate history page, abbreviated drawer, trace page.
- Fix: Match in-place surface then link full route as optional.
