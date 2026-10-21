# Verification packet (P0, do FIRST): 8 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-004-018 [P0] MISSING facet F04
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Job description file (optional), PDF or Word <=5MB `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- Expected fix: Recreate signed-storage JD upload and link to students

## G2-11-004-067 [P0] MISSING facet F10
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: JdUpload uses upload API and persists jdUrl `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- Expected fix: Add signed JD upload, store URL safely and render preview

## G2-11-004-085 [P0] MISSING facet F14
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: JdUpload allows PDF/Word up to 5MB `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- Expected fix: Create upload and signed link flow

## G2-11-004-122 [P0] MISSING facet F23
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Upload JD link supported `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- Expected fix: Implement signed private storage integration

## G2-16-025-052 [P0] MISSING facet F23
- Files: src/db/schema/placement-drive-change-requests.ts
- Legacy: DriveChangeRequestService.java:154-191 accepted/answered fields mutate drive.
- Expected fix: Owner decision required; if parity mandatory implement apply-on-accept/answer with audit.

## G2-5-016-048 [P0] MISSING facet F22
- Files: src/db/schema/db10-skills-catalog.draft.ts
- Legacy: Legacy MySQL table persisted, referenced by repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillSynonymRepository.java:13-28`
- Expected fix: Register schema only after contract verified and migration replayed.

## G2-5-020-029 [P0] GAP facet F11
- Files: src/db/schema/db05-lesson-discussions.staged.ts
- Legacy: Legacy reads client-supplied lesson id but forbids unscoped content `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:41-71`
- Expected fix: Register reviewed cross-college/content/offering trigger before runtime writes.

## G2-5-020-049 [P0] MISSING facet F23
- Files: src/db/schema/db05-lesson-discussions.staged.ts
- Legacy: Legacy lesson stream is used live by `/api/v1/discussion/*` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DiscussionController.java:75-93`
- Expected fix: Complete DB05 lesson discussion migration + live routes + parity before declaring done.
