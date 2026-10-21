# Work packet: edit src/modules/people/faculty-self-section-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-034  [P2] GAP  facet F07  effort S
- Legacy: `FacultyProfileServiceImpl.java:28,38-40` index out of bounds message 'Index out of bounds. Please refresh and try again.'
- vNext now: `faculty-self-section-service.ts:9-16` throws FACULTY_PROFILE_VERSION_CONFLICT when CAS token stale.
- Fix: Map concurrent stale-entry updates to exact recovery wording and preserve draft.
