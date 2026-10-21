# Work packet: edit src/app/(authenticated)/college/contacts/error.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/college-admin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-8-001-022  [P2] GAP  facet F07  effort S
- Legacy: `hooks/useContacts.js:29-39`: failure toast title `Couldn't load contacts`, description `Something went wrong on our end. Please refresh the page or try again shortly.`
- vNext now: `app/(authenticated)/college/contacts/error.tsx:7-10`: `Contact directory unavailable` and `No contact records could be loaded. Retry safely or reset filters.`
- Fix: Match legacy error copy or explicitly document safer vNext fallback; keep retry/reset capabilities

## G2-8-001-025  [P2] GAP  facet F08  effort S
- Legacy: `hooks/useContacts.js:31-37`: info notification lower-right, 5-second duration
- vNext now: `app/(authenticated)/college/contacts/error.tsx:7-10`: persistent inline ErrorState, no timed notification
- Fix: Add failure toast with exact title, location, duration while keeping recovery block

## G2-8-003-022  [P2] GAP  facet F07  effort S
- Legacy: `.../hooks/useContacts.js:31-39`: load failure toast exact title `Couldn't load contacts`; inline failed state in ContactsGrid
- vNext now: `src/app/(authenticated)/college/contacts/error.tsx:7-10`: Contact directory unavailable; admin `directory/page.tsx:41-51`: People Directory unavailable
- Fix: Use legacy failure title/description, plus role-specific access denial where needed

## G2-8-003-024  [P2] GAP  facet F08  effort S
- Legacy: `.../hooks/useContacts.js:31-37`: bottomRight info notification, duration 5 seconds
- vNext now: `src/app/(authenticated)/college/contacts/error.tsx:7-10`, `admin/people/directory/error.tsx:1`: error state only
- Fix: Render matching 5-second info toast on failed read with accessible retry
