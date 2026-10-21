# Work packet: edit src/components/college/college-faculty-lifecycle-action.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/admin-user-lifecycle-controller.md, docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-1-001-015  [P1] GAP  facet F07  effort S
- Legacy: `AdminUserLifecycleController.java:122-125` returns 409 with full sentence in both `error` and `message` when active mentor projects remain.
- vNext now: `active-mentor-project-guard.ts:21-24` constructs same sentence but `college-faculty-lifecycle-service.ts:66-68` throws code; `route.ts:21-25` emits `FACULTY_HAS_ACTIVE_PROJECTS`; client `college-faculty-lifecycle-action.tsx:50-52` shows generic teaching-responsibilities error.
- Fix: Surface exact active-mentor count and legacy action guidance to faculty admin UI; return structured code and human message.

## G2-6-001-039  [P1] MISSING  facet F09  effort M
- Legacy: Old Delete/Suspend/Reactivate/Clear OTP popconfirms `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:838-935`
- vNext now: New only Suspend/Reactivate dialog and Audit link `src/components/college/college-faculty-lifecycle-action.tsx:64-91`
- Fix: Expose secured delete and OTP reset with distinct confirmations; scope checks mandatory

## G2-1-001-016  [P2] GAP  facet F07  effort S
- Legacy: `Faculty.js:498-499`, `Students.js:648-649` prepend 'Failed to suspend faculty/student: ' plus backend text.
- vNext now: `college-student-lifecycle-action.tsx:34-38` shows generic status-dependent denial; `college-faculty-lifecycle-action.tsx:50-58` replaces server detail with teaching-responsibilities text.
- Fix: Show actionable server reason with safe fallback; match role-specific wording.

## G2-1-001-018  [P2] GAP  facet F08  effort S
- Legacy: `Faculty.js:495-508` shows `Faculty suspended`/`Faculty reactivated`; `Students.js:645-658` shows `Student suspended`/`Student reactivated`.
- vNext now: `college-faculty-lifecycle-action.tsx:53-56` uses `Faculty suspended.`/`Faculty reactivated.`; `college-student-lifecycle-action.tsx:37-38` has no success message; generic `person-membership-actions.tsx:183-187` uses `Membership updated`.
- Fix: Use exact role-specific success strings on each surface; ensure student has a success toast.

## G2-1-001-019  [P2] GAP  facet F08  effort S
- Legacy: `Faculty.js:896-901`, `Students.js:1048-1054` confirms 'Blocks login immediately and revokes any active session. Reversible — data and history are kept.'
- vNext now: `college-faculty-lifecycle-action.tsx:76-79` confirmation says 'Supply the suspension reason before confirming.'; student `college-student-lifecycle-action.tsx:49-52` says 'Provide a reason for restricting the student’s college access.'
- Fix: Restore explicit immediate-login, session revocation and reversible-history warning, qualified for membership rather than platform identity.

## G2-1-001-020  [P2] GAP  facet F08  effort S
- Legacy: `Faculty.js:876-883`, `Students.js:1029-1035` confirms reactivation lets user log in again.
- vNext now: `college-faculty-lifecycle-action.tsx:75-79` says restore faculty membership; `college-student-lifecycle-action.tsx:49-52` says restore student college access.
- Fix: Use equivalent login-restoration disclosure and explain that other active memberships remain usable.
