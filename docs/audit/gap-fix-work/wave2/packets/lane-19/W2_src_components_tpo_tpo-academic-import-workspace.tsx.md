# Work packet (wave 2): edit src/components/tpo/tpo-academic-import-workspace.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-035  [P2] GAP  facet F09  effort M
- Legacy: Legacy import width820 modal with discard changes prompt; vNext inline import section and confirm Dialog — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:298-307`; `docs/legacy-source/frontend/src/components/tpo/ImportPreviewModal.js:21-35`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:101-109,173-179`
- Fix: Use actual modal, preserve unsaved-file discard guard

## G2-14-001-048  [P2] GAP  facet F12  effort M
- Legacy: Legacy importer refuses unresolved unmatched rows; vNext excludes unmatched automatically at Preview — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:585-590`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:70-93`
- Fix: Require explicit Skip row acknowledgment before import, report skipped rows

## G2-14-001-052  [P2] GAP  facet F14  effort L
- Legacy: Legacy .xlsx/.csv 5000 row academic import; vNext CSV only 200 rows — `docs/legacy-source/frontend/src/components/tpo/ImportPreviewModal.js:65-90`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:37-49,125-126`; `src/modules/placements/tpo-academic-preview-import-model.ts:32-36`
- Fix: Implement XLSX reader and chunked 5000-row processing

## G2-14-001-053  [P2] GAP  facet F14  effort S
- Legacy: Legacy template roll,cgpa,tenthPct,twelfthPct,ugPct,gapYears,passingYear,batch; vNext studentCode,cgpa,activeBacklogs — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:298-306`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:120-124`
- Fix: Restore old template fields and example row

## G2-14-001-054  [P2] GAP  facet F14  effort M
- Legacy: Legacy matching preview tabs Will update/Can't match and per-field diff; vNext one Include table with CGPA and backlogs only — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:298-306`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:549-561`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:137-171`
- Fix: Render matching/unmatched tabs, field diffs, and explicit skip

## G2-14-001-065  [P2] GAP  facet F18  effort S
- Legacy: Legacy academic help explains roll matching and semester uses; vNext says membership ID and CGPA/backlogs — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:298-301`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:110-118`
- Fix: Restore help text after reworking import contract

## G2-14-001-069  [P2] GAP  facet F20  effort M
- Legacy: Legacy unmatched rows block commit until manually skipped; vNext automatic skipUnmatched on IMPORT — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:585-590`
- vNext now: `src/components/tpo/tpo-academic-import-workspace.tsx:51-56,70-93`
- Fix: Require explicit user resolution for unmatched before submit
