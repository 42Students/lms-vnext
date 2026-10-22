# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-4-031-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-4-031-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-5-005-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-5-006-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-5-007-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-5-009-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-5-011-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-5-024-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-11-020-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-11-026-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)

## Results
- G2-5-009-037: OK — `src/components/attendance/admin-attendance-workspace.tsx:151-152,745-771,782-796` provides one current-state-dependent correction action (`Mark present` for recorded absence, otherwise `Mark absent`) and radio reasons defaulting to `ABSENT`; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:265-275`. The vNext dialog additionally re-verifies status before mutation.
- G2-5-011-030: OK — `src/app/(authenticated)/teacher/calendar/page.tsx:43-50,79-86` retains the loaded calendar when upcoming course data fails and shows a dismissible warning with the exact `Failed to load course data` headline and `Calendar events may be incomplete` description; matches `docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:387-397`.
- G2-5-005-005: FIXED — commit `18372ffcf909a3dc8612a62b35c6c1cc940993c0`, `src/app/(authenticated)/hr/calendar/page.tsx`. Monday-start seven-day week now defaults to compact nonempty-day agenda; legacy `docs/legacy-source/frontend/src/pages/recruiter/calendar.js:29-42,92-124`.
- G2-4-031-071: OK — `src/modules/auth/runtime.ts:38-48` enforces tenant sign-in channel capability for OTP initiation; `src/app/api/auth/login/start/route.ts:51-58` supplies guarded host tenant ID; matches configured channel policy in `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:8-17,103-115`.
- G2-4-031-067: OK — `src/components/admin/college-signin-method-form.tsx:34,49-80` guards dirty navigation and reports dirty/busy to parent; matches `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-88`.

- G2-5-024-002: FIXED — commit `41305e4fc10fe11b31d590958087c04991ecdfc4`, `src/app/api/admin/onboarding/resolve-preview/route.ts:1-24`; adds a read-only guarded GET adapter to the existing globally scoped host preview, matching `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-313` (the response uses the vNext tenant-resolution envelope).

- G2-5-006-044: OK — `src/components/admin/super-admin-attendance-settings-editor.tsx:20-27,31-40,189-215` distinguishes effective defaults from saved college overrides, labels matching-default saved values separately, and provides whole-override reset with explicit warning; matches default/custom badges in `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:128-169`. Inheritance beyond college/default is explicitly not claimed.

- G2-11-026-027: FIXED — commit `1bd6d7dc925f501129c942a0430dd66b171d0db8`, `src/lib/bug-tracker-api-error.ts`: maps unavailable private screenshot configuration to 503 with exact legacy `Screenshot storage is unavailable` and `Retry-After: 60`; the existing `src/components/tracker/tracker-report-form.tsx:118-122,275-286` retains the created issue and retries failed screenshots independently. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerAttachmentService.java:183-190`.
