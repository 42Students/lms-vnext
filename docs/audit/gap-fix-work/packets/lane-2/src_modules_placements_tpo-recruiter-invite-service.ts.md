# Work packet: edit src/modules/placements/tpo-recruiter-invite-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md

## G2-14-022-008  [P1] GAP  facet F03  effort M
- Legacy: Legacy invite may optionally email and returns emailAvailable/emailed `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:158-165` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:297-312`
- vNext now: New issue service creates link with emailed false and separate email dispatcher `src/modules/placements/tpo-recruiter-invite-service.ts:83-175`
- Fix: Preserve invite sendEmail option and true delivery receipt safely

## G2-14-022-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy invite link base sourced from Origin approved LMS domains `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:160-164`
- vNext now: New server-generated credential link, delivery via separate service `src/modules/placements/tpo-recruiter-invite-service.ts:83-175`
- Fix: Validate absolute origin/host allowlist and use canonical college URL

## G2-14-022-049  [P1] GAP  facet F15  effort M
- Legacy: Legacy invite optional Zepto mail recruiter-invite and activity log only on success `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:299-313`
- vNext now: New issue returns emailed false and separate dispatch tracks delivery `src/modules/placements/tpo-recruiter-invite-service.ts:158-175`
- Fix: Ensure requested email delivery and accurate one-time receipt

## G2-14-022-028  [P2] GAP  facet F08  effort M
- Legacy: Legacy invite response includes token,emailAvailable,emailed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:299-313`
- vNext now: New issue output link credential/emailAvailable emailed false `src/modules/placements/tpo-recruiter-invite-service.ts:168-175`
- Fix: Display actual sent status only after provider accepted
