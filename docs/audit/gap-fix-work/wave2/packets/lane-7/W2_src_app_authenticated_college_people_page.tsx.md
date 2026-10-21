# Work packet (wave 2): edit src/app/(authenticated)/college/people/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/college-hidden-student-group.md, docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-14-007-004  [P2] GAP  facet F01  effort S
- Legacy: Legacy redirects to /college-admin/people; vNext /college/people then /college/contacts — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:9-12`
- vNext now: `src/app/(authenticated)/college/people/page.tsx:1-7`
- Fix: Resolve old People destination through /college/people or directly /college/contacts

## G2-14-007-033  [P2] GAP  facet F18  effort S
- Legacy: Legacy target path exactly /college-admin/people, never title Student Group Detail; vNext new path title group.name — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:10-12`
- vNext now: `src/app/(authenticated)/college/people/page.tsx:5-7`; `src/app/(authenticated)/college/groups/[groupId]/page.tsx:84-89`
- Fix: Preserve old target semantics, show new Group title only on canonical new route

## G2-8-001-001  [P2] GAP  facet F01  effort S
- Legacy: `pages/college-admin/people.js:6-11`: `/college-admin/people` via People group tab in `components/admin/AdminGroupShell.jsx:14-29`
- vNext now: `app/(authenticated)/college/people/page.tsx:4-7`: `/college/people` immediately redirects to `/college/contacts`; no intermediate directory landing
- Fix: Retain a direct People Directory route and matching group-tab active state; preserve redirect only as documented alias

## G2-8-003-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:8-14`: reusable for both `/college-admin/people` and `/superadmin/people`; basePath selected by router pathname
- vNext now: `src/app/(authenticated)/college/people/page.tsx:4-7`: redirects to `/college/contacts`; `admin/people/directory/page.tsx:21-25` separate Super Admin page
- Fix: Document shared component replaced by two role-specific implementations; preserve matching navigation for both entry points
