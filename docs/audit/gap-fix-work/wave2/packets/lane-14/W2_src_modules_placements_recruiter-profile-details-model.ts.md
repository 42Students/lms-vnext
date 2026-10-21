# Work packet (wave 2): edit src/modules/placements/recruiter-profile-details-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-15/recruiter.md

## G2-11-031-018  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:170-171: designation maxlength150.
- vNext now: src/modules/placements/recruiter-profile-details-model.ts:6: title max160.
- Fix: Align title 150 cap.

## G2-11-031-019  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:168: recruiter mobile max14.
- vNext now: src/modules/placements/recruiter-profile-details-model.ts:7: schema max20; editor max14.
- Fix: Constrain API and UI to same expected phone characters.

## G2-15-016-011  [P2] GAP  facet F04  effort S
- Legacy: Designation max150. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:50-51`)
- vNext now: New title max160. (`src/modules/placements/recruiter-profile-details-model.ts:6-6`)
- Fix: Decide literal old max150 for recruiter designation editor.

## G2-15-016-022  [P2] GAP  facet F06  effort S
- Legacy: Designation max150 in JPA. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:50-51`)
- vNext now: New title max160. (`src/modules/placements/recruiter-profile-details-model.ts:6-6`)
- Fix: Match old client max length or record intentional limit change.

## G2-15-016-046  [P2] GAP  facet F13  effort M
- Legacy: SuspendedAt nonnull blocks login. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:61-66`)
- vNext now: New 403 feedback Your recruiter access has ended. (`src/modules/placements/recruiter-profile-details-model.ts:24-27`)
- Fix: Differentiate suspended recruiter vs expired college grant.

## G2-15-016-055  [P3] GAP  facet F18  effort S
- Legacy: Suspension reason. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:65-66`)
- vNext now: New 403 generic recruiter access ended. (`src/modules/placements/recruiter-profile-details-model.ts:24-27`)
- Fix: Show sensitive reason only to permitted admin/support.
