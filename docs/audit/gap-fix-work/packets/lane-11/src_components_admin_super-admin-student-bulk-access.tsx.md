# Work packet: edit src/components/admin/super-admin-student-bulk-access.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-19/superadmin-students.md

## G2-14-002-028  [P1] GAP  facet F05  effort L
- Legacy: Legacy select preserved across pagination and unlimited matching selected; vNext first100 shown, max25 — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1524-1583`
- vNext now: `src/components/admin/super-admin-student-bulk-access.tsx:9-19,41-54`
- Fix: Preserve selected IDs across pages and allow all filtered permitted students

## G2-19-001-020  [P1] GAP  facet F05  effort M
- Legacy: Legacy page selection preserved across filtering/pagination `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1578-1583`
- vNext now: vNext cap at 25 selected current-page entries, no selection across pages `src/components/admin/super-admin-student-bulk-access.tsx:16`,43-55
- Fix: Implement durable ID selection across paginated search results and full selection count.

## G2-19-001-054  [P1] GAP  facet F11  effort M
- Legacy: Legacy impersonate/module-access only for superadmin (loginUser id 0 + FACULTY), while other roster actions shown `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:52-56`,600-603,1008-1027
- vNext now: vNext all page gated isSuperAdmin, module access inside page with selected college `src/app/(authenticated)/admin/students/page.tsx:24-30`,82-90; `src/components/admin/super-admin-student-bulk-access.tsx:41-74`
- Fix: Check role identification parity and ensure privileged extras remain narrower than ordinary learner management.

## G2-19-001-092  [P1] GAP  facet F23  effort L
- Legacy: Legacy bulk toggle offers Placements and Projects `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1534-1543`
- vNext now: vNext intentionally offers Projects and Electives; explicitly notes Placements configured at college scope `src/components/admin/super-admin-student-bulk-access.tsx:12-14`,41-44,58-64
- Fix: Owner decision needed: preserve historic per-student Placement override or supply safe college-scope migration/message.
