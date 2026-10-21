# Work packet (wave 2): edit src/components/courses/faculty-contacts-table.tsx

16 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/teacher-contacts-tab.md

## G2-6-004-010  [P2] MISSING  facet F03  effort M
- Legacy: Old per-contact tinted initials or image avatar `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:6-72` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:121-130`
- vNext now: New rows have only text name, no avatar `src/components/courses/faculty-contacts-table.tsx:22-56`
- Fix: Restore consistent tinted initials avatar and optional permitted photo

## G2-6-004-013  [P2] GAP  facet F04  effort S
- Legacy: Old Teachers/Students table columns Name, Email, Contact without Role `docs/legacy-source/frontend/src/components/contacts/contactColumns.js:29-59`
- vNext now: New teacher/student tabs always have roles column when roles exist `src/components/courses/faculty-contacts-table.tsx:38-53`
- Fix: Hide role column for role-specific tabs or match old column order

## G2-6-004-015  [P2] GAP  facet F04  effort S
- Legacy: Old Name concatenates first/last or em dash `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:121-131`
- vNext now: New displayName or `Name not recorded` `src/components/courses/faculty-contacts-table.tsx:24-29` `src/components/courses/faculty-contacts-table.tsx:42-48`
- Fix: Use legacy name fallback `—` and equivalent capitalization

## G2-6-004-018  [P2] GAP  facet F04  effort M
- Legacy: Old mobile cards label `Email`, `Contact`, optionally `Role` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:226-254`
- vNext now: New mobile card label `Department` and badges for roles `src/components/courses/faculty-contacts-table.tsx:26-35`
- Fix: Preserve original card fields, with explicit privacy exception for email/mobile

## G2-6-004-019  [P2] GAP  facet F05  effort M
- Legacy: Old ContactsGrid desktop Ant Table columns vary by tab `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:118-137` `docs/legacy-source/frontend/src/components/contacts/contactColumns.js:3-59`
- vNext now: New same 3-column table every tab and showRoles toggles badge values only `src/components/courses/faculty-contacts-table.tsx:38-55`
- Fix: Use per-tab table column sets and widths

## G2-6-004-020  [P2] GAP  facet F05  effort S
- Legacy: Old desktop table horizontal scroll x560 `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:162-179`
- vNext now: New CSS Table hidden below sm without explicit min width x560 `src/components/courses/faculty-contacts-table.tsx:38-55`
- Fix: Set min-width scroll threshold matching 560px and avoid truncated headers

## G2-6-004-036  [P2] MISSING  facet F09  effort S
- Legacy: Old error Retry button only appears inside table/card empty state `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:179-191` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:212-217`
- vNext now: New main page has no inline Retry on contact service error `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:55-67` `src/components/courses/faculty-contacts-table.tsx:17-18`
- Fix: Add inline Retry for both desktop and mobile directory failure state

## G2-6-004-045  [P2] MISSING  facet F12  effort M
- Legacy: Old avatar color is stable seed modulo 8 and name initials `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:14-38` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:62-70`
- vNext now: New no avatar image `src/components/courses/faculty-contacts-table.tsx:22-56`
- Fix: Implement stable tinted initials with eight palette variants

## G2-6-004-046  [P2] GAP  facet F13  effort M
- Legacy: Old mobile loading draws exactly 3 skeleton contact cards `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:198-211`
- vNext now: New page has no local skeleton branch, server render of final rows `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx:55-79` `src/components/courses/faculty-contacts-table.tsx:17-35`
- Fix: Add three-card loading skeleton with avatar and 3 text lines

## G2-6-004-047  [P2] GAP  facet F13  effort S
- Legacy: Old no results `No contacts found` and `Your contacts will appear here once available.` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:186-192` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:218-223`
- vNext now: New EmptyState title `No public directory members found` `src/components/courses/faculty-contacts-table.tsx:17-18`
- Fix: Restore empty-state title/description

## G2-6-004-048  [P2] GAP  facet F13  effort S
- Legacy: Old search empty `No contacts match your search` and `Try a different search term.` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:186-191` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:218-223`
- vNext now: New same generic EmptyState whether searched or not `src/components/courses/faculty-contacts-table.tsx:17-18`
- Fix: Use search-specific empty text when q present

## G2-6-004-052  [P2] GAP  facet F16  effort M
- Legacy: Old desktop Table and mobile Cards with image circle avatar `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:160-197` `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:198-256`
- vNext now: New breakpoint at sm to table, mobile article rows without avatar `src/components/courses/faculty-contacts-table.tsx:22-55`
- Fix: Match old mobile visual card treatment/avatar and responsive threshold

## G2-6-004-053  [P2] GAP  facet F16  effort M
- Legacy: Old mobile cards label Email, Contact, Role; text legible under name `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:226-254`
- vNext now: New cards Department and role badges `src/components/courses/faculty-contacts-table.tsx:26-35`
- Fix: Restore card metadata hierarchy if disclosure is authorized

## G2-6-004-054  [P2] GAP  facet F16  effort S
- Legacy: Old table min horizontal scroll 560px `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:162-179`
- vNext now: New table uses no explicit scroll x=560 `src/components/courses/faculty-contacts-table.tsx:38-55`
- Fix: Add overflow handling at 200% zoom and small tablets

## G2-6-004-055  [P2] MISSING  facet F17  effort M
- Legacy: Old avatar image has name alt, initials fallback aria-hidden `docs/legacy-source/frontend/src/components/contacts/ContactsGrid.js:40-70`
- vNext now: New no avatar image so no equivalent alt semantics `src/components/courses/faculty-contacts-table.tsx:22-37`
- Fix: Add accessible image with error fallback; don't duplicate name in SR output unnecessarily

## G2-6-004-060  [P2] GAP  facet F18  effort S
- Legacy: Old table header `Name` and `Contact` `docs/legacy-source/frontend/src/components/contacts/contactColumns.js:3-59`
- vNext now: New `Contact` name-header and `Department` `src/components/courses/faculty-contacts-table.tsx:38-42`
- Fix: Restore original labels and columns with privacy-gated fields
