# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-023-018 [P1] GAP facet F05
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy company resolution performs duplicate confirmation based on identity (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:104-109`)
- Expected fix: Offer explicit same-company choice rather than generic identity-conflict failure.

## G2-4-023-025 [P1] MISSING facet F06
- Files: src/modules/placements/company-service.ts, src/modules/placements/tpo-company-create-model.ts
- Legacy: Legacy duplicate name can explicitly be `notTheSame=true` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,56-58`)
- Expected fix: Provide conflict-safe distinct-company flow with explicit reason and canonical alias policy.

## G2-4-023-037 [P1] GAP facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: GET /search calls global CompanyDirectoryService.search with college context (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:47-50`)
- Expected fix: Map search to new read service returning global curated results without leaking other college data.

## G2-4-023-047 [P1] GAP facet F12
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy company identity matches website or recruiter-email domain, not name alone (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:52-58`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:43-57`)
- Expected fix: Implement domain-first lookup and controlled company alias handling.

## G2-13-031-076 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/reports/page.tsx
- Legacy: Old canonical report routes `recruiter-leads` and `outcomes` are stable bookmarks. `docs/legacy-source/frontend/src/components/tpo/reportsMeta.js:9-13`
- Expected fix: Redirect old report paths and preserve filters.

## G2-5-003-010 [P1] GAP facet F03 Visible elements
- Files: src/app/(authenticated)/college/classes/page.tsx
- Legacy: Warning 'Some setup options failed to load' with Retry options button. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- Expected fix: Surface partial lookup failures without treating them as no options.

## G2-5-007-002 [P1] GAP facet F01 Purpose/entry/navigation
- Files: (none, new feature)
- Legacy: Job row opens /superadmin/jobs/:jobId/applications?collegeId=selected (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:12-18)
- Expected fix: Deep link to exact legacy job application list with selected college parameter.

## G2-5-007-019 [P1] GAP facet F05 Tables/lists
- Files: src/modules/admin-ui/super-admin-placement-interviews-service.ts
- Legacy: 8 table columns Job,Candidate,Type,Status,Date & Time,Interviewer,Mode,Actions (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649)
- Expected fix: Implement required 8 column interview table with row actions.

## G2-5-007-044 [P1] GAP facet F12 Business rules
- Files: src/modules/admin-ui/super-admin-placement-interviews-service.ts
- Legacy: ACTIVE includes SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:254-272)
- Expected fix: Restore full appointment lifecycle.

## G2-5-007-069 [P1] GAP facet F22 Data/migrations
- Files: src/modules/admin-ui/super-admin-placement-interviews-service.ts
- Legacy: Supports CONFIRMED/RESCHEDULE_REQUESTED/NO_SHOW (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-54)
- Expected fix: Persist and show old status transitions.

## G2-5-009-009 [P1] GAP facet F03 Visible elements
- Files: (none, new feature)
- Legacy: Course placeholder reflects loading/unavailable/not linked and disabled appropriately (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:501-513)
- Expected fix: Implement all course verification states and safe disabled condition.

## G2-5-010-046 [P1] GAP facet F10 Actions/side effects
- Files: (none, new feature)
- Legacy: PUT class/update allows valid Program/Batch reassignment (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-216)
- Expected fix: Add sanctioned identity reassignment workflow.

## G2-5-013-002 [P1] GAP facet F01
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy getJobBySlug resolves public/external short job link (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:73-77`)
- Expected fix: Add old short-link redirect/resolver or record deliberate drop

## G2-5-013-011 [P1] GAP facet F05
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy getAllJobsPaginated returns content,totalElements,totalPages,number,size (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:18-29`)
- Expected fix: Add server pagination API shape and UI controls for All Drives

## G2-5-013-014 [P1] GAP facet F05
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy application paging supports status/minScore/maxScore/appliedAfter/appliedBefore/source/department/program/batch/search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:68-71`)
- Expected fix: Expose all 10 filters and server page size/sort with data-safe search

## G2-5-013-028 [P1] GAP facet F09
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy getJobDeletionImpact exists for UI confirmation preview (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:52-55`)
- Expected fix: Build safe deletion preview including affected learner/interview/offer counts

## G2-5-013-037 [P1] GAP facet F10
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy deleteJob soft-deletes and computes preview impact (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:52-55`)
- Expected fix: Match soft-delete semantics and separate archive from user delete

## G2-5-013-041 [P1] GAP facet F10
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy getJobApplicationsPaginated accepts rich filters and Pageable (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:68-71`)
- Expected fix: Create filtered/paged backed query and list metadata

## G2-5-013-075 [P1] GAP facet F19
- Files: src/modules/placements/job-service.ts
- Legacy: Legacy paginated jobs uses count + bounded data query, safePage and safeSize (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:214-237`)
- Expected fix: Add server pagination before scaling to multi-year histories

## G2-5-013-076 [P1] GAP facet F19
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy application export applies same visible filters and cap (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1933-1945`)
- Expected fix: Bound queries and export to displayed filter state

## G2-5-015-021 [P1] GAP facet F08
- Files: src/modules/placements/application-service.ts
- Legacy: Legacy recorder catches persistence errors and leaves parent transition intact `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-52`
- Expected fix: Decide/document fail-open vs audited atomicity and user recovery.

## G2-5-023-011 [P1] GAP facet F04
- Files: src/modules/placements/tpo-drive-change-request-service.ts, src/components/placements/tpo-drive-change-requests.tsx
- Legacy: Legacy list includes `currentValue`, `answerValue`, `replyText`, `fieldLabel`, `createdByName`, `createdAt`, `resolvedAt`, `direction`, `kind`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- Expected fix: Add immutable before-value, distinct answer, decline, author display and resolved timestamp projections.

## G2-5-023-014 [P1] GAP facet F05
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy lists all requests ordered numeric `id DESC`; no cap. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:77-83`
- Expected fix: Implement cursor pagination and count/history access beyond 100.

## G2-5-023-024 [P1] GAP facet F07
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy errors for no recruiter, expired college access, duplicate same-field open request and unchanged proposed value. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:110-129`
- Expected fix: Preflight recruiter visibility, duplicate open field/direction and no-op comparisons transactionally.

## G2-5-023-027 [P1] GAP facet F07
- Files: src/modules/placements/tpo-drive-change-request-service.ts, src/modules/placements/tpo-drive-change-request-model.ts
- Legacy: Legacy exact errors `This one asks for a detail: answer it instead`, `Type the answer`, `Type a reason`, and settled/over checks. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:156-158,175-178,199-204`
- Expected fix: Validate action against ASK/PROPOSE and preserve distinct error feedback.

## Lane-12 verification notes (partial; packet remains open)

- G2-5-007-044 — OK: `listSuperAdminInterviews` includes SCHEDULED, CONFIRMED and RESCHEDULE_REQUESTED in ACTIVE filtering.
- G2-5-007-069 — OK for read projection: persisted `legacyInterviewStatus` is preferred and NO_SHOW is projected; mutation paths still require separate review.
- G2-5-013-028 — OK: job-service computes applicant, offer, interview and round counts for deletion-impact preview.
- G2-5-013-037 — OK for archive path: `archivePlacementJob` performs a transactional soft archive with status and archivedAt; separate delete semantics remain to verify.
- G2-5-023-014 — OK: `getDriveChangeRequests` uses a timestamp/id cursor, returns total and hasMore/nextCursor beyond the page cap.
- G2-4-023-018 — DEFERRED: company identity mismatch still throws a generic conflict; same-company confirmation flow needs product/API design.
- G2-4-023-025 — DEFERRED: distinct-company choice and alias policy not established by the canonical domain create flow.
- Remaining rows are not yet verified; do not treat this packet as completed.

## Lane-12 fast verification triage (2026-10-22)

Confirmed via cited vNext code (OK, limited to described behavior): G2-5-007-044, G2-5-007-069, G2-5-013-028, G2-5-013-037, G2-5-023-014.

DEFERRED — deeper implementation/API/migration review required; these are NOT verified or fixed: G2-4-023-018, G2-4-023-025, G2-4-023-037, G2-4-023-047, G2-13-031-076, G2-5-003-010, G2-5-007-002, G2-5-007-019, G2-5-009-009, G2-5-010-046, G2-5-013-002, G2-5-013-011, G2-5-013-014, G2-5-013-041, G2-5-013-075, G2-5-013-076, G2-5-015-021, G2-5-023-011, G2-5-023-024, G2-5-023-027.
This packet has been triaged, not certified parity-complete; no unverified row is claimed OK.
