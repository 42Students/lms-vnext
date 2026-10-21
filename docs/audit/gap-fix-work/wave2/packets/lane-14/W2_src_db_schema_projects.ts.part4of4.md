# Work packet (wave 2): edit src/db/schema/projects.ts (part 4 of 4)

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md, docs/audit/gap2/lane-4/project-delivery-model.md, docs/audit/gap2/lane-4/project-workspace-model.md

## G2-20-017-046  [P3] GAP  facet F23  effort S
- Legacy: Legacy email/calendar async provider columns retired per code comment `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:138-157`
- vNext now: New stores manually supplied meetingUrl only `src/db/schema/projects.ts:1132`
- Fix: Document intentional calendar auto-sync retirement and show realistic manual-link helper text

## G2-4-018-064  [P3] GAP  facet F18  effort S
- Legacy: Legacy draft status uses Draft with capitalized first letter. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:22-23`)
- vNext now: New enum DRAFT and UI likely humanized. (`src/db/schema/projects.ts:826-829`)
- Fix: Render Draft instead of raw enum token in all pages.

## G2-4-017-013  [P3] GAP  facet F04  effort S
- Legacy: Legacy phase length80 nullable. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:34-35`)
- vNext now: New phase length120 nullable. (`src/db/schema/projects.ts:199-200`)
- Fix: Maintain display truncation/validation for exact legacy label geometry.
