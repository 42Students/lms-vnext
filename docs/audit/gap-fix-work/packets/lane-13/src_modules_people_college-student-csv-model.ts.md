# Work packet: edit src/modules/people/college-student-csv-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-5-027-060  [P1] GAP  facet F14  effort M
- Legacy: Legacy bulk body JSON of up to 500 learner items; no CSV needed. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkRegisterRequest.java:20-34`
- vNext now: vNext CSV/paste headers and 1MB input, 500-row max. `src/components/college/college-student-csv-import.tsx:27-65`, `src/modules/people/college-student-csv-model.ts:29-31`
- Fix: Accept structured JSON or provide deterministic transform for old upload clients.

## G2-7-036-079  [P1] GAP  facet F22  effort L
- Legacy: Students.js:835-847 learner first/last/roll/mobile/mail numeric class/program IDs
- vNext now: college-student-csv-model.ts:17-25 displayName/E164/email/cohortId/sectionId UUID
- Fix: Document identity, class association and uniqueness migration map

## G2-7-036-026  [P2] GAP  facet F07  effort S
- Legacy: bulkCsvParse.js:26 error Unexpected character after quoted field in record N
- vNext now: college-student-csv-model.ts:57 code INVALID_CSV_AFTER_QUOTE
- Fix: Render record number and actionable reason
