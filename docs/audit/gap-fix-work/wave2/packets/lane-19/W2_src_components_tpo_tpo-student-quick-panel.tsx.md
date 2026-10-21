# Work packet (wave 2): edit src/components/tpo/tpo-student-quick-panel.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/tpo-students.md

## G2-14-001-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy panel has raw contact email/phone with copy and mailto/tel; vNext only masked last four and email export-only — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:344-359`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:62-83`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:113-133`; `src/components/tpo/tpo-students-spreadsheet.tsx:47,96`
- Fix: Add authorized contact reveal/copy while honoring vNext masking policy

## G2-14-001-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy prep assignment completion percentage in Profile; vNext renders Prep % Not recorded — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:267-294`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoStudentsReadService.java:268-280`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:113-133`
- Fix: Derive prep completion from assignments and completed lessons

## G2-14-001-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy academic marks display entered/conversion and Verified tag per level; vNext flat CGPA/PG/marks without converted provenance — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:310-345`
- vNext now: `src/components/tpo/tpo-students-spreadsheet.tsx:64-73`; `src/components/tpo/tpo-student-quick-panel.tsx:113-133`
- Fix: Add 10th/12th/Diploma/UG/PG mark rows with verified/converted notes and tooltips

## G2-14-001-036  [P2] GAP  facet F09  effort S
- Legacy: Legacy drawer title name · roll and program/class/batch; vNext Student panel for name, branch/batch subtitle — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:86-105,251-262`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:86-98`
- Fix: Restore title and three context tokens, class fallback

## G2-14-001-037  [P2] GAP  facet F09  effort M
- Legacy: Legacy Applications/Offers/Profile/Prep metric buttons navigate tabs; vNext flat facts but lacks tab-jump metrics — `docs/legacy-source/frontend/src/components/tpo/StudentPanel.js:267-294`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:108-148`
- Fix: Add clickable metric buttons in hero area

## G2-14-001-068  [P2] GAP  facet F20  effort M
- Legacy: Legacy Prev/Next across filtered shown students; vNext within visible current page — `docs/legacy-source/frontend/src/pages/tpo/students/index.js:242-243,278-281`
- vNext now: `src/components/tpo/tpo-student-quick-panel.tsx:70-93`
- Fix: Support cross-page scoped next/previous navigation
