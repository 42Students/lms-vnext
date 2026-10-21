# Work packet (wave 3): edit src/app/(authenticated)/teacher/profile/contacts/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-033  [P1] MISSING  facet F06  effort L
- Legacy: Legacy contacts editor permits primary/alternate phone and contactMail (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:15-45`, `docs/legacy-source/frontend/src/components/profile/about/contacts.js:58-100`)
- vNext now: Contact details route explicitly says alternate contact editing unavailable (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:22-35`)
- Fix: Introduce authorized contact update, server validation and inline editing controls
