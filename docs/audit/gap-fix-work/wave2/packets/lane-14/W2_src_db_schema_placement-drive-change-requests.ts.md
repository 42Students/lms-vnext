# Work packet (wave 2): edit src/db/schema/placement-drive-change-requests.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u025-recruiter-change-request-controller.md, docs/audit/gap2/lane-5/u023-tpo-change-request-controller.md

## G2-16-025-010  [P2] GAP  facet F04  effort M
- Legacy: RecruiterChangeRequestController.java:60-82 accepted statuses ACCEPTED/ANSWERED/REPLIED/WITHDRAWN.
- vNext now: placement-drive-change-requests.ts:28 lists ACCEPTED/ANSWERED/DECLINED/WITHDRAWN.
- Fix: Translate legacy REPLIED decline to DECLINED for rendering/reporting.

## G2-5-023-064  [P2] GAP  facet F22  effort L
- Legacy: Legacy DRIVE Team thread uses thread/message/member/mention tables and read state. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:215-269`
- vNext now: vNext uses new per-change-request message table (sender party,user,body,sentAt), without canonical Team integration. `src/db/schema/placement-drive-change-requests.ts:32-43`
- Fix: Bridge to canonical drive thread or explicitly define parallel-store retention/visibility.
