# Work packet (wave 2): edit src/app/api/public/campaign-unsubscribe/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u014-email-suppression-repository.md, docs/audit/gap2/lane-10/public-campaign-unsubscribe-controller.md, docs/audit/gap2/lane-17/email-suppression-entity.md

## G2-18-014-015  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:8 — JpaRepository.save persists email suppression by raw email primary key.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:42-46 — INSERT recipient_hash/reason='UNSUBSCRIBED' ON CONFLICT active do nothing.
- Fix: Preserve idempotent global opt-out on every repeated token and address.

## G2-18-014-038  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:346-354 — invited recruiter can opt out of future invitations and reminders.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:25-47 — separate public token unsubscribe for campaign/global flows.
- Fix: Unify invite and campaign email suppression across all producers.

## G2-10-026-003  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:17-17 — Success on original page without URL change.
- vNext now: src/app/campaign-unsubscribe/confirmed/page.tsx:6-20; src/app/api/public/campaign-unsubscribe/route.ts:28-29 — 303 redirects to /campaign-unsubscribe/confirmed.
- Fix: Preserve same-page success state where legacy links expect it.

## G2-10-026-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:126-129 — Blank/over200 token ignored, no error.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:22-25; src/modules/placements/public-unsubscribe-preview-service.ts:8-20 — Bound2048 and signed-token validity.
- Fix: Specify grandfathering policy for old tokens.

## G2-17-015-019  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:7-9 — Repository CRUD against global email_norm PK.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:36-47 — Public global token inserts HMAC with reason UNSUBSCRIBED, no plaintext.
- Fix: Backfill old plaintext suppressions via one-time secure migration; do not expose addresses.

## G2-17-015-021  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/campaign-unsubscribe/[token].js:23-27 — Unsubscribe calls API on button; state becomes done or error.
- vNext now: src/app/api/public/campaign-unsubscribe/route.ts:10-47 — POST token validates, DB updates, 303 redirect.
- Fix: Align success/error and history navigation behavior.
