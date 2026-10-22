# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-026-080 [P1] GAP facet F20
- Files: src/modules/placements/public-enquiry/recruit-service.ts
- Legacy: User inputs sanitised/truncated before persistence (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:188-193`)
- Expected fix: Sanitise HTML/control chars before activity/notification output.

## G2-4-010-068 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/assignments/page.tsx
- Legacy: List load error `Assignments could not be loaded` + Retry; stale fetch response guarded by token. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:421-425`)
- Expected fix: Add dedicated list fetch error boundary with retry and empty old rows instead of generic error.

## G2-4-022-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/students/page.tsx, src/modules/placements/tpo-students-service.ts
- Legacy: Legacy /table everyone=false lists only students participating in placements; everyone=true includes college students. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- Expected fix: Add/verify all-college roster selection for pickers and bulk enrollment.

## G2-4-022-065 [P1] GAP facet F22
- Files: src/modules/placements/tpo-students-service.ts, src/app/api/placements/tpo/students/academic-import/route.ts
- Legacy: Legacy API uses integer learner/drive/course references, Maps and separate POST endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-46`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:56-62`)
- Expected fix: Create per-action legacy/new input/output and data FK mapping.

## G2-4-028-048 [P1] GAP facet F18
- Files: src/app/(authenticated)/tpo/team/page.tsx
- Legacy: Explicit owner copy Messages > Team and Settings > People (`docs/legacy-source/frontend/src/pages/tpo/team.js:5-9`)
- Expected fix: Match owner navigation wording.

## G2-12-025-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/hr/drives/new/page.tsx, src/modules/placements/recruiter-drive-request-service.ts
- Legacy: Legacy GET `/drive-groups` and `/{groupId}` for recruiter own college copies. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:53-61`
- Expected fix: Expose historical group/linkage data or migrate to request list.

## G2-12-025-009 [P1] GAP facet F04
- Files: src/modules/placements/recruiter-drive-request-service.ts, src/db/schema/placement-drive-requests.ts
- Legacy: Legacy group response driveGroupId and colleges array: collegeId/jobId/status/skippedReason. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:41-45`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:83-95`
- Expected fix: Provide response compatibility fields for existing clients.

## G2-12-025-026 [P1] GAP facet F10
- Files: src/modules/placements/recruiter-drive-request-service.ts
- Legacy: Legacy planDrive transaction INSERT drive_group, createRequest one college, attach job.driveGroupId. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47-51`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterPlanDriveService.java:54-85`
- Expected fix: Preserve original job/group linkage or approved migration mapping.

## G2-13-031-079 [P1] GAP facet F04
- Files: src/modules/placements/report-service.ts
- Legacy: Legacy registered = latest season registration choice plus earlier-applicant fallback. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:79-81`
- Expected fix: Add season-consistent registration snapshot or scope note.

## G2-13-031-080 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: Legacy placedUnique counts DISTINCT learners with statuses from college rule. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:82-85`
- Expected fix: Reconcile employment-type exclusion under selected college rules.

## G2-13-031-081 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: Legacy acceptedUnique counts DISTINCT any accepted learner. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:86-89`
- Expected fix: Clarify population or return same all-accepted measure.

## G2-13-031-082 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: Legacy offers KPI counts RELEASED/ACCEPTED only. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:90-93`
- Expected fix: Split active released+accepted from all offers.

## G2-13-031-084 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: Legacy liveDrives counts only PUBLISHED nondeleted jobs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:94-95`
- Expected fix: Count published active drives separately.

## G2-13-031-086 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: Legacy CTC is best positive ctc_lpa per student across placed qualifying offers. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:118-125`
- Expected fix: Align offer status/cohort, currency and stipend exclusion.

## G2-13-031-099 [P1] GAP facet F12
- Files: src/modules/placements/report-service.ts
- Legacy: Unseasoned legacy drives count as current-season drives. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:21-22`
- Expected fix: Explicitly migrate/assign seasonless drives.

## G2-13-031-102 [P1] GAP facet F19
- Files: src/modules/placements/report-service.ts
- Legacy: Legacy branch stats aggregate in grouped SQL. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:383-393`
- Expected fix: Move high-volume aggregates and pagination to DB.

## G2-13-031-104 [P1] GAP facet F22
- Files: src/modules/placements/report-service.ts
- Legacy: Legacy CTC persisted as `ctc_lpa`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:118-125`
- Expected fix: Define LPA/INR mapping and historical precision.

## G2-5-002-060 [P1] GAP facet F19 Performance
- Files: (none, new feature)
- Legacy: Client-side full-list filter, 20/page display; fetch everything for org. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-181; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:232-312)
- Expected fix: Apply all filters in SQL prior to limit, count whole filtered result.

## G2-5-006-036 [P1] GAP facet F10 Actions/side effects
- Files: (none, new feature)
- Legacy: Save/reset app_setting college override through TenantAdminService (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:92-93; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:114-116)
- Expected fix: Restore global->org->college setting precedence and override reset.

## G2-5-008-045 [P1] GAP facet F10 Actions/side effects
- Files: (none, new feature)
- Legacy: PUT /api/v1/class/update/:id allows permitted Program/Batch reassignment (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-216)
- Expected fix: Support safe reassignment or written accepted gap.

## G2-5-010-017 [P1] GAP facet F04 Data formatting
- Files: (none, new feature)
- Legacy: Student counts from per-class learner read; failed displays Unavailable tag (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:399-402)
- Expected fix: Preserve Unknown state vs verified zero.

## G2-5-012-059 [P1] GAP facet F10
- Files: src/modules/placements/tpo-crm-service.ts
- Legacy: Legacy markDone repeat is idempotent; Move locks row FOR UPDATE and rejects done state (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-264`)
- Expected fix: Make repeated Done idempotent and distinguish already-done vs missing

## G2-5-012-096 [P1] GAP facet F20
- Files: src/modules/placements/tpo-crm-service.ts
- Legacy: Legacy Done repeats harmlessly without re-writing done_at; Move checks under row lock (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:239-264`)
- Expected fix: Return already-done success for duplicate POST; retain atomic move/final state

## G2-5-022-004 [P1] GAP facet F03
- Files: src/modules/placements/tpo-students-service.ts
- Legacy: Legacy summary id, first/last, uniqueId, rollNumber, department, class/program, mail/mobile,resume `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/StudentSummaryDTO.java:12-42`
- Expected fix: Map uniqueId, separate names, direct phone and resume access with policy.

## G2-5-022-006 [P1] GAP facet F04
- Files: src/modules/placements/tpo-students-service.ts
- Legacy: Legacy per learner academic GET/PUT entity decimals cgpa/percentage/gaps/year/entry/gender `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:15-75`
- Expected fix: Map unit conversion/rounding and all source fields (including lateral/gender).
