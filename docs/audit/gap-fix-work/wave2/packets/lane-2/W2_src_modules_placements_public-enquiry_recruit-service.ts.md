# Work packet (wave 2): edit src/modules/placements/public-enquiry/recruit-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-047  [P2] GAP  facet F10  effort S
- Legacy: Bell body uses company/email with source. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:144`
- vNext now: Notification generic company contact body. `src/modules/placements/public-enquiry/recruit-service.ts:101`
- Fix: Exact bell preview.

## G2-11-001-077  [P2] GAP  facet F22  effort M
- Legacy: Legacy code table recruiter_invite_code with hashed token/code and wrong_tries. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:82`
- vNext now: vNext placement_public_enquiry_challenges separate. `src/modules/placements/public-enquiry/recruit-service.ts:7`
- Fix: Migrate or deliberately invalidate pending 10min codes.

## G2-4-026-047  [P2] GAP  facet F10  effort M
- Legacy: Existing lead reused; phone adds details; note added to `Asked to recruit...` activity (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:139-145`)
- vNext now: Enquiry stored; lead add-on-conflict, fixed generic system note (`src/modules/placements/public-enquiry/recruit-service.ts:65-82`)
- Fix: Include recruiter's actual hiring note in TPO activity feed with redaction safety.

## G2-4-026-063  [P2] GAP  facet F15  effort M
- Legacy: TPO bell `RECRUIT_FROM_US` with person/company email and recipient college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:143-146`)
- vNext now: Activity event + in-app notifications for active TPO users (`src/modules/placements/public-enquiry/recruit-service.ts:83-102`)
- Fix: Match title/body content including company; confirm audience and notification persistence.
