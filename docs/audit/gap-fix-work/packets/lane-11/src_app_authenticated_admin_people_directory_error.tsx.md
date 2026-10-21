# Work packet: edit src/app/(authenticated)/admin/people/directory/error.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/people-directory-component.md, docs/audit/gap2/lane-8/superadmin-people.md

## G2-8-003-024  [P2] GAP  facet F08  effort S
- Legacy: `.../hooks/useContacts.js:31-37`: bottomRight info notification, duration 5 seconds
- vNext now: `src/app/(authenticated)/college/contacts/error.tsx:7-10`, `admin/people/directory/error.tsx:1`: error state only
- Fix: Render matching 5-second info toast on failed read with accessible retry

## G2-8-002-022  [P3] GAP  facet F08  effort S
- Legacy: `.../hooks/useContacts.js:31-37`: bottomRight info notification, 5-second duration
- vNext now: `src/app/(authenticated)/admin/people/directory/error.tsx:1`: persistent ErrorState and Retry; no toast
- Fix: Add legacy info toast on failed directory load where it does not duplicate error state
