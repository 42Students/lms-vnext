# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-028-064 [P1] GAP facet F22
- Files: src/components/projects/project-workspace.tsx
- Legacy: Legacy overall progress derived from resolvedTasks/resolvedSprints, fallback manual. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:48-70`
- Expected fix: Align numerator/denominator and fallback when no tasks.

## G2-5-002-016 [P1] GAP facet F04 Data formatting
- Files: src/app/(authenticated)/college/placements/interviews/page.tsx
- Legacy: Conflict kinds candidate/interviewer/both over whole unfiltered org. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:545-556)
- Expected fix: Check candidate and interviewer across all active bookings before filtering.

## G2-5-003-026 [P1] GAP facet F06 Forms
- Files: src/modules/academics/college-section-mutation-service.ts
- Legacy: Edit allows changing Program and Batch with scope validation. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:71-78)
- Expected fix: Provide sanctioned reassignment flow with dependency guard or document intentional immutability.

## G2-5-006-008 [P1] MISSING facet F03 Visible elements
- Files: (none, new feature)
- Legacy: Default (24 hours)/Custom for this college tags reveal inherited vs override (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:158-169)
- Expected fix: Show per-setting inheritance badge and reset affordance.

## G2-5-008-012 [P1] GAP facet F03 Visible elements
- Files: (none, new feature)
- Legacy: Option failure Retry warning inside form area (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:430-435)
- Expected fix: Add partial-option error banner with Retry.

## G2-5-008-028 [P1] GAP facet F06 Forms
- Files: src/modules/academics/college-section-mutation-service.ts
- Legacy: Edit can change Program, Batch and lowerLimit preserved (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- Expected fix: Safe Program/Batch reassignment with validation or explicit intentional departure.

## G2-5-009-075 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: Read legacy app_setting policy values via PolicySettingField (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:478-485)
- Expected fix: Migrate effective global/org/college policy overrides.

## G2-5-010-018 [P1] GAP facet F04 Data formatting
- Files: src/modules/academics/college-section-mutation-service.ts
- Legacy: Lower limit preserved on edit, max>=min invariant (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- Expected fix: Preserve legacy lowerLimit and cross-field invariant.

## G2-5-010-028 [P1] GAP facet F06 Forms
- Files: src/modules/academics/college-section-mutation-service.ts
- Legacy: Edit allows Program/Batch reassignment (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48)
- Expected fix: Implement safe reassignment with dependency validation.

## G2-5-012-077 [P1] GAP facet F16
- Verification: OK — `tpoCalendarViewForViewport` uses the actual width <768 and explicit URL view takes precedence.
- Files: src/modules/placements/tpo-calendar-url-model.ts
- Legacy: Legacy <768px viewport switches default view from Week to Agenda (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:51-52`)
- Expected fix: Switch by actual client viewport including narrow desktop; preserve URL override

## G2-5-016-016 [P1] GAP facet F07
- Verification: OK — skills GET returns the legacy search-failure wording plus retryable 503 when the catalog is disabled.
- Files: src/app/api/skills/route.ts
- Legacy: Legacy search failure message 'Failed to search skills. Please try again or contact support.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:49-62`
- Expected fix: Provide useful unavailable/search-retry UI message.

## G2-5-016-030 [P1] GAP facet F13
- Files: src/app/api/skills/route.ts
- Legacy: Legacy loader disabled by default, skips with log `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:109-115`
- Expected fix: Separate read readiness and alias bootstrap flags.

## G2-5-023-004 [P1] GAP facet F01
- Files: src/components/placements/tpo-drive-change-requests.tsx
- Legacy: Legacy `Discuss` action quotes a request into shared drive Discussion, if handler provided. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:125-133`
- Expected fix: Link each request to drive Discussion with request ID/context and preserve main timeline.

## G2-5-023-007 [P1] GAP facet F03
- Files: src/components/placements/tpo-drive-change-requests.tsx
- Legacy: Legacy has 11 selectable fields: role title, description, location, job type, mode, deadline, CTC, stipend, CGPA, branches, other. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:29-34`
- Expected fix: Represent all eleven legacy fields explicitly with compatible typed requests; treat rounds as new.

## G2-5-023-010 [P1] GAP facet F03
- Files: src/components/placements/tpo-drive-change-requests.tsx
- Legacy: Legacy exposes one-click Withdraw, conditional Accept or Answer, Decline and Discuss. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:126-134`
- Expected fix: Constrain recipient action to Accept only for PROPOSE and Answer only for ASK; restore Discuss.

## G2-5-023-019 [P1] GAP facet F06
- Files: src/components/placements/tpo-drive-change-requests.tsx
- Legacy: Legacy deadline DatePicker with time and disabled past dates; mode/job type Select; description five-row textarea; location/title maxlength255. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:56-67`
- Expected fix: Add typed field editors, local→UTC conversion, lengths and input masks.

## G2-5-023-021 [P1] GAP facet F06
- Files: src/components/placements/tpo-drive-change-requests.tsx, src/modules/placements/tpo-drive-change-request-model.ts
- Legacy: Legacy answers use special DatePicker/Mode/Job type selection and Decline max1000; answer max2000. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:196-214`
- Expected fix: Use typed Answer editor and separate decline rationale; allow Accept without mandatory note.

## G2-5-023-029 [P1] GAP facet F08
- Files: src/components/placements/tpo-drive-change-requests.tsx
- Legacy: Legacy success for Accept `Accepted and applied` / `Applied. Students who applied were told.`; for answer `Answered`, decline `Declined`, withdraw `Withdrawn`. `docs/legacy-source/frontend/src/components/tpo/drive/ChangeRequests.jsx:80-82,125-132,199-204`
- Expected fix: After implementing application side effects, use accurate action-specific status and applicant notification copy.

## G2-5-029-028 [P1] GAP facet F07
- Files: src/modules/projects/validation.ts
- Legacy: Legacy validateRepeatingItems applies per-field/row required checks. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- Expected fix: Show per-row errors for each sprint/task/resource.

## G2-5-030-018 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx, src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx, src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx, src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy children expose onDirtyChange/onBusyChange for domains, sign-in, branding, admins. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- Expected fix: Use shared setup controller or route blockers that track dirty/busy per section.

## G2-5-032-021 [P1] GAP facet F06
- Files: src/modules/placements/placement-offer-expiry-sweep-service.ts
- Legacy: Legacy overdue offers expire every15m lease12m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:72-73`
- Expected fix: Invoke offer sweep every15 minutes via persisted lease.

## G2-5-032-032 [P1] GAP facet F10
- Files: src/modules/placements/placement-offer-expiry-sweep-service.ts
- Legacy: Legacy expired jobs scan active jobs past deadline and set inactive/audit daily. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-72`
- Expected fix: Implement job application-deadline expiry separately from offer expiry.

## G2-6-020-011 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Legacy deptViceChairId optional Integer (Department.java:19-20; DepartmentDTO.java:17-20).
- Expected fix: Add optional vice-chair association or document product decision to drop.

## G2-6-027-039 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy visibility distinct from screening eligibility, no pre-apply academic hard rejection per controller philosophy (JobController.java:38-42,149-159).
- Expected fix: Make visibility vs eligibility distinction explicit; validate permitted apply override policy.

## G2-11-017-009 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: Placement eligibility link /tpo/batches, exact description (more.js:23).
- Expected fix: Restore Placement eligibility as first Work row.
