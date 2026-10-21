# Work packet: edit src/app/api/tpo/verification/review/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-033  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:395-405`: verify transitions VERIFIED and sends notification.
- vNext now: `src/app/api/tpo/verification/review/route.ts:25-26`: decision payload status/version returned.
- Fix: Ensure reviewer success toast distinguishes Education from Identity.

## G2-1-010-034  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:417-425`: sent back returns SENT_BACK or VERIFIED when an update was sent back.
- vNext now: `src/app/api/tpo/verification/review/route.ts:25-26`: returns new status version.
- Fix: Toast should explicitly explain old verified snapshot stays authoritative.
