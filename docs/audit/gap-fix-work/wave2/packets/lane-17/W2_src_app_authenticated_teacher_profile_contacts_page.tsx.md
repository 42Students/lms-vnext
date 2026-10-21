# Work packet (wave 2): edit src/app/(authenticated)/teacher/profile/contacts/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-028  [P2] GAP  facet F04  effort S
- Legacy: Legacy contacts render 10-digit phone +91-#####-##### and display 'Not specified' fallback (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:58-86`)
- vNext now: Contacts route presents raw loginPhone or 'Not provided' (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:15-20`)
- Fix: Format visible contact numbers and empty placeholders like legacy

## G2-20-030-047  [P2] MISSING  facet F09  effort M
- Legacy: Legacy contact edit cancel opens 'Discard contact changes?' modal with Keep editing (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:25-43`)
- vNext now: New contact route has no edit or cancel modal (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:22-35`)
- Fix: Implement matching contact discard confirmation

## G2-20-030-074  [P2] GAP  facet F18  effort S
- Legacy: Legacy 'Contacts', 'Identity Documents', 'Additional Information' (`docs/legacy-source/frontend/src/components/profile/about.js:1320-1323`, `docs/legacy-source/frontend/src/components/profile/about.js:1366-1369`, `docs/legacy-source/frontend/src/components/profile/about.js:1392-1395`)
- vNext now: vNext 'Contact details' separate, identity absent, 'metadata' generic editor (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:8-10`, `src/components/people/faculty-profile-editor.tsx:107-109`)
- Fix: Restore legacy headings and original position
