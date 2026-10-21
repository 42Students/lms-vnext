# Work packet (wave 2): edit src/components/people/faculty-profile-text-section.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-024  [P2] GAP  facet F03  effort M
- Legacy: Every editable card has Edit pencil and repeatables have Add plus at header (`docs/legacy-source/frontend/src/components/profile/about.js:938-973`, `docs/legacy-source/frontend/src/components/profile/about.js:994-1005`, `docs/legacy-source/frontend/src/components/profile/about.js:1143-1155`)
- vNext now: Section forms have persistent fields with Save/Discard; no card-header Edit/Add controls (`src/components/people/faculty-profile-editor.tsx:92-135`, `src/components/people/faculty-profile-text-section.tsx:39-69`)
- Fix: Reuse legacy header actions and collapsed read-only presentation until Edit/Add

## G2-20-030-032  [P2] GAP  facet F06  effort M
- Legacy: Legacy personal Gender is searchable/select choices; DOB AntD DatePicker DD-MM-YYYY; Blood Group select enumerated (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:10-14`, `docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:98-120`)
- vNext now: New three native text/date fields: gender Input, date native date, bloodGroup Input (`src/components/people/faculty-profile-editor.tsx:24-25`, `src/components/people/faculty-profile-text-section.tsx:45-59`)
- Fix: Restore Gender/Blood Group enumerations and DOB picker/format

## G2-20-030-048  [P2] GAP  facet F09  effort S
- Legacy: Legacy personal detail cancel opens 'Discard personal-detail changes?' with custom content (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:29-48`)
- vNext now: New generic 'Discard edits' dialog (`src/components/people/faculty-profile-text-section.tsx:66-72`)
- Fix: Preserve section-specific confirmation title and wording

## G2-20-030-049  [P2] GAP  facet F09  effort M
- Legacy: Legacy route navigation uses browser confirm 'Discard your unsaved profile changes?' across any edit (`docs/legacy-source/frontend/src/components/profile/about.js:117-141`)
- vNext now: New useFacultyProfileUnsavedWarning on individual draft forms (`src/components/people/faculty-profile-text-section.tsx:24-29`)
- Fix: Test and align route change, browser unload and multi-section dirty state

## G2-20-030-072  [P2] GAP  facet F17  effort M
- Legacy: Legacy section-specific keyboard dialogs follow AntD Modal.cancel and confirm actions (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:25-43`, `docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:29-48`)
- vNext now: New native forms focus first invalid field and ConfirmDialog, separate page (`src/components/people/faculty-profile-text-section.tsx:29-35`, `src/components/people/faculty-profile-text-section.tsx:66-72`)
- Fix: Browser-check Escape, restoration, and section navigation focus; harmonize behavior
