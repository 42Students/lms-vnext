# Work packet (wave 2): edit src/app/(authenticated)/college/placements/retention/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md

## G2-2-016-148  [P2] GAP  facet F18  effort S
- Legacy: Legacy retention report `Data retention report retrieved` and default 365 days `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:953-965`
- vNext now: New heading `Data retention report`, fixed 180+ days `src/app/(authenticated)/college/placements/retention/page.tsx:19-25`
- Fix: Display threshold and align reporting copy with legacy default
