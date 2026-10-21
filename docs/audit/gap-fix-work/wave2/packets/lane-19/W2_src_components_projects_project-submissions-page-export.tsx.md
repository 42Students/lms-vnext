# Work packet (wave 2): edit src/components/projects/project-submissions-page-export.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-046  [P2] GAP  facet F14  effort M
- Legacy: CSV button Export displayed page CSV, headers currently visible tab, file per displayed page. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:733-799`)
- vNext now: Export CSV button uses client-generated `project-submissions-page.csv`, active submit page only. (`src/components/projects/project-submissions-page-export.tsx:18-34`)
- Fix: Match both submitted and not-submitted tab CSV schemas and filename per legacy.

## G2-4-006-055  [P2] GAP  facet F18  effort M
- Legacy: Button `Open`, `Review`, `Reassign mentor`, export `Export displayed page CSV`. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:379-399;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:737-800`)
- vNext now: `Open · Review submission`, `Review`, `Assign mentor` and `Export CSV`. (`src/components/projects/project-admin-submissions-page.tsx:275-288;src/components/projects/project-submissions-page-export.tsx:32-34`)
- Fix: Restore exact visible labels.

## G2-4-009-046  [P2] GAP  facet F14  effort M
- Legacy: Header `Export CSV` output from Submitted is `project-submissions.csv`, four headers Workspace, Submission type, Review status, Submitted at. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:739-760`)
- vNext now: New `project-submissions-page.csv` with 10 headers Workspace...Version. (`src/components/projects/project-submissions-page-export.tsx:18-34`)
- Fix: Match legacy filename and column order; optionally offer enriched separate export.

## G2-4-009-056  [P2] GAP  facet F18  effort M
- Legacy: Buttons `Open`, `Review`, `Reassign mentor`, `Export CSV`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:355-373;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:705-760`)
- vNext now: `Open · Review submission`, `Review`, `Assign mentor` or `Reassign mentor`, `Export CSV`. (`src/components/projects/project-admin-submissions-page.tsx:275-288;src/components/projects/project-submissions-page-export.tsx:32-34`)
- Fix: Match old action vocabulary and icon placement.
