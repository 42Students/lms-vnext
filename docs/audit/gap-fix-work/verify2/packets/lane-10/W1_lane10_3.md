# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-009-006 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Legacy page has a single TPO-oriented purpose. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:15`
- Expected fix: Respect active portal role when selecting list branch.

## G2-11-012-094 [P1] GAP facet F20
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Failed drives GET retains last array. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:157`
- Expected fix: Retain snapshot across failed refresh.

## G2-12-005-007 [P1] GAP facet F03
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: Debarment alerts red with reason and expiry, attendance absence warnings with quick dispute `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:162-173`
- Expected fix: Restore event-specific debarment and absence action cards

## G2-13-007-014 [P1] GAP facet F04
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Legacy table columns Name, Roll No., Mobile, Email, Class, Gender, Status, Actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-960`)
- Expected fix: Restore the eight legacy columns, including roll/mobile/email/gender/actions, under appropriate privacy access.

## G2-13-007-018 [P1] GAP facet F04
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Legacy table status detects suspendedAt regardless membership (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:950-955`)
- Expected fix: Crosswalk suspended user vs suspended membership to avoid false active visual state.

## G2-13-007-038 [P1] MISSING facet F09
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old Delete Popconfirm warns permanent loss incl attendance (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1085`)
- Expected fix: Decide policy and retain explicit destructive confirmation if restored.

## G2-13-007-040 [P1] MISSING facet F09
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old OTP unlock Popconfirm tied to contactMobile (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1006`)
- Expected fix: Restore authenticated OTP lockout management or link it to proper security settings.

## G2-13-007-044 [P1] MISSING facet F10
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old deleteLearner destructive mutation (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:581-590`)
- Expected fix: Explicitly decide hard-delete removal and retention policy.

## G2-13-007-045 [P1] MISSING facet F10
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old clearOtpLockout per contact mobile (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:685-694`)
- Expected fix: Add safe permissioned unlock route or documented alternative.

## G2-13-007-046 [P1] GAP facet F10
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old suspendUser/reactivateUser via lifecycle API (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:641-662`)
- Expected fix: Reconcile user account vs membership status and immediate session invalidation.

## G2-13-007-050 [P1] MISSING facet F11
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old bulk module action is available to college admin on selected students (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:600-635`)
- Expected fix: Expose permissioned bulk module control (set, unset, inherit).

## G2-13-007-051 [P1] GAP facet F12
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old hard delete removes student and dependent attendance, irreversible (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1068`)
- Expected fix: Establish explicit behavioral change deletion→revocation and owner approval.

## G2-13-007-076 [P1] GAP facet F21
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old admin services register/update/delete, learner search, OTP, impersonate (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:13-31`)
- Expected fix: Produce endpoint-by-endpoint closure map before implementing missing security actions.

## G2-13-007-078 [P1] GAP facet F22
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old learner records linked by numeric learner.id/classId/programId/collegeId (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:485-508`)
- Expected fix: Create learner→membership data crosswalk and enrollment/status mapping.

## G2-13-007-079 [P1] GAP facet F22
- Files: src/components/college/college-role-directory-workspace.tsx
- Legacy: Old suspendedAt is account-level source for Active/Suspended (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-955`)
- Expected fix: Define effective active when membership AND account active; audit all actions.

## G2-17-23-056 [P1] GAP facet F11 Status-before-ownership leak
- Files: (none, new feature)
- Legacy: TS:173–179 tests offer existence, RELEASED status and response deadline before JS:1186–1189 enforces learner ownership
- Expected fix: Avoid offering an ID/status enumeration oracle in any compatibility route; require owner-scope before revealing offer state or deadline

## G2-17-028-044 [P1] GAP facet F22 Legacy storage
- Files: (none, new feature)
- Legacy: LM:3-42 adds nullable readiness_override BOOLEAN, note TEXT, by INT, at DATETIME to project_workspace
- Expected fix: Preserve historical override read model or migrate records to append-only activity events (no data migration desired? confirm on live old data)

## G2-18-026-007 [P1] GAP facet F04 Duration representation
- Files: (none, new feature)
- Legacy: NewProgramDTO:11-15 and NPS:57-60 persist duration_years integer
- Expected fix: Define complete conversion contract (terms=years*2) for reads/writes; prevent fractional legacy years in compatibility projections

## G2-19-029-017 [P1] GAP facet F04 Success headline
- Files: (none, new feature)
- Legacy: LG:217-222 `Ready to go live` / `Students and staff can log in at this college's web address.`
- Expected fix: Preserve exact old headline only for verified legacy domain-login indicator; retain vNext caution for actual live tests to avoid false assurance

## G2-13-006-064 [P1] GAP facet F19
- Files: src/app/(authenticated)/learn/my-placements/announcements/page.tsx
- Legacy: Old fetches all announcements and entire overview notices; all displayed (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:31-40`)
- Expected fix: Avoid hiding old notices and action updates without obvious history links/counters.

## G2-18-021-004 [P1] MISSING facet F02
- Files: (none, new feature)
- Legacy: Old importantDates without matching active scheduled round still rendered as calendar marker (JobServiceImpl:1545-1570)
- Expected fix: Project informational dates even when no corresponding round exists, de-dupe when scheduled event matches

## G2-19-026-005 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Old two-console hierarchy labels and three modules `projects`,`placements`,`courses` (ModuleAccessUpdateRequest:15-19)
- Expected fix: Document Courses→Electives product semantic divergence; verify which legacy rows are expected

## G2-14-002-032 [P1] GAP facet F06
- Files: src/components/college/college-student-register-form.tsx
- Legacy: Legacy Roll Number required; vNext Roll Number optional input — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1153-1160`
- Expected fix: Require roll with server validation and Enter the roll number

## G2-14-002-034 [P1] GAP facet F06
- Files: src/components/college/college-student-register-form.tsx
- Legacy: Legacy Program & Class mandatory, no Batch field; vNext Batch required, Class optional — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1190-1223`
- Expected fix: Require class or explicitly document new batch placement policy

## G2-14-002-036 [P1] GAP facet F06
- Files: src/components/college/college-person-edit-action.tsx, src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy editable first/last/mobile/email/roll/program/class; vNext canonical Name/Login Mobile/Login Email readonly and class in separate action — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1593-1715`
- Expected fix: Unify profile + placement edit controls with explicit permission verification

## Lane chat-2 fast verification disposition (2026-10-22)

- OK (source inspected): G2-11-009-006, G2-11-012-094, G2-13-007-018, G2-13-007-079, G2-14-002-032. TPO role selects TPO branch, lifecycle failure uses scoped stale snapshot, directory effective status checks account and membership, and registration requires nonblank roll with legacy validation copy.
- DEFERRED (cannot claim parity from brief source inspection): G2-12-005-007, G2-13-007-014, G2-13-007-038, G2-13-007-040, G2-13-007-044, G2-13-007-045, G2-13-007-046, G2-13-007-050, G2-13-007-051, G2-13-007-076, G2-13-007-078, G2-17-23-056, G2-17-028-044, G2-18-026-007, G2-19-029-017, G2-13-006-064, G2-18-021-004, G2-19-026-005, G2-14-002-034, G2-14-002-036. Needs endpoint/security or full workflow confirmation and/or legacy migration product decision. No auth changes or irreversible deletion made during this packet.
