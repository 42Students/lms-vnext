# Verification packet (P0, do FIRST): 7 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-023-028 [P0] MISSING facet F11
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Company preview refuses until applicant and shows only shared-column subset, excludes readiness/debarments/no-show by construction; LearnerEligibilityController.java:124-138
- Expected fix: Require existing application and server allowlist projection with deny-by-default private fields.

## G2-19-026-027 [P0] GAP facet F12
- Files: (none, new feature)
- Legacy: Old placements marked college-level only, class/learner overrides ignored (service:504-508,576-579)
- Expected fix: Decide intended access policy, align UI validation, resolver enforcement and legacy reference clearly

## G2-16-025-025 [P0] MISSING facet F10
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:154-171 ACCEPT validates and immediately applies proposal to drive.
- Expected fix: Implement field-specific mutation with validation/recheck and atomic job write on accept.

## G2-16-025-026 [P0] MISSING facet F10
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: DriveChangeRequestService.java:173-191 ANSWER validates and applies field value.
- Expected fix: Apply answered change value and persist answerValue; preserve OTHER free-text-only.

## G2-5-023-035 [P0] GAP facet F10
- Files: src/modules/placements/tpo-drive-change-request-service.ts
- Legacy: Legacy Accept and Answer immediately mutate Job title/description/location/type/mode/deadline/pay/eligibility. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:154-191,408-431`
- Expected fix: Implement atomic validated field mutation or explicitly change product parity contract after owner sign-off.

## G2-5-026-002 [P0] MISSING facet F01
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts, src/db/schema/inbound-mail.ts
- Legacy: Legacy inbound routes both recruiter replies and all other mail to Super Admin Inbound mail. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:22-33`
- Expected fix: Implement verified general-mail ingestion into inbound_mail_messages, with provider proof and failure classifications.

## G2-5-026-052 [P0] MISSING facet F23
- Files: src/modules/placements/recruiter-message-email-inbound-service.ts, src/db/schema/inbound-mail.ts
- Legacy: Legacy stores non-conversation and invalid replies for Super Admin. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InboundReplyService.java:84-88,95-123`
- Expected fix: Build all-mail intake and failed-message recovery before declaring feature parity.
