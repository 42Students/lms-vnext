# Work packet: edit src/app/(authenticated)/tpo/recruiters/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md

## G2-19-022-103  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:184-188 manual stage allowlist NEW, CONTACTED, NOT_NOW; NOT_NOW reason mandatory
- vNext now: src/app/(authenticated)/tpo/recruiters/page.tsx:14-28 stage URL query and src/app/api/placements/tpo/bulk-actions/preview/route.ts:14-29 generic action data
- Fix: Mirror manual stage transition guard and reason/revisit validation
