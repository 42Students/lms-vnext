# Work packet: edit src/components/college/college-role-directory-workspace.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/college-admin-students.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-13-007-014  [P1] GAP  facet F04  effort L
- Legacy: Legacy table columns Name, Roll No., Mobile, Email, Class, Gender, Status, Actions (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:928-960`)
- vNext now: New DataTable Person, Membership, Program · Batch · Class, Joined (`src/components/college/college-role-directory-workspace.tsx:408-453`)
- Fix: Restore the eight legacy columns, including roll/mobile/email/gender/actions, under appropriate privacy access.

## G2-13-007-018  [P1] GAP  facet F04  effort M
- Legacy: Legacy table status detects suspendedAt regardless membership (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:950-955`)
- vNext now: New computes membershipStatus and accountStatus separately (`src/components/college/college-role-directory-workspace.tsx:424-430`)
- Fix: Crosswalk suspended user vs suspended membership to avoid false active visual state.

## G2-13-007-038  [P1] MISSING  facet F09  effort S
- Legacy: Old Delete Popconfirm warns permanent loss incl attendance (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1085`)
- vNext now: New lifecycle controls omit hard-delete option (`src/components/college/college-role-directory-workspace.tsx:440-449`)
- Fix: Decide policy and retain explicit destructive confirmation if restored.

## G2-13-007-040  [P1] MISSING  facet F09  effort M
- Legacy: Old OTP unlock Popconfirm tied to contactMobile (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1006`)
- vNext now: No OTP unlock action in new roster (`src/components/college/college-role-directory-workspace.tsx:440-449`)
- Fix: Restore authenticated OTP lockout management or link it to proper security settings.

## G2-13-007-044  [P1] MISSING  facet F10  effort M
- Legacy: Old deleteLearner destructive mutation (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:581-590`)
- vNext now: New directory does not expose deletion (`src/components/college/college-role-directory-workspace.tsx:440-449`)
- Fix: Explicitly decide hard-delete removal and retention policy.

## G2-13-007-045  [P1] MISSING  facet F10  effort S
- Legacy: Old clearOtpLockout per contact mobile (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:685-694`)
- vNext now: New no direct OTP unlock entry (`src/components/college/college-role-directory-workspace.tsx:440-449`)
- Fix: Add safe permissioned unlock route or documented alternative.

## G2-13-007-046  [P1] GAP  facet F10  effort L
- Legacy: Old suspendUser/reactivateUser via lifecycle API (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:641-662`)
- vNext now: New CollegeStudentLifecycleAction scoped membership action (`src/components/college/college-role-directory-workspace.tsx:447-449`)
- Fix: Reconcile user account vs membership status and immediate session invalidation.

## G2-13-007-050  [P1] MISSING  facet F11  effort S
- Legacy: Old bulk module action is available to college admin on selected students (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:600-635`)
- vNext now: New college roster has no bulk controls (`src/components/college/college-role-directory-workspace.tsx:101-118`)
- Fix: Expose permissioned bulk module control (set, unset, inherit).

## G2-13-007-051  [P1] GAP  facet F12  effort L
- Legacy: Old hard delete removes student and dependent attendance, irreversible (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1068`)
- vNext now: New uses reversible membership lifecycle status actions (`src/components/college/college-role-directory-workspace.tsx:447-449`)
- Fix: Establish explicit behavioral change deletion→revocation and owner approval.

## G2-13-007-076  [P1] GAP  facet F21  effort L
- Legacy: Old admin services register/update/delete, learner search, OTP, impersonate (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:13-31`)
- vNext now: New directory service plus registration/import/profile/lifecycle modules (`src/components/college/college-role-directory-workspace.tsx:14-39`)
- Fix: Produce endpoint-by-endpoint closure map before implementing missing security actions.

## G2-13-007-078  [P1] GAP  facet F22  effort L
- Legacy: Old learner records linked by numeric learner.id/classId/programId/collegeId (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:485-508`)
- vNext now: New uses UUID membershipId with active enrollment/cohort/section associations (`src/components/college/college-role-directory-workspace.tsx:369-388`)
- Fix: Create learner→membership data crosswalk and enrollment/status mapping.

## G2-13-007-079  [P1] GAP  facet F22  effort M
- Legacy: Old suspendedAt is account-level source for Active/Suspended (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:949-955`)
- vNext now: New member and user status split (`src/components/college/college-role-directory-workspace.tsx:424-430`)
- Fix: Define effective active when membership AND account active; audit all actions.

## G2-6-001-024  [P1] GAP  facet F06  effort S
- Legacy: Old birth date uses date picker; college fixed from loginUser `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1021-1029` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1091-1096`
- vNext now: New uses implicit membership college and only name/phone/email `src/components/college/college-role-directory-workspace.tsx:91-93` `src/components/admin/person-onboard-dialog.tsx:75-86`
- Fix: Keep implicit college scope but add DOB picker and mapping

## G2-6-001-036  [P1] GAP  facet F09  effort M
- Legacy: Old Audit trail modal 800px and Profile modal 860px opened by per-row icons `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1517-1539`
- vNext now: New opens CollegePersonAuditModal and ProfileOverviewModal in More actions `src/components/college/college-role-directory-workspace.tsx:389-395`
- Fix: Match dialog trigger, headings and widths; verify imported modal details

## G2-6-001-048  [P1] GAP  facet F12  effort M
- Legacy: Old status depends on suspendedAt timestamp `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:789-801`
- vNext now: New separately models membership ACTIVE/SUSPENDED/ENDED and account ACTIVE/DISABLED `src/components/college/college-role-directory-workspace.tsx:154-165` `src/components/college/college-role-directory-workspace.tsx:230-238`
- Fix: Write canonical mapping and transition semantics between old suspension and new membership/platform states

## G2-6-001-052  [P1] MISSING  facet F13  effort M
- Legacy: Old autocomplete loading spinner and `No faculty found. Try a different search.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1332-1340`
- vNext now: New plain input form without suggestion dropdown states `src/components/college/college-role-directory-workspace.tsx:142-152`
- Fix: Implement pending/no-results dropdown states in autocomplete

## G2-6-001-057  [P1] MISSING  facet F15  effort M
- Legacy: Old OTP lockout clear is user-initiated admin action `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:561-570`
- vNext now: New college roster has no OTP clear control `src/components/college/college-role-directory-workspace.tsx:440-450`
- Fix: Restore admin-only lockout action and audit notification policy

## G2-13-007-030  [P2] GAP  facet F07  effort M
- Legacy: Old edit blocks when lookup error or row action busy (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:520-523`)
- vNext now: New profile edit action rendered for row regardless lookup errors on directory (`src/components/college/college-role-directory-workspace.tsx:440-445`)
- Fix: Ensure modal loads/scopes dependencies and disables Save until verified.

## G2-13-007-031  [P2] GAP  facet F07  effort M
- Legacy: Old failed roster load retains prior results, shows error (`docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:357-409`)
- vNext now: New server call can route error boundary; filter parse errors show Invalid directory filters (`src/components/college/college-role-directory-workspace.tsx:62-79`)
- Fix: Provide in-page roster retry with differentiated upstream/validation errors.
