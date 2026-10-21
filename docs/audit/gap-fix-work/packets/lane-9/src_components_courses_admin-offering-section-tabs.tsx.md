# Work packet: edit src/components/courses/admin-offering-section-tabs.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-006  [P1] GAP  facet F02  effort M
- Legacy: Legacy tab content switches single Home or Syllabus pane `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:29-46` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:172-179`
- vNext now: vNext renders both sections one after another and tabs anchor scroll only `src/components/courses/admin-offering-section-tabs.tsx:14-32` `src/components/courses/admin-offering-learning-page.tsx:82-105`
- Fix: Render mutually exclusive panels or approved legacy-equivalent tab display.
