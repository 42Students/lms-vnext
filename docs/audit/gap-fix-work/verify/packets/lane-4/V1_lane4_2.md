# Verification packet (P1 sample): 13 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-012-003 [P1] GAP facet F01
- Files: src/components/placements/placement-calendar-workspace.tsx
- Legacy: Open Round/Talk navigates /tpo/drives/{jobId}?tab=rounds (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:146-149`)
- Expected fix: Ensure deep link opens rounds tab and focuses exact round; preserve legacy URL redirect

## G2-13-023-013 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LBE/controller/tpo/LearnerScheduleController.java:40-43 map body accepts `reason` and free-form `preferredTimes` strings, no explicit validation annotation.
- Expected fix: Retain free-form preferredTimes or document stricter proposal shape and migrate existing requests.

## G2-7-011-073 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/ProjectWorkspace.java:103-105; db/migration/V74__project_workspaces.sql:1-30: MySQL workspace.overview JSON, global unique slug and version field.
- Expected fix: Create explicit legacy overview->authored_brief mapping, key rename and default/unknown-key policy.

## G2-8-021-043 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy admin bypasses end-time correction window, but future-time validation still executes in attend() (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:533-556).
- Expected fix: Prevent pre-start correction until session starts unless an owner-approved new rule.

## G2-12-012-013 [P1] GAP facet F10
- Files: src/modules/placements/tpo-company-domain-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:99-106 checks local deny lists, academia then optional DNS
- Expected fix: Call shared company-domain validation including deny lists/academic/IP/DNS before mutating primaryDomain

## G2-8-030-033 [P1] GAP facet F10
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx, src/modules/placements/admin-drive-directory-model.ts
- Legacy: Old searchAdminJobs (page0,size20,status,search,postedDate desc), result content/totalElements docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-267.
- Expected fix: Implement DB paging and count at query layer before loading entire history.

## G2-9-006-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/departments/page.tsx
- Legacy: Missing college warning displayed in route (`docs/legacy-source/frontend/src/pages/college-admin/departments.js:19-33`)
- Expected fix: Preserve warning, not silent redirect.

## G2-9-008-043 [P1] GAP facet F10
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2443-2526` — Company report per-job and normalized company-level subtotal rows
- Expected fix: Add normalized company-name or companyId group rollups

## G2-9-008-073 [P1] GAP facet F20
- Files: src/modules/placements/college-hiring-funnel-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:174-209` — Lookups guarded by cancelled effect and filtersError state
- Expected fix: Implement per-lookup error boundaries and fallback choices

## G2-9-016-103 [P1] GAP facet F23
- Files: src/modules/placements/college-drive-attention-service.ts
- Legacy: `src/modules/placements/college-drive-attention-service.ts:61-64` — Old default low conversion threshold .15; candidate count categories independent.
- Expected fix: Honor settings threshold and same denominator/interval.

## G2-9-012-023 [P1] GAP facet F06
- Files: src/components/placements/college-interview-appointments.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/interviewService.js:17-23` — Legacy POST schedule requires job/jobApplication/learner IDs on InterviewForm
- Expected fix: Ensure ability to schedule legacy qualified applicants independent of round creation

## G2-9-013-033 [P1] MISSING facet F06
- Files: src/components/placements/placement-draft-edit-form.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:754-783` — Assessment deadline optional DatePicker with time, after application deadline or today.
- Expected fix: Add assessment datetime, original-unchanged exception and cross-deadline validation.

## G2-9-027-023 [P1] GAP facet F05
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: Initial raw audit filters blank, all available history when searched `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:32-35`
- Expected fix: Distinguish raw forensic all-time default vs feed 30d.
