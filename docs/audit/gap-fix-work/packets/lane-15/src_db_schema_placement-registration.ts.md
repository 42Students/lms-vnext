# Work packet: edit src/db/schema/placement-registration.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l15-u023-learner-registration-controller.md

## G2-15-023-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy row learnerId, seasonId, choice, consentVersion, consentAt, source, timestamps. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementRegistration.java:25-53`
- vNext now: vNext UUID membershipId+cohortId+collegeId and recordedBy, version and timestamps. `src/db/schema/placement-registration.ts:22-44`
- Fix: Map season registration to academic cohort UUID; preserve source.

## G2-15-023-051  [P1] GAP  facet F22  effort M
- Legacy: Legacy integer LearnerId/seasonId, nullable consent/source fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementRegistration.java:25-53`
- vNext now: vNext UUID member/cohort/college and CHECK consent, actor/source. `src/db/schema/placement-registration.ts:22-70`
- Fix: Migrate primary/FK and legacy stale consent.
