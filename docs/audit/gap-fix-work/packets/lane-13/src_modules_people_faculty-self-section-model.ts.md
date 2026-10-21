# Work packet: edit src/modules/people/faculty-self-section-model.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md

## G2-1-003-049  [P1] GAP  facet F11  effort L
- Legacy: `FacultyProfileController.java:91-106` college admin can read another ADMIN/TPO profile but cannot write; superadmin allowed.
- vNext now: `faculty-self-section-model.ts:25-30` only own nonidentity sections; admin `people/[membershipId]/faculty-profile/route.ts:18-69` limited academic columns.
- Fix: Reimplement protected-role read/write distinction in full profile admin editor and API.

## G2-20-030-017  [P1] MISSING  facet F02  effort M
- Legacy: Legacy Identity Documents card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1314-1340`)
- vNext now: Identity Documents section absent from editable sections (`src/modules/people/faculty-self-section-model.ts:25-30`)
- Fix: Restore Identity Documents section position and legacy card presentation

## G2-20-030-038  [P1] GAP  facet F06  effort L
- Legacy: Legacy offers contacts, metadata, social, experience, education, awards, publications, skills separate mutations (`docs/legacy-source/frontend/src/components/profile/about.js:295-659`, `docs/legacy-source/frontend/src/components/profile/about.js:774-817`)
- vNext now: New editor offers all except contacts and identity; saves entire versioned doc section (`src/components/people/faculty-profile-editor.tsx:92-135`, `src/modules/people/faculty-self-section-model.ts:25-35`)
- Fix: Reinstate missing contact/identity flows and verify parity per section

## G2-20-030-057  [P1] GAP  facet F11  effort L
- Legacy: Legacy backend restricts sensitive identity refs to tenant folder and self/authorized admin (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:55-106`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:117-155`)
- vNext now: vNext forbids identity/secret metadata edits and requires profile.self.manage (`src/modules/people/faculty-self-section-model.ts:41-51`, `src/modules/people/faculty-profile-self.staged.ts:69-82`)
- Fix: Design secure migration preserving authorized identity uploads without permitting arbitrary ref injection

## G2-20-030-085  [P1] GAP  facet F22  effort L
- Legacy: Legacy image website and identity JSON carry storage refs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:137-153`)
- vNext now: New facultyProfiles schema has no first-class photo/document reference columns; staged receipt ids in JSON (`src/db/schema/profiles.ts:33-58`, `src/modules/people/faculty-self-section-model.ts:71-80`)
- Fix: Define sanctioned dedicated private-object references before enabling uploads

## G2-20-030-090  [P1] GAP  facet F23  effort L
- Legacy: Legacy contains tenant-scoped identity and image uploads (`docs/legacy-source/frontend/src/components/profile/about.js:585-638`, `docs/legacy-source/frontend/src/components/profile/about.js:830-878`)
- vNext now: vNext intentionally blocks private receipt mutation; no uploads until approved (`src/modules/people/faculty-self-section-model.ts:5-7`, `src/modules/people/faculty-self-section-model.ts:71-80`)
- Fix: Record intentional security restriction and owners' decision for safe authorized replacement

## G2-1-003-037  [P2] GAP  facet F07  effort L
- Legacy: `FacultyProfileServiceImpl.java:117-126` profile image only HTTPS/approved object key; exact error 'Profile image URL must use HTTPS.'
- vNext now: `faculty-self-section-model.ts:25-30` self route doesn't edit image, document stores profileImageDocumentId (`faculty-profile-document.ts:302`).
- Fix: Add secure authorized profile photo replacement with image-validation copy.
