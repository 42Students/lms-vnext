# Work packet (wave 2): edit src/modules/people/admin-user-directory-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md, docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-8/superadmin-people.md

## G2-15-013-025  [P2] MISSING  facet F06  effort M
- Legacy: Popular uses optional collegeId and default limit10. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:144-149`)
- vNext now: Admin UI has q/role/status/page, no popular option. (`src/modules/people/admin-user-directory-model.ts:3-11`)
- Fix: Offer popularity filter or typed popular API with college scope.

## G2-8-003-002  [P2] GAP  facet F01  effort S
- Legacy: `.../PeopleDirectory.js:16-21`: `?view=` preserved via shallow router.replace
- vNext now: `src/modules/people/college-contacts-model.ts:11-13,115-118` and `admin-user-directory-model.ts:3-4,13-21`: both use `?tab=` keys
- Fix: Support legacy view bookmark alias on both routes, normalize one canonical URL

## G2-8-003-014  [P2] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:80-93,164-177`: initial 10 rows, 10/20/50 page-size choices
- vNext now: `src/modules/people/college-contacts-model.ts:3,37-39`: 20 default; admin `admin-user-directory-model.ts:12` fixed 30
- Fix: Use common 10-default 10/20/50 pagination across both role variants

## G2-8-002-012  [P2] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:78-93,164-177`: default page size 10, options 10/20/50, AntD pagination
- vNext now: `src/modules/people/admin-user-directory-model.ts:12,42-45`: fixed 30 per page, no changer (`directory/page.tsx:115-145`)
- Fix: Match 10 default and allow 10/20/50 selectable page sizes if feature parity required

## G2-8-002-016  [P2] GAP  facet F06  effort S
- Legacy: `.../superadmin/sections/PeopleDirectory.js:15-22`: query `view=all/faculty/students` via shallow replace
- vNext now: `src/modules/people/admin-user-directory-model.ts:3-11,13-21`: `tab=ALL/FACULTY/STUDENT` full GET URLs
- Fix: Accept/redirect legacy `?view=` bookmarks without losing tab selection
