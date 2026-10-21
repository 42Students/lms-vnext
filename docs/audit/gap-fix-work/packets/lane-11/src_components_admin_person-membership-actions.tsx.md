# Work packet: edit src/components/admin/person-membership-actions.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-1-001-050  [P1] GAP  facet F23  effort M
- Legacy: `AdminUserLifecycleController.java:97-99,129-131` suspends account record, which blocks global login per legacy UI comment (`Faculty.js:489-490`).
- vNext now: `person-membership-actions.tsx:305-310` expressly suspends only one college membership; `repository.ts:838-848` revokes the canonical user's all device sessions.
- Fix: Resolve cross-college semantics in auth and UX: explain other memberships remain usable after re-login, but suspended college remains blocked.

## G2-18-031-010  [P1] GAP  facet F03  effort L
- Legacy: Legacy Students row icon actions Edit, Audit trail, Profile, Clear OTP lockout, SA Impersonate, Suspend/Reactivate, Delete; Students.js:966-1086
- vNext now: vNext scoped roster exposes edit/lifecycle, admin membership actions and profile dialog, but no verified matching full icon row; admin/students/page.tsx:82-92;person-membership-actions.tsx:72-152
- Fix: Create explicit per-action parity sheet and surface supported OTP/audit/impersonation actions or document removals

## G2-1-001-017  [P2] GAP  facet F07  effort S
- Legacy: `ProtectedFacultyRoles.java:50-54` says `Only a super admin can manage ADMIN/TPO accounts` in forbidden exception.
- vNext now: `membership-protection.ts:16-23` throws `MEMBERSHIP_PROTECTED`; `person-membership-actions.tsx:156-164` displays `The membership state could not be changed.`
- Fix: Translate protected-account code into explicit role and actor remediation instead of generic failure.

## G2-1-001-018  [P2] GAP  facet F08  effort S
- Legacy: `Faculty.js:495-508` shows `Faculty suspended`/`Faculty reactivated`; `Students.js:645-658` shows `Student suspended`/`Student reactivated`.
- vNext now: `college-faculty-lifecycle-action.tsx:53-56` uses `Faculty suspended.`/`Faculty reactivated.`; `college-student-lifecycle-action.tsx:37-38` has no success message; generic `person-membership-actions.tsx:183-187` uses `Membership updated`.
- Fix: Use exact role-specific success strings on each surface; ensure student has a success toast.

## G2-18-031-036  [P2] GAP  facet F08  effort S
- Legacy: Legacy faculty register/update/delete copy Faculty registered successfully! They can now login with their mobile number./Faculty updated successfully!/Faculty deleted successfully!; Faculty.js:386-485
- vNext now: vNext faculty onboarding reuses matching registration toast, role mutation uses Role added/removed toasts; person-onboard-dialog.tsx:106-113;person-membership-actions.tsx:117-124
- Fix: Preserve exact update toast on successful editor save and explain intentional nondeletion
