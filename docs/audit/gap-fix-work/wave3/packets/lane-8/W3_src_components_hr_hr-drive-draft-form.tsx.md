# Work packet (wave 3): edit src/components/hr/hr-drive-draft-form.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-new.md

## G2-11-004-018  [P0] MISSING  facet F04  effort L
- Legacy: Job description file (optional), PDF or Word <=5MB `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- vNext now: Uploads explicitly unavailable `src/components/hr/hr-drive-draft-form.tsx:323`
- Fix: Recreate signed-storage JD upload and link to students

## G2-11-004-067  [P0] MISSING  facet F10  effort L
- Legacy: JdUpload uses upload API and persists jdUrl `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- vNext now: Upload absent; draft model has no jdUrl field `src/components/hr/hr-drive-draft-form.tsx:323`
- Fix: Add signed JD upload, store URL safely and render preview

## G2-11-004-085  [P0] MISSING  facet F14  effort L
- Legacy: JdUpload allows PDF/Word up to 5MB `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- vNext now: File upload unavailable `src/components/hr/hr-drive-draft-form.tsx:323`
- Fix: Create upload and signed link flow

## G2-11-004-122  [P0] MISSING  facet F23  effort L
- Legacy: Upload JD link supported `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:363`
- vNext now: Explicit blocked upload notice `src/components/hr/hr-drive-draft-form.tsx:323`
- Fix: Implement signed private storage integration
