# Work packet: edit src/app/api/tracker/issues/[publicId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/bug-report-activity.md, docs/audit/gap2/lane-6/l11-u026-public-bug-tracker-controller.md

## G2-3-021-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:58-62`, `docs/legacy-source/frontend/src/pages/tracker/issues/[issueId].js:45-52`
- vNext now: `src/app/api/tracker/issues/[publicId]/route.ts:10-34`, `src/modules/bug-tracker/admin-service.ts:209-289`
- Fix: Legacy public activity GET by issue publicId is readable on issue detail, while vNext issue activity fetch requires super-admin. Add a privacy-filtered, authenticated reporter-owned history read without making engineering notes public.

## G2-3-021-021  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicBugTrackerController.java:54-62`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminBugTrackerController.java:75-80`
- vNext now: `src/app/api/tracker/issues/[publicId]/route.ts:20-34`, `src/modules/bug-tracker/reporter-service.ts:27-46`
- Fix: Legacy public issue activity route had anonymous read access, vNext restricts engineering history to super-admin. Define safe public/reporter exposure; never leak private root cause, evidence or actor IDs.

## G2-11-026-002  [P1] MISSING  facet F01  effort M
- Legacy: Seven public issue operations POST/GET issues, GET detail/activity, POST presign/confirm, GET attachments (PublicBugTrackerController.java:31-82).
- vNext now: GET/POST issues + GET detail only under /api/tracker/issues; no equivalent activity/attachment public paths (src/app/api/tracker/issues/route.ts:12-51; issues/[publicId]/route.ts:10-36).
- Fix: Define authorized reporter-facing equivalents for activity and screenshot presign/confirm/list.
