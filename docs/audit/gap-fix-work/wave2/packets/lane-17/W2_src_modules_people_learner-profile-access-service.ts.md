# Work packet (wave 2): edit src/modules/people/learner-profile-access-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-046  [P2] GAP  facet F13  effort S
- Legacy: `LearnerProfileServiceImpl.java:83-88` missing learner returns not-found.
- vNext now: `learner-profile-access-service.ts:9-24` missing active membership is authorization failure.
- Fix: Show safe missing-profile versus denied states without data disclosure.
