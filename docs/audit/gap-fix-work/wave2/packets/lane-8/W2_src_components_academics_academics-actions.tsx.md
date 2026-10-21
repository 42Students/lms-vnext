# Work packet (wave 2): edit src/components/academics/academics-actions.tsx

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-programs.md, docs/audit/gap2/lane-20/superadmin-sections-programs.md, docs/audit/gap2/lane-9/college-admin-programs.md

## G2-10-020-008  [P2] GAP  facet F02  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-341 — Edit modal Ant modal with Save Changes, Cancel footer.
- vNext now: src/components/academics/academics-actions.tsx:190-233 — New generic Dialog modal/footer, Save label.
- Fix: Match modal dimensions, header, actions and field order.

## G2-10-020-014  [P2] MISSING  facet F03  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:299-301 — Delete errors are closable red alert with Retry delete button.
- vNext now: src/components/academics/academics-actions.tsx:292-312 — Archive dialog + shared toast without inline Retry.
- Fix: Add record-specific inline delete failure and retry.

## G2-10-020-034  [P2] GAP  facet F06  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-340 — Editing fields Department, Program Name, Duration; no Code.
- vNext now: src/components/academics/academics-actions.tsx:233-275 — Dialog fields Program name, Code, Duration, Department.
- Fix: Restore edit field order and hide optional Code when cloning.

## G2-10-020-035  [P2] GAP  facet F06  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-327 — Save Changes button; disabled during editLoading, modal mask/esc closure blocked.
- vNext now: src/components/academics/academics-actions.tsx:190-233 — Save text, generic dialog closure handling.
- Fix: Match action label and pending close restrictions.

## G2-10-020-049  [P2] GAP  facet F09  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:235-245 — Popconfirm `Delete “Name”?` with `It has no semesters, batches or classes. Delete it?`, Delete/Cancel.
- vNext now: src/components/academics/academics-actions.tsx:292-310 — ConfirmDialog title `Archive Name?` and dependency-archive text.
- Fix: Match destructive prompt and action semantics.

## G2-10-020-051  [P2] GAP  facet F09  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-327 — Edit Modal `Edit “<name>”`, `Save Changes`, maskClosable false.
- vNext now: src/components/academics/academics-actions.tsx:190-205 — Dialog `Edit program`, `Save` etc.
- Fix: Recreate record title and modal closure/width.

## G2-10-020-056  [P2] GAP  facet F10  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:141-161; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:140-183 — PUT /api/v1/new-program/update/:id.
- vNext now: src/components/academics/academics-actions.tsx:210-224; src/app/api/academics/programs/[programId]/route.ts:24-36 — PATCH /api/academics/programs/:id with code, deptId, durationTerms.
- Fix: Translate update schema and guard cross-college department moves.

## G2-10-020-079  [P2] GAP  facet F15  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-195; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:185-207 — Delete logs PROGRAM_DELETE.
- vNext now: src/components/academics/academics-actions.tsx:292-310 — Archive uses different semantic event.
- Fix: Map delete-v-archive audit event taxonomy and history.

## G2-10-020-082  [P2] GAP  facet F16  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-340 — Ant Modal centered with field labels, desktop width default.
- vNext now: src/components/academics/academics-actions.tsx:190-277 — Generic Dialog and responsive grid.
- Fix: Match modal width, footer positioning, mobile field stack.

## G2-10-020-083  [P2] GAP  facet F17  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:232-242 — Edit and Delete have distinct aria-label with name.
- vNext now: src/components/academics/academics-actions.tsx:158-167 — Dropdown 'Actions' with MenuItems Edit/Archive, no record name visible on trigger.
- Fix: Ensure accessible button name includes selected program.

## G2-10-020-088  [P2] GAP  facet F18  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:233-242 — Actions buttons text 'Edit'/'Delete'.
- vNext now: src/components/academics/academics-actions.tsx:160-165 — Dropdown 'Edit'/'Archive'.
- Fix: Show source labels on separate buttons.

## G2-10-020-098  [P2] GAP  facet F20  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-194 — deleteRef prevents concurrent deletes across all rows.
- vNext now: src/components/academics/academics-actions.tsx:50-80,95-130 — useTransition per action menu; no shared global delete guard.
- Fix: Avoid concurrent deletes with per-list busy lock.

## G2-20-029-007  [P2] GAP  facet F03  effort M
- Legacy: Row Edit and Delete buttons are individually visible with corresponding icons and aria-labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:232-242`)
- vNext now: Actions dropdown contains Edit and Archive (`src/components/admin/admin-program-directory.tsx:67-78`, `src/components/academics/academics-actions.tsx:159-167`)
- Fix: Expose Edit and Delete controls inline with legacy icons/labels

## G2-20-029-030  [P2] GAP  facet F06  effort M
- Legacy: Edit cancel detects trimmed name, department, duration to trigger discard (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:203-211`)
- vNext now: Edit dirty helper also tracks code and raw duration representation (`src/components/academics/academics-actions.tsx:144-154`, `src/modules/academics/college-program-mutation-model.ts:29-36`)
- Fix: Align dirty checks for trimmed names and selected department

## G2-20-029-040  [P2] GAP  facet F09  effort S
- Legacy: Edit modal title `Edit “Program Name”`, Save Changes and Cancel (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-327`)
- vNext now: Generic 'Edit program', Save and Cancel (`src/components/academics/academics-actions.tsx:191-233`)
- Fix: Restore contextual modal title and Save Changes CTA

## G2-20-029-041  [P2] GAP  facet F09  effort M
- Legacy: Delete Popconfirm title `Delete “Name”?`, description 'It has no semesters, batches or classes. Delete it?' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:233-241`)
- vNext now: Archive ConfirmDialog with long archive-effects description (`src/components/academics/academics-actions.tsx:292-311`)
- Fix: Match confirmation wording for the chosen delete/archive semantics

## G2-20-029-060  [P2] GAP  facet F17  effort S
- Legacy: Legacy Edit/Delete buttons have program-specific aria labels (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:232-242`)
- vNext now: Compact Actions dropdown generic trigger label (`src/components/academics/academics-actions.tsx:159-167`)
- Fix: Restore direct accessible names for row actions

## G2-20-029-063  [P2] GAP  facet F18  effort S
- Legacy: Legacy button 'Delete' and modal 'Save Changes' (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:239-242`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-328`)
- vNext now: New 'Archive' and 'Save' (`src/components/academics/academics-actions.tsx:165-166`, `src/components/academics/academics-actions.tsx:229-232`)
- Fix: Restore legacy labels or record intentional archive product decision

## G2-9-018-008  [P2] GAP  facet F03  effort M
- Legacy: Edit and Delete separate visible small icon buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:227-245`
- vNext now: Single Actions dropdown with Edit and Archive `src/components/academics/academics-actions.tsx:142-156`
- Fix: Expose legacy Edit/Delete controls or document deliberate archive-vs-delete divergence visibly.

## G2-9-018-038  [P2] GAP  facet F09  effort S
- Legacy: Edit modal title Edit “NAME”, Save Changes/Cancel, maskClosable false `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-341`
- vNext now: Dialog title Edit program, primary Save, discard confirmation `src/components/academics/academics-actions.tsx:177-219`
- Fix: Use contextual title and Save Changes, preserve guarded cancellation.

## G2-9-018-058  [P2] GAP  facet F17  effort S
- Legacy: Edit/Delete have per-record aria-label `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:233-242`
- vNext now: Actions dropdown menu uses generic Actions trigger `src/components/academics/academics-actions.tsx:142-156`
- Fix: Add row-specific accessible name and keyboard discoverability.

## G2-9-018-062  [P2] GAP  facet F18  effort M
- Legacy: Legacy create/edit title and error text `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:269-275,324-330`
- vNext now: Create details disclosure/Edit program and generic toast `src/components/admin/admin-program-directory.tsx:140-145` `src/components/academics/academics-actions.tsx:178-180`
- Fix: Align labels and error texts one by one with legacy copy catalogue.

## G2-10-020-050  [P3] GAP  facet F09  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:197-211 — Dirty edit cancel prompts `Discard changes to this program?`, message including record name.
- vNext now: src/components/academics/academics-actions.tsx:279-289 — Generic `Discard program changes?` and description.
- Fix: Use record-specific title/body.

## G2-10-020-052  [P3] GAP  facet F09  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:235-244 — Tooltip lists exact linked dependency blockers.
- vNext now: src/components/academics/academics-actions.tsx:160-165 — Dropdown title generic `Remove linked semesters, batches, classes before deleting.`
- Fix: List only categories with >0 counts in tooltip.

## G2-10-020-089  [P3] GAP  facet F18  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:282 — 'Duration (Years)' with capital Y.
- vNext now: src/components/academics/academics-actions.tsx:256-258 — 'Duration (years)' lower-case y in edit.
- Fix: Match capitalization.

## G2-10-020-091  [P3] GAP  facet F18  effort undefined
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:324-327 — 'Save Changes'.
- vNext now: src/components/academics/academics-actions.tsx:229-230 — 'Save'.
- Fix: Use exact action text.

## G2-20-029-042  [P3] GAP  facet F09  effort S
- Legacy: Dirty edit cancel asks 'Discard changes to this program?' and contextual lost-edits text (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:203-211`)
- vNext now: Asks 'Discard program changes?' with generic description (`src/components/academics/academics-actions.tsx:280-290`)
- Fix: Restore program-specific discard copy

## G2-9-018-043  [P3] GAP  facet F10  effort S
- Legacy: PUT /api/v1/new-program/update/{id} `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:145-177`
- vNext now: PATCH /api/academics/programs/{uuid} `src/components/academics/academics-actions.tsx:209-220` `src/app/api/academics/programs/[programId]/route.ts:24-36`
- Fix: Map mutation semantics and errors in parity reference.
