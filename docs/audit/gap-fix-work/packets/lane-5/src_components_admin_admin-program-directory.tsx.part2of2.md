# Work packet: edit src/components/admin/admin-program-directory.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/new-program.md

## G2-13-018-023  [P3] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:207` delete returns 'Program deleted successfully'
- vNext now: `src/modules/academics/college-program-mutation-service.ts:169-327` archives/restores programs, `src/components/admin/admin-program-directory.tsx:128` created-toast 'Created program ...'
- Fix: Distinguish archive from hard delete in toast and action names
