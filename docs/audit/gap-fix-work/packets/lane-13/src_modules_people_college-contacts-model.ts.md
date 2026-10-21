# Work packet: edit src/modules/people/college-contacts-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/user-controller.md

## G2-1-008-040  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:513-515`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:535-537`: positive-integer program/department messages.
- vNext now: `src/modules/people/college-contacts-model.ts:22-25`,`src/app/(authenticated)/college/contacts/page.tsx:32-34`: UUID filters and generic contact filter error.
- Fix: Map invalid identifiers to field-specific errors for migrated consumers.
