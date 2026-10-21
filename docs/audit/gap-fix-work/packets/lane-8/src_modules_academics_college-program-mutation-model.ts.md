# Work packet: edit src/modules/academics/college-program-mutation-model.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l14-u026-program-controller.md, docs/audit/gap2/lane-9/college-admin-programs.md, docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md

## G2-14-026-015  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/ProgramDTO.java:16-25`
- vNext now: `src/modules/academics/college-program-mutation-model.ts:3-12`
- Fix: Legacy durationYears optional/default0, vNext integer durationTerms min1 max24 and code regex; existing zero-duration data rejected.

## G2-9-018-044  [P1] GAP  facet F10  effort L
- Legacy: DELETE hard-removes only if unreferenced `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NewProgramServiceImpl.java:149-179`
- vNext now: DELETE endpoint soft-archives with confirm true `src/app/api/academics/programs/[programId]/route.ts:39-48` `src/modules/academics/college-program-mutation-model.ts:22-24`
- Fix: Document intentional retention policy; ensure legacy deletion expectations communicated.

## G2-10-020-036  [P2] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:278-285 — Blank name yields 'Please enter program name'.
- vNext now: src/modules/academics/college-program-mutation-model.ts:3-5; src/components/admin/admin-program-directory.tsx:109-117 — Schema 'Program name is required' and generic toast.
- Fix: Show exact field-level legacy error.

## G2-10-020-038  [P2] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:257-259 — Missing department message 'Please select a department'.
- vNext now: src/modules/academics/college-program-mutation-model.ts:8-13 — UUID schema invalid selection error via global toast.
- Fix: Restore under-field Ant-style error.

## G2-20-029-032  [P2] GAP  facet F07  effort M
- Legacy: Empty trimmed name gives field error 'Program name cannot be empty' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:115-119`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:146-149`)
- vNext now: Invalid name gives toast 'Program name is required' via Zod (`src/components/admin/admin-program-directory.tsx:108-119`, `src/modules/academics/college-program-mutation-model.ts:3-5`)
- Fix: Render exact field error in create/edit form

## G2-20-029-033  [P2] GAP  facet F07  effort M
- Legacy: Required name says 'Please enter program name', over255 'Maximum 255 characters' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:280-284`)
- vNext now: HTML required/maxLength blocks entry; Zod different wording (`src/components/admin/admin-program-directory.tsx:162-166`, `src/modules/academics/college-program-mutation-model.ts:3-5`)
- Fix: Restore legacy field messages (required,max255)

## G2-20-029-034  [P2] GAP  facet F07  effort M
- Legacy: Missing Department says 'Please select a department' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:258-260`)
- vNext now: Native required select; Zod UUID error/toast (`src/components/admin/admin-program-directory.tsx:156-160`, `src/modules/academics/college-program-mutation-model.ts:9-14`)
- Fix: Show exact inline department required error

## G2-9-018-030  [P2] GAP  facet F07  effort S
- Legacy: Empty name Please enter program name and max255 Maximum 255 characters `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:278-280`
- vNext now: HTML required plus Zod Program name is required; max255 `src/components/admin/admin-program-directory.tsx:165-168` `src/modules/academics/college-program-mutation-model.ts:1-4`
- Fix: Use legacy exact validation text inline, not solely browser/Zod default.

## G2-10-020-037  [P3] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:278-281 — max255 name message 'Maximum 255 characters'.
- vNext now: src/modules/academics/college-program-mutation-model.ts:3-5 — max255 schema with generic Zod max error.
- Fix: Map exact max-length message and inline field placement.
