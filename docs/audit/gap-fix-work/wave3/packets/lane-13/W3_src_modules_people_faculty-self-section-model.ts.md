# Work packet (wave 3): edit src/modules/people/faculty-self-section-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/teacher-profile.md

## G2-20-030-036  [P1] MISSING  facet F06  effort L
- Legacy: Legacy identity documents editor has Aadhaar and PAN file/link import (`docs/legacy-source/frontend/src/components/profile/about.js:585-638`, `docs/legacy-source/frontend/src/components/profile/about.js:1314-1335`)
- vNext now: Editable-section enum omits identity and explicitly blocks private receipts (`src/modules/people/faculty-self-section-model.ts:5-7`, `src/modules/people/faculty-self-section-model.ts:25-30`, `src/modules/people/faculty-self-section-model.ts:71-80`)
- Fix: Restore safe, tenant-scoped private document uploads with explicit authorization and signed retrieval

## G2-20-030-054  [P1] MISSING  facet F10  effort L
- Legacy: Legacy identity upload PUT faculty identity after presign and validates tenant-owned references (`docs/legacy-source/frontend/src/components/profile/about.js:585-638`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:289-300`)
- vNext now: New section PATCH rejects identity and protected document receipt modification (`src/modules/people/faculty-self-section-model.ts:25-30`, `src/modules/people/faculty-self-section-model.ts:71-80`)
- Fix: Implement private-doc write workflow without weakening tenant protection

## G2-20-030-065  [P1] MISSING  facet F14  effort L
- Legacy: Legacy faculty identity supports Aadhaar/PAN uploaded files and linked imports (`docs/legacy-source/frontend/src/components/profile/about.js:585-638`, `docs/legacy-source/frontend/src/components/profile/about.js:1314-1335`)
- vNext now: vNext blocks private document receipt edits and provides no upload control (`src/modules/people/faculty-self-section-model.ts:5-7`, `src/modules/people/faculty-self-section-model.ts:71-80`)
- Fix: Add allowed private identity document upload with signed URL and receipt validation

## G2-20-030-082  [P1] MISSING  facet F21  effort L
- Legacy: Legacy uses profile uploadToR2 presign and asynchronous superseded-object delete (`docs/legacy-source/frontend/src/components/profile/about.js:830-878`)
- vNext now: New self-document patch has no R2 integration or file cleanup (`src/app/api/people/faculty-self-document/route.ts:16-27`, `src/modules/people/faculty-self-section-model.ts:25-30`)
- Fix: Restore storage workflow with tenant signing and eventual old-object cleanup
