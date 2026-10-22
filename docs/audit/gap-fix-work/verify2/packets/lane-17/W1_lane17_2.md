# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-030-007 [P1] GAP facet F02
- Files: src/components/placements/placement-operations-overview.tsx
- Legacy: Active drives 24/12/8/6 responsive card grid, 16px gutters; DrivesLanding.js:522-528
- Expected fix: Render active drives as 1/2/3/4 column compact cards with avatar/tags/menu; retain archive table separately.

## G2-17-030-012 [P1] MISSING facet F03
- Files: src/components/placements/placement-operations-overview.tsx, src/components/placements/super-admin-drive-deadline.tsx
- Legacy: Each active card has More actions dropdown with Duplicate as new drive and Extend deadline; DrivesLanding.js:565-584
- Expected fix: Restore visible per-card More actions menu with exact labels and linked modal flows.

## G2-17-030-040 [P1] GAP facet F12
- Files: src/components/placements/placement-operations-overview.tsx
- Legacy: Live status derives active only with no draft/closed and search recent 60; DrivesLanding.js:105-124,197-208
- Expected fix: Filter landing cards PUBLISHED/current active only, link archive for drafts/closed.

## G2-19-027-037 [P1] GAP facet F11
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: `fetchAll` unscoped global Super Admin may read across platform, scoped org/college filtered; CourseController.java:104-125
- Expected fix: Offer explicit authorized global/org catalogue read only in platform-admin mode, never remove college scope by default.

## G2-11-003-002 [P1] GAP facet F01
- Files: src/modules/placements/recruiter-drive-list-model.ts
- Legacy: Default tab waiting when any, else live, else all `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:103`
- Expected fix: Set initial view by current counts, persist in URL

## G2-11-004-066 [P1] GAP facet F10
- Files: src/app/(authenticated)/hr/drives/new/page.tsx
- Legacy: GET college overview for branches and approximate student counts `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:139`
- Expected fix: Restore rounded student count in preview

## G2-11-009-046 [P1] GAP facet F11
- Files: src/modules/placements/drive-day-coordinator-service.ts
- Legacy: Legacy TPO portal lists college rounds regardless of individual assignment. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:14`
- Expected fix: Never substitute coordinator list for active TPO portal.

## G2-11-008-015 [P1] MISSING facet F03
- Files: src/components/placements/tpo-round-check-in.tsx
- Legacy: Full operators may mark `In interview`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:331`
- Expected fix: Add operator IN_INTERVIEW button and transition API.

## G2-11-008-016 [P1] MISSING facet F03
- Files: src/components/placements/tpo-round-check-in.tsx
- Legacy: Full operators may mark `Done`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:332`
- Expected fix: Add DONE button and transition API.

## G2-11-008-038 [P1] GAP facet F07
- Files: src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx
- Legacy: Roster denial shows `This drive day isn't available to you.` inline. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:46`
- Expected fix: Render in-workflow error panel and retry.

## G2-11-011-039 [P1] MISSING facet F04
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Verified marks only checkbox changes missing-data policy. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:688`
- Expected fix: Port verified-marks-only policy and persisted update.

## G2-11-011-066 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy updateDrive PUT with composite payload company, modes, roles, eligibility, rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:17`
- Expected fix: Extend DTO/transaction to all old editable fields.

## G2-11-011-068 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy getDrive/getDriveRounds hydration for all form fields. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:17`
- Expected fix: Return all form defaults, including linked details and rounds.

## G2-11-011-071 [P1] GAP facet F11
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Frozen statuses CLOSED/CANCELLED/REJECTED block autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:318`
- Expected fix: Remove season-only edit denial where legacy permitted, preserve frozen statuses.

## G2-11-011-102 [P1] GAP facet F19
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Hydrates batches, CGPA, students, companies, history, rounds and eligibility. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:166`
- Expected fix: Load supporting selection datasets lazily with status indicator.

## G2-11-011-111 [P1] GAP facet F22
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy form model stores companyId, jobTitle, JD, driveMode, category, roleOptions. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:146`
- Expected fix: Map full legacy form payload to schema and edit DTO.

## G2-12-003-054 [P1] MISSING facet F11
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Global progress policy editable without college `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:527-535`
- Expected fix: Expose platform policy in SA unscoped state

## G2-12-006-019 [P1] GAP facet F06
- Files: src/modules/placements/learner-withdrawal-model.ts
- Legacy: Self withdrawal no reason; request withdrawal requires reason3..900 `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:178-188`
- Expected fix: Do not require reason for valid self-withdraw

## G2-12-005-059 [P1] GAP facet F15
- Files: src/components/placements/learner-placements-tabs.tsx
- Legacy: Announcement tab badge counts unread college announcements and listens for read event `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:71-87`
- Expected fix: Use correct college-wide announcement unread source for tab badge

## G2-12-002-016 [P1] GAP facet F04
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Program-class staffing warning/tooltip based on unassigned classes `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:494-532`
- Expected fix: Verify cohort/class universe equivalence and warning threshold

## G2-12-002-045 [P1] GAP facet F10
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Specific admin audit SEMESTER_COURSE_ADD/REMOVE/UPDATE/REORDER `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:408-410,444-446,595-600,629-633`
- Expected fix: Emit action-specific audit events and metadata

## G2-12-002-048 [P1] GAP facet F12
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Duplicate bulk course is skipped silently, preserving others `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:79-107`
- Expected fix: Define idempotent bulk add behavior

## G2-12-002-067 [P1] GAP facet F19
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: Legacy loads mappings+staffing only selected semester `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:99-139`
- Expected fix: Filter/paginate heavy reads per semester

## G2-17-23-016 [P1] GAP facet F04 Accept input
- Files: (none, new feature)
- Legacy: LC:33,40 reads body Map<String,Boolean> accept and treats only Boolean.TRUE as accept
- Expected fix: Make accept intent explicit and reject absent/nonboolean legacy accept; never silently convert malformed payload into decline

## G2-17-23-081 [P1] GAP facet F20 Timezone
- Files: (none, new feature)
- Legacy: TS:177–183 uses LocalDateTime.now with server default and JO:63–64 stores timezone-less; JS:1224 explicitly UTC for application status
- Expected fix: Define one authoritative Asia/Kolkata business deadline converted to UTC instant; guard at lock time and format IST correctly
