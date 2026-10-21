# Work packet: edit src/app/api/profile/me/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-036  [P1] GAP  facet F10  effort L
- Legacy: `LearnerProfileController.java:328-1237` individual CRUD endpoints across ~20 groups.
- vNext now: `api/profile/me/route.ts:13-49` GET/PUT whole doc and `sections/route.ts:7-12` PATCH selected arrays.
- Fix: Publish complete route/method replacement list and repair every consumer.
