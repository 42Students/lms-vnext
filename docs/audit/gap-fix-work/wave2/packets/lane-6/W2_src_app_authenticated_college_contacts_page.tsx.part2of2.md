# Work packet (wave 2): edit src/app/(authenticated)/college/contacts/page.tsx (part 2 of 2)

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-1/user-controller.md, docs/audit/gap2/lane-8/college-admin-people.md

## G2-8-003-033  [P2] GAP  facet F13  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:180-223`: distinct load error, no contacts, no search match and guidance
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:209-213`: single empty state; admin directory `page.tsx:120,143` no matching users
- Fix: Restore differentiated empty vs filtered empty vs error and exact instructions

## G2-8-003-038  [P2] GAP  facet F17  effort S
- Legacy: `.../components/contacts/ContactsGrid.js:35-43,264-279`: named avatar alt and pagination aria-label Previous/Next page
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:211-245`: caption and Pagination label; no avatar
- Fix: Ensure screenreader equivalent for avatar and mobile nav, with visible focus

## G2-8-003-039  [P2] GAP  facet F18  effort S
- Legacy: `.../PeopleDirectory.js:27-33`: title `People Directory`, subtitle exact read-only contact lookup; three actions
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:41-43`, `admin/people/directory/page.tsx:60-65`: different descriptions and action treatment
- Fix: Restore exact catalogue text and visible management links

## G2-1-008-012  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:146-149`: TeamOutlined count badge and dash during load.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:207-208`: plain total plus page-local role counts.
- Fix: Restore count-pill icon/placeholder in toolbar.

## G2-1-008-014  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:150-157`: SearchOutlined prefix; allowClear.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:60-64`: search input without icon or clear affordance.
- Fix: Restore search icon and clear input action.

## G2-1-008-024  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:464-470`: negative page clamps 0 and overflow clamps last.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:36-39`,`src/modules/people/college-contacts-model.ts:37-38`: overshoot redirects last, page below 1 rejected.
- Fix: Handle bookmarked 0/negative values without unhelpful generic error.

## G2-1-008-026  [P3] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:167-178`: 10/20/50 page-size options; hide on single page.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:186-188`,`src/app/(authenticated)/college/contacts/page.tsx:237-242`: 10/20/50 plus saved 25; controls always present.
- Fix: Match page-size selector/hide-one-page state or justify added saved value.

## G2-1-008-072  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:49-68`: photo alt name; fallback initials aria-hidden.
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:215-217`: linked name no image; `src/app/(authenticated)/college/contacts/page.tsx:65`: filter form aria label.
- Fix: Add accessible avatar alt/fallback and screen-reader contact metadata.

## G2-1-008-081  [P3] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:32-37`,`docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:62-69`: stable tinted initials avatar, blank name becomes `?`.
- vNext now: `src/modules/people/college-contacts-service.ts:95-97`,`src/app/(authenticated)/college/contacts/page.tsx:215-217`: name fallback `Unnamed person` without avatar.
- Fix: Implement deterministic tint and character fallback across very long names.

## G2-8-001-043  [P3] GAP  facet F18  effort S
- Legacy: `components/contacts/ContactsGrid.js:152`: search placeholder has trailing three dots
- vNext now: `app/(authenticated)/college/contacts/page.tsx:62`: `Search contacts` without ellipsis
- Fix: Use exact `Search contacts...` placeholder

## G2-8-001-046  [P3] GAP  facet F20  effort S
- Legacy: `components/contacts/ContactsGrid.js:64-66`: tint seed depends on record.id/email/name; output deterministic
- vNext now: `app/(authenticated)/college/contacts/page.tsx:214-218`: no avatar; no tint seed
- Fix: Recreate deterministic palette with stable membership seed

## G2-8-003-040  [P3] GAP  facet F18  effort S
- Legacy: `.../PeopleDirectory.js:44-46`: tab labels All contacts, Faculty, Students
- vNext now: `src/app/(authenticated)/college/contacts/page.tsx:46-48`: Faculty contacts, Student contacts; admin directory matches
- Fix: Match two changed College Admin tab strings
