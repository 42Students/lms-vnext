# Work packet: edit src/app/api/placements/registration/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u023-learner-placement-controller.md

## G2-16-023-025  [P3] GAP  facet F08  effort S
- Legacy: LearnerPlacementController.java:47-50 returns `{ok:true}` for POST.
- vNext now: registration/route.ts:24-26 returns `{choice,version}`; client shows LEARNER_REGISTRATION_COPY.success.
- Fix: Maintain caller compatibility and verify saved confirmation copy.
