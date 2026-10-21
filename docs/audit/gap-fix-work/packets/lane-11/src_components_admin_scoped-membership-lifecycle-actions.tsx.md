# Work packet: edit src/components/admin/scoped-membership-lifecycle-actions.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-19-001-008  [P1] GAP  facet F03  effort L
- Legacy: Legacy table row has icon actions Edit, Audit trail, Profile, OTP unlock, Impersonate, Suspend/Reactivate, Delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:959-1085`
- vNext now: vNext row renders lifecycle, Edit Student, Move Class plus details link `src/app/(authenticated)/admin/students/page.tsx:90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:37-50`; `src/components/college/college-person-edit-action.tsx:83-88`
- Fix: Restore missing role-checked Audit trail, Profile, OTP unlock, impersonation and deletion workflows (or document explicit deprecation).

## G2-19-001-046  [P1] GAP  facet F09  effort L
- Legacy: Legacy `Clear OTP lockout?`, `Impersonate this student?`, `Suspend Student`, `Reactivate Student`, `Delete Student` confirmations `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1085`
- vNext now: vNext lifecycle reasons/confirm flow but no OTP, impersonation or delete `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-64`; `src/app/(authenticated)/admin/students/page.tsx:90`
- Fix: Provide role-gated per-action dialogs with exact impact copy and safe confirmation.

## G2-19-001-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy suspend/reactivate `/api/v1/admin/users/LEARNER/{id}/...` invalidates active sessions `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminUserLifecycleController.java:83-101`,137-152,178-203
- vNext now: vNext membership action POST `/api/people/{membershipId}/lifecycle` and requires suspension reason >=3 `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-32`,42-51
- Fix: Verify canonical-session invalidation and cross-membership suspension effects; expose impact explanation.

## G2-6-002-061  [P1] GAP  facet F12  effort L
- Legacy: Old status uses suspendedAt on faculty with session-wide lockout, different from college membership `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:491-513` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:793-801`
- vNext now: New suspend only specific college membership and others unaffected `src/components/admin/scoped-membership-lifecycle-actions.tsx:35-46`
- Fix: Document deliberate account-vs-membership access change and enforce correct session scope

## G2-14-002-047  [P2] GAP  facet F08  effort S
- Legacy: Legacy Student suspended/reactivated, vNext College membership suspended/reactivated — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:641-664`
- vNext now: `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Use legacy message wording where membership action equivalent

## G2-18-031-035  [P2] GAP  facet F08  effort S
- Legacy: Legacy student register/update/delete toasts Student registered successfully! They can now login with their mobile number./Student updated successfully!/Student deleted successfully!; Students.js:485-589
- vNext now: vNext registration returns registered/partial Alert, scoped lifecycle inline notices, no hard-delete toast; college-student-register-form.tsx:52-69,124-130;scoped-membership-lifecycle-actions.tsx:29-32
- Fix: Use exact legacy copy for equivalent successful actions; retain PARTIAL warning as new safety state

## G2-18-031-037  [P2] GAP  facet F08  effort S
- Legacy: Legacy suspending/reactivating toasts Student suspended/Student reactivated/Faculty suspended/Faculty reactivated; Students.js:645-661;Faculty.js:495-511
- vNext now: vNext College membership suspended./reactivated. notice; scoped-membership-lifecycle-actions.tsx:18-32
- Fix: Clarify membership-only effect while mirroring role-specific success copy where safe

## G2-6-002-044  [P2] GAP  facet F08  effort S
- Legacy: Old suspend/reactivate toasts `Faculty suspended` / `Faculty reactivated` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:491-513`
- vNext now: New inline `College membership suspended.` / `College membership reactivated.` `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Use faculty-specific success copy while clarifying scoped semantics elsewhere
