# Work packet (wave 2): edit src/modules/people/faculty-self-section-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md

## G2-1-003-045  [P2] GAP  facet F10  effort L
- Legacy: `FacultyProfileServiceImpl.java:62-88` deletes replaced public/private R2 object best-effort after owned upload ref updates.
- vNext now: `faculty-self-section-model.ts:9-22,72-80` blocks receipt edits and attached-entry deletion, no object replacement or cleanup path.
- Fix: Provide authorized document replacement/removal flow with storage cleanup and audit; do not orphan prior blobs.

## G2-1-003-059  [P2] GAP  facet F14  effort L
- Legacy: `EducationDTO.java:50`, `CertificationDTO.java:25`, `ExperienceDTO.java:26-27` include document URLs for receipts.
- vNext now: `faculty-profile-document.ts:183,203,223-224` uses UUID attachments; self editing prohibits replacing receipts (`faculty-self-section-model.ts:72-80`).
- Fix: Provide read-only file affordances plus admin attachment lifecycle; do not expose raw bucket URLs.

## G2-1-003-074  [P2] GAP  facet F21  effort L
- Legacy: `FacultyProfileServiceImpl.java:62-88` R2 cleanup best-effort, object may remain on failure; logs warning.
- vNext now: `faculty-self-section-model.ts:9-22` forbids receipt mutation; no background orphan cleanup from section editor.
- Fix: Define lifecycle for managed receipts and cleanup workflow (or documented manual recovery) before enabling replacement.

## G2-20-030-035  [P2] GAP  facet F06  effort M
- Legacy: Legacy repeatable sections allow immediate item Add/Edit/Delete through dedicated service calls (`docs/legacy-source/frontend/src/components/profile/about.js:295-348`, `docs/legacy-source/frontend/src/components/profile/about.js:421-499`)
- vNext now: New draft mutation persists whole section on Save; deletions staged (`src/components/people/faculty-profile-editor.tsx:109-134`, `src/modules/people/faculty-self-section-model.ts:37-80`)
- Fix: Clarify save timing and align item-level action affordances
