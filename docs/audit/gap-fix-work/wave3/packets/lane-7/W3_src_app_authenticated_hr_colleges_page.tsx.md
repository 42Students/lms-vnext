# Work packet (wave 3): edit src/app/(authenticated)/hr/colleges/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-003  [P1] MISSING  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — GET /colleges dedicated recruiter Colleges page.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:1-5 — /hr/colleges redirects /hr/home.
- Fix: Restore dedicated Colleges route and rich per-college cards

## G2-10-025-021  [P1] MISSING  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — Dedicated /colleges list no client search, no pagination.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5 — Retired route redirects, no list.
- Fix: Add list with old fields

## G2-10-025-043  [P1] MISSING  facet F09  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — Dedicated Colleges summary card is navigational.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5 — Retired route, no modal/menu.
- Fix: Restore page and navigation entry

## G2-10-025-050  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — GET /api/v1/recruiter/colleges returns computed richer directory.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5 — No endpoint equivalent page, redirect.
- Fix: Implement own-colleges summary service

## G2-10-025-099  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — Old rich recruiter Colleges endpoint/page.
- vNext now: src/app/(authenticated)/hr/colleges/page.tsx:3-5 — Retired dedicated route redirected to Today.
- Fix: Restore dedicated Colleges page without violating scope
