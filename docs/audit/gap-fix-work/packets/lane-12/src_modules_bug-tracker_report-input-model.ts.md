# Work packet: edit src/modules/bug-tracker/report-input-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u002-tracker-report.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-16-002-032  [P2] GAP  facet F07  effort M
- Legacy: `index.js:263-276,279-285,290-291,305-307`: exact required errors reporter/account/environment/location/type/description.
- vNext now: `report-input-model.ts:7-18,20-36`: many same strings, but `tracker-report-form.tsx:75-77,246` shows only first error in page notice.
- Fix: Show each invalid field error at its control, retaining exact legacy text and global summary only when needed.

## G2-16-002-034  [P2] GAP  facet F07  effort S
- Legacy: `index.js:325`: long evidence link error `Evidence link is too long.`.
- vNext now: `report-input-model.ts:19`: Zod URL union has no explicit field error label.
- Fix: Use explicit max(1000, `Evidence link is too long.`) with displayed field-level error.

## G2-4-021-026  [P2] GAP  facet F07  effort M
- Legacy: Legacy free-text screen/section optionally blank; invalid hierarchy controlled frontend. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/bugtracker/BugReportCreateRequest.java:15-20`)
- vNext now: New enforces page/screen/section nested LOCATION_OPTIONS. (`src/modules/bug-tracker/report-input-model.ts:20-36`)
- Fix: Map historical pages not in fixed LOCATION_OPTIONS without data loss.
