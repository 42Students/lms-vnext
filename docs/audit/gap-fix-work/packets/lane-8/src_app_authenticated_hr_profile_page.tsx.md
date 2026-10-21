# Work packet: edit src/app/(authenticated)/hr/profile/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md, docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-1-035-055  [P1] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:126-141: 'We couldn't load your profile' Result warning and Retry.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:16-19: server throws; no explicit in-page retry.
- Fix: Return recoverable error UI with same Retry.

## G2-10-025-055  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:137-141 — Scoped /me must show only selected-college grant.
- vNext now: src/modules/placements/recruiter-profile-service.ts:65-67; src/app/(authenticated)/hr/profile/page.tsx:112-120 — New self profile returns all context grants.
- Fix: Restrict scoped view to selected grant or explicit safe global mode

## G2-10-025-032  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:241-244 — Email change returns EMAIL_LOCKED + 'Your work email is how you sign in...'
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:40-45 — UI explanatory text but no attempted email mutation path.
- Fix: Keep exact error in any API adapter
