# Work packet: edit src/modules/people/faculty-bulk-import-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-6-001-047  [P1] GAP  facet F12  effort M
- Legacy: Old bulk faculty type permits only `LECTURER` or `MENTOR` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:659-668` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:264-277`
- vNext now: New parser omits faculty-type column and imports FACULTY role `src/modules/people/faculty-bulk-import-model.ts:8-36` `src/modules/people/faculty-bulk-import-service.ts:34-39`
- Fix: Preserve faculty type CSV column and restricted permissible values

## G2-6-002-041  [P1] GAP  facet F07  effort M
- Legacy: Old CSV validation lists row-level `Duplicate mobile in file`, `Email already in system`, malformed email etc `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:659-683`
- vNext now: New CSV parser stops with generic invalid-row error or imports direct `src/modules/people/faculty-bulk-import-model.ts:25-35` `src/components/admin/super-admin-faculty-bulk-import.tsx:26-28`
- Fix: Present independently actionable row issue messages before creating identities

## G2-6-002-060  [P1] GAP  facet F12  effort M
- Legacy: Old bulk accepts 500 rows and faculty type only Lecturer or Mentor `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:103-104` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:659-668`
- vNext now: New max500 but no faculty type in parser `src/modules/people/faculty-bulk-import-model.ts:4-36`
- Fix: Add optional Faculty Type column and enforce allowed bulk subset

## G2-7-036-021  [P1] GAP  facet F06  effort M
- Legacy: bulkCsvParse.js:55-61 case-insensitive headers, duplicate names rejected
- vNext now: faculty-bulk-import-model.ts:15-25 aliases firstName/phone, no duplicate check
- Fix: Reject duplicate normalized header aliases before data mapping

## G2-7-036-028  [P1] GAP  facet F07  effort M
- Legacy: bulkCsvParse.js:58 CSV contains duplicate column headings.
- vNext now: faculty-bulk-import-model.ts:15-25 no duplicate-alias guard
- Fix: Reject duplicate headers explicitly

## G2-7-036-055  [P1] GAP  facet F14  effort M
- Legacy: Faculty.js:593-601 Faculty Type included in required CSV header
- vNext now: faculty-bulk-import-model.ts:18-23 only name/mobile/email mapping
- Fix: Map legacy faculty role type rather than silently dropping it

## G2-7-036-080  [P1] GAP  facet F22  effort L
- Legacy: Faculty.js:595-601 faculty_type plus college/department
- vNext now: faculty-bulk-import-model.ts:4-9 no role or department fields
- Fix: Map role and department assignments to persisted memberships

## G2-7-036-029  [P2] GAP  facet F07  effort S
- Legacy: bulkCsvParse.js:61 Required columns missing: ... Found: ...
- vNext now: faculty-bulk-import-model.ts:24-39 inferred header and generic invalid row error
- Fix: Show named missing columns and found headers
