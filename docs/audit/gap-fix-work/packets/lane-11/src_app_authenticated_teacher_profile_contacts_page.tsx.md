# Work packet: edit src/app/(authenticated)/teacher/profile/contacts/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-019  [P1] GAP  facet F02  effort M
- Legacy: Legacy Contacts card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1362-1386`)
- vNext now: Contacts shifted to independent read-only route (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:6-35`)
- Fix: Restore Contacts section position and legacy card presentation

## G2-20-030-039  [P1] GAP  facet F07  effort M
- Legacy: Primary mobile field missing error 'Primary mobile number is required' (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:65-78`)
- vNext now: Schema contactMobile permits empty; contact editor disabled (`src/modules/people/faculty-profile-document.ts:40-60`, `src/app/(authenticated)/teacher/profile/contacts/page.tsx:22-35`)
- Fix: Require primary number in authenticated editable contact flow when legacy semantics apply

## G2-20-030-059  [P1] GAP  facet F12  effort L
- Legacy: Legacy contact profile allows alternate phone/email edits with required primary phone (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:15-22`, `docs/legacy-source/frontend/src/components/profile/about/contacts.js:63-94`)
- vNext now: vNext separate route forbids writes pending storage (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:22-35`)
- Fix: Restore intentional contact editing after schema/authorization readiness
