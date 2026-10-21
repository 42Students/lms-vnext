# Work packet (wave 2): edit src/modules/people/college-contacts-model.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-1-008-022  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:436-438`: pageNumber 0-based defaults 0; pageSize default 5.
- vNext now: `src/modules/people/college-contacts-model.ts:36-39`: page 1-based defaults 1, size 20.
- Fix: Document conversion and migration of saved page links.

## G2-1-008-023  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:453-455`: pageSize <=0 quietly reset to 5.
- vNext now: `src/modules/people/college-contacts-model.ts:6-10`,`src/modules/people/college-contacts-model.ts:37-38`: strict decimal validation, sizes 10/20/25/50.
- Fix: Provide explicit invalid-size guidance instead of silent fallback.

## G2-1-008-028  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:13-22`: lowercase view=all/faculty/students, shallow router replace.
- vNext now: `src/modules/people/college-contacts-model.ts:11-12`,`src/modules/people/college-contacts-model.ts:114-117`: uppercase typed tab and navigated href resetting page.
- Fix: Canonicalize legacy view param and preserve compatible filters.

## G2-1-008-062  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/UserServiceImpl.java:94-130`: `student`/`learner` aliases; otherwise faculty followed by learner.
- vNext now: `src/modules/people/college-contacts-model.ts:12`,`src/modules/people/college-contacts-service.ts:38-39`: typed STUDENT/FACULTY/ALL and coalesced roles.
- Fix: Map old learner alias and explain merged dual-role row count.

## G2-8-001-014  [P2] GAP  facet F05  effort S
- Legacy: `components/contacts/ContactsGrid.js:80-93,164-175`: 0-based page, default 10, size options 10/20/50; page hidden when single
- vNext now: `modules/people/college-contacts-model.ts:3,37-39` default 20 with 10/20/25/50 allowed; `page.tsx:186-190`
- Fix: Default to 10 and show 10/20/50; consider the 25 saved-view option only as a separate nonlegacy extension

## G2-8-001-020  [P2] GAP  facet F06  effort M
- Legacy: `pages/superadmin/sections/PeopleDirectory.js:27-39`: tabs keys all/faculty/students; query `view`, shallow router.replace
- vNext now: `modules/people/college-contacts-model.ts:11-13,115-118`: query `tab=ALL/FACULTY/STUDENT` with full URL navigation
- Fix: Recognize/migrate legacy `?view=` bookmarks and preserve shallow-feeling navigation on tabs

## G2-8-003-002  [P2] GAP  facet F01  effort S
- Legacy: `.../PeopleDirectory.js:16-21`: `?view=` preserved via shallow router.replace
- vNext now: `src/modules/people/college-contacts-model.ts:11-13,115-118` and `admin-user-directory-model.ts:3-4,13-21`: both use `?tab=` keys
- Fix: Support legacy view bookmark alias on both routes, normalize one canonical URL

## G2-8-003-014  [P2] GAP  facet F05  effort M
- Legacy: `.../components/contacts/ContactsGrid.js:80-93,164-177`: initial 10 rows, 10/20/50 page-size choices
- vNext now: `src/modules/people/college-contacts-model.ts:3,37-39`: 20 default; admin `admin-user-directory-model.ts:12` fixed 30
- Fix: Use common 10-default 10/20/50 pagination across both role variants

## G2-8-003-018  [P2] GAP  facet F06  effort M
- Legacy: `.../PeopleDirectory.js:13-22`: unknown `?view=` falls back to All, preserves other query keys, shallow replaces
- vNext now: `src/modules/people/college-contacts-model.ts:94-106`: strict query rejecting unknown keys; admin `directory/page.tsx:27-37` rejects unknown keys
- Fix: Accept legacy query names then redirect canonically, reject only malformed unsafe values

## G2-8-003-042  [P2] GAP  facet F20  effort S
- Legacy: `.../PeopleDirectory.js:13-14`: repeated view query uses first element; unrecognized view all
- vNext now: `src/modules/people/college-contacts-model.ts:94-106`: repeated query invalid; admin page `:27-37` rejects
- Fix: Normalize harmless legacy repeats as appropriate; never accept forged unsafe filter fields

## G2-1-008-024  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:464-470`: negative page clamps 0 and overflow clamps last.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:36-39`,`src/modules/people/college-contacts-model.ts:37-38`: overshoot redirects last, page below 1 rejected.
- Fix: Handle bookmarked 0/negative values without unhelpful generic error.

## G2-1-008-034  [P3] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/PeopleDirectory.js:13-14`: view query only all/faculty/students with all default.
- vNext now: `src/modules/people/college-contacts-model.ts:11-12`: strict ALL/FACULTY/STUDENT tab default ALL.
- Fix: Redirect old bookmarked tab casing and query name to new URLs.
