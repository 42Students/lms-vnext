# Work packet: edit src/components/tpo/recruiter-invite-landing.tsx (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-030  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:170-182`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:85-93`
- Fix: Legacy exact first-name/mobile error codes and text differ from vNext name/code/mobile single error. Preserve field-specific text and punctuation.

## G2-3-026-033  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/recruiter-invite/[token].js:94-105`
- vNext now: `src/components/tpo/recruiter-invite-landing.tsx:94-109`
- Fix: Legacy distinguishes pending and joined success copy; vNext always transitions to joined and never displays One more step.
