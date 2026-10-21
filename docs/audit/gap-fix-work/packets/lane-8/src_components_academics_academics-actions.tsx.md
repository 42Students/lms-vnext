# Work packet: edit src/components/academics/academics-actions.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-012  [P1] GAP  facet F03  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:227-245 — Always visible Edit icon button + red Delete icon button.
- vNext now: src/components/academics/academics-actions.tsx:156-168 — 'Actions' dropdown with Edit and Archive.
- Fix: Use inline Edit/Delete buttons with matching destructive red state.

## G2-10-020-042  [P1] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:299-301 — Delete failure 'Program was not deleted' with Retry delete.
- vNext now: src/components/academics/academics-actions.tsx:279-311 — Archive generic error toast.
- Fix: Preserve per-row retry even after failed server archive.

## G2-10-020-057  [P1] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-194; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-211 — DELETE /api/v1/new-program/delete/:id.
- vNext now: src/components/academics/academics-actions.tsx:292-310; src/app/api/academics/programs/[programId]/route.ts:39-49 — DELETE archives via archiveCollegeProgram.
- Fix: Document contract: hard delete vs soft archive and linked-content policy.

## G2-10-020-069  [P1] GAP  facet F12  effort undefined
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-207 — Legacy DELETE erases program; dependency guard modal.
- vNext now: src/components/academics/academics-actions.tsx:292-310 — Archive changes to ARCHIVED, retains historical records.
- Fix: Decide explicit archive-v-delete owner policy; align label and restoration.

## G2-10-020-102  [P1] GAP  facet F21  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-195; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-211 — Delete service rejects dependencies; admin decides via Popconfirm.
- vNext now: src/components/academics/academics-actions.tsx:292-311; src/modules/academics/program-service.ts:368-410 — Archive does soft status transition.
- Fix: Review dependent migration FK and restore for safe archive parity.

## G2-20-029-035  [P1] GAP  facet F07  effort M
- Legacy: Create/update failure keeps closable Alert with field mapped BE validation and toast if no field error (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:125-129`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:151-159`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:273-276`)
- vNext now: Generic toast on create and mutation; no mapped inline field errors (`src/components/admin/admin-program-directory.tsx:125-139`, `src/components/academics/academics-actions.tsx:60-79`)
- Fix: Map backend field errors onto controls and display dismissible Alert

## G2-9-018-037  [P1] GAP  facet F08  effort M
- Legacy: Deleted program “NAME”. `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:180-183`
- vNext now: Archives rather than deletes `src/components/academics/academics-actions.tsx:151-156`
- Fix: Surface archive semantics; decide hard-delete parity separately with retention policy.

## G2-9-018-039  [P1] GAP  facet F09  effort M
- Legacy: Delete Popconfirm asks Delete “NAME”? with Delete/Cancel `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:235-245`
- vNext now: Archive confirmation dialog, not deletion `src/components/academics/academics-actions.tsx:140-156`
- Fix: Reconcile destructive action with archive business policy, label consistently.

## G2-10-020-041  [P2] GAP  facet F07  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:329-330 — Edit failure 'Program was not updated' inline Alert closable.
- vNext now: src/components/academics/academics-actions.tsx:70-76,190-233 — Generic 'Academic update failed' toast.
- Fix: Show edit-modal field and server error states.

## G2-10-020-045  [P2] GAP  facet F08  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:149-152 — Edit success `Updated program “<new name>”.`
- vNext now: src/components/academics/academics-actions.tsx:224-225 — Uses *old* program.name in toast.
- Fix: Report submitted new name in edit toast.

## G2-10-020-046  [P2] GAP  facet F08  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:182-184 — Delete success `Deleted program “<name>”.`
- vNext now: src/components/academics/academics-actions.tsx:292-310 — Archive success `Program archived`.
- Fix: Decide delete-v-archive semantics and present matching UX.

## G2-20-029-038  [P2] GAP  facet F08  effort S
- Legacy: Edit success 'Updated program “new name”.' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:149-153`)
- vNext now: Uses original program.name, even after a rename (`src/components/academics/academics-actions.tsx:215-228`)
- Fix: Interpolate submitted trimmed name instead of old name

## G2-20-029-039  [P2] GAP  facet F08  effort S
- Legacy: Delete success 'Deleted program “name”.' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:182-185`)
- vNext now: Archive success 'Program archived' (`src/components/academics/academics-actions.tsx:293-310`)
- Fix: If retaining archive, explain changed action and acknowledge legacy copy divergence

## G2-9-018-036  [P2] GAP  facet F08  effort S
- Legacy: Updated program “NAME”. `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:155-156`
- vNext now: Update toast uses original program.name, not edited name `src/components/academics/academics-actions.tsx:213-221`
- Fix: Use updated name in success toast.
