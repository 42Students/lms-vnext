# Work packet: edit src/app/(authenticated)/mentor/not-found.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/mentor-course-redirect.md

## G2-12-004-009  [P2] GAP  facet F07  effort S
- Legacy: No validation including invalid/unknown courseId; any segment redirects `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: No dynamic handler so segment yields 404 instead of redirect `src/app/(authenticated)/mentor/not-found.tsx:5-10`
- Fix: Do not reject invalid IDs at bookmark compatibility route

## G2-12-004-010  [P3] GAP  facet F08  effort S
- Legacy: No toast, status, confirmation or success message `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: 404 renders error copy; no success toast `src/app/(authenticated)/mentor/not-found.tsx:7-9`
- Fix: Suppress 404 message for legacy link; don't add toast
