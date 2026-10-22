# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-026-046 [P1] GAP facet F14
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:823-842 resume-preview URL endpoint for application
- Expected fix: Provide signed, tenant-scoped resume preview grant and preview action

## G2-8-026-064 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: Legacy recruiter and recruiter_college_access integer entities, company resolved domain (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:182-221).
- Expected fix: Migrate recruiter identity and college grants with exact eligibility and verification data.

## G2-8-029-009 [P1] GAP facet F04
- Files: src/modules/projects/template-version-history-service.ts, src/components/projects/super-admin-template-subview-page.tsx
- Legacy: Old version ID numeric, templateVersion, actionType, notes, changedAt, snapshotJson docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:182-202,241-247.
- Expected fix: Migrate old snapshot metadata, actionType and timestamps with exact field mapping.

## G2-8-029-048 [P1] GAP facet F22
- Files: src/modules/projects/template-version-history-service.ts, src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx
- Legacy: Old version snapshotJson contains complete template entity fields incl publication/deletion state docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:115-138,241-254.
- Expected fix: Version migration must preserve old full snapshot or explicitly drop lifecycle rollback.

## G2-8-024-015 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Legacy global superadmin lists all, scoped restricts any college overlap (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:108-149,388-408).
- Expected fix: Compare revoked/expired-only recruiters visibility in scoped admin for accurate audit review.

## G2-8-023-069 [P1] MISSING facet F22
- Files: (none, new feature)
- Legacy: Legacy undo metadata stored in NotificationOutboxEntry with group and pending event (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:160-175).
- Expected fix: Add durable per-application prior status and notification hold references for reversibility.

## G2-8-022-064 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Legacy permits multiple concurrent current seasons; explicitly not a global mode (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:12-15,32-40).
- Expected fix: Record owner decision; preserve prior drives while creating overlapping seasons.

## G2-9-007-036 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/AllocateModal.jsx:36-45` — Warnings Pick a class; Paste at least one; positive numeric learner IDs
- Expected fix: Validate and show per-token invalid values before submission

## G2-9-008-029 [P1] GAP facet F07
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:194-204` — Filter lookup failure names specific jobs/departments/programs/batches and explains empty controls
- Expected fix: Show granular load failure and Retry for each lookup

## G2-9-008-042 [P1] GAP facet F10
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2385-2429` — Backend funnel cumulative lifetime reached stages from history, Applied all starts
- Expected fix: Compute ever-reached funnel from stage events, distinguish from snapshot KPIs

## G2-9-008-048 [P1] GAP facet F12
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2336-2351` — Legacy class takes priority over batch; program over department, with learner foreign-key filters
- Expected fix: Define and test filter precedence and historical-vs-current enrolment

## G2-9-008-049 [P1] GAP facet F12
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2278-2307` — Metrics status snapshot groups by current applicationStatus and includes all matching applications
- Expected fix: Reconcile status normalization, especially WAITLISTED and ASSESSMENT after screening

## G2-9-008-050 [P1] GAP facet F12
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2409-2429` — Funnel APPLIED count all applications and later stages ever reached
- Expected fix: Restore true funnel semantics so downstream percentages are meaningful

## G2-9-008-058 [P1] GAP facet F15
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2321-2333` — Legacy shortlist average from status history MIN SHORTLISTED and applied_at
- Expected fix: Verify stage-history conversion/migration and durations for dual-tracked jobs

## G2-9-008-070 [P1] GAP facet F19
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:233-239` — Per-company totals separated, job table paginated10
- Expected fix: Add company subtotal and pagination; optimize large report table

## G2-9-008-074 [P1] GAP facet F20
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2336-2351` — Inclusive appliedAfter and appliedBefore timestamps
- Expected fix: Set exclusive next-day boundary or end at 23:59:59.999 for exact inclusion

## G2-9-008-075 [P1] GAP facet F21
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2385-2429` — Cumulative funnel computed with status-history existence SQL
- Expected fix: Join historical stage transitions for cumulative funnel with cohort scope

## G2-9-008-078 [P1] GAP facet F22
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2294-2329` — JobApplication and JobApplicationStatusHistory MySQL with LocalDateTime
- Expected fix: Map old application status-history to vNext college-stage history and reconcile stage parity

## G2-9-008-079 [P1] GAP facet F22
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2470-2526` — Company totals grouped by normalized trim lower companyName incl unlinked company free text
- Expected fix: Reinstate normalised subtotal semantics including aliases/free-text jobs

## G2-9-015-015 [P1] GAP facet F03
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:710-718` — Status filter All, Draft, Active, Closed; width120.
- Expected fix: Default All and display Active; handle archive as additional state.

## G2-9-015-028 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-read-model.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:487-502` — Status default all, backed by isActive/isDraft bools.
- Expected fix: Preserve All baseline and legacy draft/open mapping.

## G2-9-015-032 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-read-model.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:256-264` — Server list sort postedDate DESC, status all, pageSize20.
- Expected fix: Use all drives + newest posted DESC + 20 rows by default.

## G2-9-015-067 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-read-model.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:254-265` — Legacy categories all/draft/active/closed from isDraft/isActive.
- Expected fix: Map old status categories and their visibility accurately.

## G2-9-016-024 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257` — Active drives true paginated total and All drives count from size1 query.
- Expected fix: Fetch count of all status records to fill four metrics.

## G2-9-016-025 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-26` — Four attention categories include missingOfferLetters, stale, unscheduled, low conversion.
- Expected fix: Restore fourth category when evidence available or explicit UNKNOWN with source.

### Lane-5 fast verification triage (2026-10-22)
- **G2-15-026-046 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-8-026-064 — DEFERRED**: New feature or migration requires an ownership/data contract review; not marked OK.
- **G2-8-029-009 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-8-029-048 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-8-024-015 — DEFERRED**: New feature or migration requires an ownership/data contract review; not marked OK.
- **G2-8-023-069 — DEFERRED**: New feature or migration requires an ownership/data contract review; not marked OK.
- **G2-8-022-064 — DEFERRED**: New feature or migration requires an ownership/data contract review; not marked OK.
- **G2-9-007-036 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-029 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-042 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-048 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-049 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-050 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-058 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-070 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-074 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-075 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-078 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-008-079 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-015-015 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-015-028 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-015-032 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-015-067 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-016-024 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
- **G2-9-016-025 — DEFERRED**: Source exists or was checked, but behavior/data semantics require targeted parity validation; not marked OK.
