# Work packet (wave 2): edit src/modules/people/college-student-csv-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u027-learner-controller.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-5-027-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy bulk request requires college,program,class and learners, max 500. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkRegisterRequest.java:20-34`
- vNext now: vNext CSV supports 500 rows, 1MB, and program/cohort/optional section as pickers. `src/modules/people/college-student-csv-model.ts:4-31`, `src/components/college/college-student-csv-import.tsx:60-65`
- Fix: Maintain template field compatibility and explain class optionality.

## G2-7-036-020  [P2] GAP  facet F06  effort S
- Legacy: bulkCsvParse.js:49-54 requires header and data row
- vNext now: college-student-csv-model.ts:67-86 strict accepted legacy/canonical header and max500
- Fix: Match structural error wording for absent header/data

## G2-7-036-022  [P2] GAP  facet F06  effort S
- Legacy: bulkCsvParse.js:62-70 cap and exact source-row column count error
- vNext now: college-student-csv-model.ts:85-93 cap500, COLUMN_COUNT_MISMATCH token
- Fix: Show exact record number and mismatch size

## G2-7-036-073  [P2] GAP  facet F20  effort S
- Legacy: bulkCsvParse.js:25-27 permits whitespace after closing quote
- vNext now: college-student-csv-model.ts:57 rejects any char after quote
- Fix: Align valid trailing whitespace behavior or document stricter policy
