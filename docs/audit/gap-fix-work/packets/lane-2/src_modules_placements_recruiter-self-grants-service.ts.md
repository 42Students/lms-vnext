# Work packet: edit src/modules/placements/recruiter-self-grants-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-13-025-005  [P1] MISSING  facet F03  effort S
- Legacy: Pending card source returns collegeId/collegeName/company/invitedContact `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:295-300`
- vNext now: Self-grants reads only ACTIVE grants; no invited contact `src/modules/placements/recruiter-self-grants-service.ts:102-167`
- Fix: Project exactly four pending invitation identity fields.

## G2-13-025-021  [P1] MISSING  facet F10  effort S
- Legacy: Pending list own recruiter id from principal `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-23`
- vNext now: Self grant reader uses signed-in context but ACTIVE only `src/modules/placements/recruiter-self-grants-service.ts:55-76,140-156`
- Fix: Add list query by context.user.id, don't require ACTIVE grant.

## G2-13-025-025  [P1] GAP  facet F11  effort M
- Legacy: Anyone signed in as recruiter may view own pending grants `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-23`
- vNext now: vNext self-grants requires hasActiveRecruiter context `src/modules/placements/recruiter-self-grants-service.ts:55-72`
- Fix: Allow recruiter with zero ACTIVE grants to view and resolve pending.

## G2-13-025-036  [P1] GAP  facet F16  effort M
- Legacy: Pending recruiter can be college-less, list not scoped to current college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:19-29`
- vNext now: vNext normal recruiter scope requires active grant `src/modules/placements/recruiter-self-grants-service.ts:55-72`
- Fix: Place responsive pending panel outside active-college-only shell.
