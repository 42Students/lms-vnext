# Work packet (wave 2): edit src/modules/placements/tpo-drive-change-request-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md

## G2-16-025-013  [P2] GAP  facet F06  effort M
- Legacy: DriveChangeRequestService.java:70-75 new field/kind/proposedValue/note.
- vNext now: tpo-drive-change-request-model.ts:3-5 requires mode/field/proposedValue/reason.
- Fix: Map field/kind/note names and conditional ASK behavior.

## G2-16-025-015  [P2] GAP  facet F06  effort S
- Legacy: DriveChangeRequestService.java:105-106 proposed max2000 note max1000.
- vNext now: tpo-drive-change-request-model.ts:3-8 proposed max2000 reason1000, decision note2000.
- Fix: Match reply/decline max1000 while answer max2000; per-action limits.

## G2-16-025-043  [P2] GAP  facet F18  effort S
- Legacy: DriveChangeRequestService.java:49-54 exact legacy `Role title`/`CTC (LPA)`/`Monthly stipend` etc.
- vNext now: tpo-drive-change-request-model.ts:3-5 values PAY/ELIGIBILITY/ROUNDS.
- Fix: Restore specific field selector labels; do not collapse distinct pay questions.

## G2-16-025-006  [P3] GAP  facet F03  effort S
- Legacy: RecruiterChangeRequestController.java:60-82 Accept, Answer, Reply, Withdraw.
- vNext now: tpo-drive-change-request-model.ts:6-8 ACCEPT,ANSWER,DECLINE,WITHDRAW,COMMENT.
- Fix: Map `Reply` legacy decline status REPLIED and separate free-form COMMENT.
