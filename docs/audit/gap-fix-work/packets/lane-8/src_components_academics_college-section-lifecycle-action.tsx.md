# Work packet: edit src/components/academics/college-section-lifecycle-action.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-controller.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-2-031-006  [P1] GAP  facet F01  effort M
- Legacy: ClassController.java:224-259 DELETE /delete/{id} permanently removes section.
- vNext now: src/components/academics/college-section-lifecycle-action.tsx:19-31 PATCH /lifecycle ARCHIVE/RESTORE.
- Fix: Document intentional archive vs delete semantics, data retention and permission scope.

## G2-2-031-046  [P1] GAP  facet F10  effort M
- Legacy: ClassController.java:224-259 DELETE hard deletes if no students/schedules.
- vNext now: college-section-lifecycle-action.tsx:25-33 PATCH lifecycle ARCHIVE/RESTORE.
- Fix: Document archive-vs-delete and reactivation availability in activity/history.

## G2-5-010-002  [P1] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: Legacy Edit/Schedule/Delete inline row navigation (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:407-425)
- vNext now: Schedule link and Edit/Archive lifecycle control (src/components/academics/college-structure-directory.tsx:396-406; src/components/academics/college-section-lifecycle-action.tsx:19-54)
- Fix: Restore full Edit, recurring Schedule, guarded Delete.

## G2-2-031-035  [P2] GAP  facet F07  effort M
- Legacy: ClassController.java:243-251 delete rejects students/schedules with two separate precise messages.
- vNext now: college-section-lifecycle-action.tsx:48-55 handles archive/restore; section-service.ts:352-397 archive status.
- Fix: Map archive dependency blockers to actionable messages; do not conflate schedule with roster.

## G2-2-031-040  [P2] GAP  facet F08  effort S
- Legacy: ClassController.java:253-255 delete success literal `Class deleted successfully`.
- vNext now: college-section-lifecycle-action.tsx:19-52 archives/restores without same toast.
- Fix: Use archive/restore-accurate success copy, avoid claiming permanent deletion.
