# Work packet: edit src/modules/people/membership-domain.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-18-031-052  [P1] GAP  facet F12  effort L
- Legacy: Legacy Students delete permanently removes learner and records; Students.js:1066-1084;LearnerController.java:1116-1141
- vNext now: vNext ENDED membership preserves shared identity/history; membership-domain.ts:75-89;memberships.ts:17-50
- Fix: Define legal deletion vs reversible end and data retention; implement vetted delete only after dependent records/privacy review
