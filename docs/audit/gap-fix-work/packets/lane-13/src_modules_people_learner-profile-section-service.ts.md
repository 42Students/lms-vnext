# Work packet: edit src/modules/people/learner-profile-section-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-029  [P2] GAP  facet F07  effort S
- Legacy: `LearnerProfileServiceImpl.java:43-55` invalid list index -> 'Index out of bounds. Please refresh and try again.'
- vNext now: `learner-profile-section-service.ts:44-47` emits `LEARNER_PROFILE_SECTION_STALE`.
- Fix: Show stale index recovery without leaking raw error.
