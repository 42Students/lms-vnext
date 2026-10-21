# Work packet: edit src/app/(authenticated)/college/placements/retention/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-116  [P1] GAP  facet F10  effort M
- Legacy: GET retention report olderThanDays default365, read-only `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:951-969`
- vNext now: New retention UI fixed 180+ days `src/app/(authenticated)/college/placements/retention/page.tsx:18-27`
- Fix: Restore configurable 365-day default or document approved retention threshold change

## G2-2-016-166  [P1] GAP  facet F23  effort L
- Legacy: Old retention accepts olderThanDays param (default365) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:951-969`
- vNext now: New fixed report 180+ days and newest200 cap without parameter `src/app/(authenticated)/college/placements/retention/page.tsx:19-27`
- Fix: Make threshold configurable and page complete history instead of fixed 180
