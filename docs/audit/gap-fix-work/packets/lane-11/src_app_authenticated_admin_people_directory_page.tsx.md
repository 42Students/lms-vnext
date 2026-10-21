# Work packet: edit src/app/(authenticated)/admin/people/directory/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/superadmin-people.md, docs/audit/gap2/lane-8/people-directory-component.md

## G2-8-002-021  [P1] GAP  facet F07  effort M
- Legacy: `.../controller/UserController.java:441-447`: 403 `The contacts directory is for staff only` for learner/recruiter
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:24-25`: non-SuperAdmin redirects `/dashboard`
- Fix: Clarify who can view global vs college directory; do not expose global membership enumeration to ordinary staff

## G2-8-003-022  [P2] GAP  facet F07  effort S
- Legacy: `.../hooks/useContacts.js:31-39`: load failure toast exact title `Couldn't load contacts`; inline failed state in ContactsGrid
- vNext now: `src/app/(authenticated)/college/contacts/error.tsx:7-10`: Contact directory unavailable; admin `directory/page.tsx:41-51`: People Directory unavailable
- Fix: Use legacy failure title/description, plus role-specific access denial where needed

## G2-8-002-020  [P2] GAP  facet F07  effort S
- Legacy: `.../hooks/useContacts.js:29-37`: failure toast titled `Couldn't load contacts`
- vNext now: `src/app/(authenticated)/admin/people/directory/page.tsx:41-51`: inline `People Directory unavailable` / `Directory access denied`
- Fix: Match legacy failure wording for network issue while keeping explicit unauthorized distinction
