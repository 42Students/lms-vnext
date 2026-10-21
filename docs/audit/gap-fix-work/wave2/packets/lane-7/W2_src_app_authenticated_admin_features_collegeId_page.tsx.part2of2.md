# Work packet (wave 2): edit src/app/(authenticated)/admin/features/[collegeId]/page.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-module-access.md

## G2-10-019-088  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:645-655 — Info copy says Courses & Content always available, individual permissions in Courses.
- vNext now: src/app/(authenticated)/admin/features/[collegeId]/page.tsx:317-330 — New policy notes omit that specific guidance.
- Fix: Use legacy text verbatim.
