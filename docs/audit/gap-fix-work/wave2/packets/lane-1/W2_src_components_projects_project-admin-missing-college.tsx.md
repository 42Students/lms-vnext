# Work packet (wave 2): edit src/components/projects/project-admin-missing-college.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md

## G2-7-001-038  [P2] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:280-290: no college -> specific yellow warning.
- vNext now: V/app/(authenticated)/college/projects/at-risk/page.tsx:20-22; components/projects/project-admin-missing-college.tsx:7-10: generic workspace empty state.
- Fix: Restore page-scoped warning exactly.
