# Work packet: edit src/app/(authenticated)/admin/departments/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md

## G2-2-023-008  [P1] MISSING  facet F03  effort M
- Legacy: AdminRecycleBinController.java:115-156 types Department, Program, Class, Semester, Lecture Hall, Quiz, Notification, College, Organization
- vNext now: src/app/(authenticated)/admin/departments/page.tsx:13-53 departments; admin/organizations/page.tsx:119-129 org restore only
- Fix: Offer all nine restore type options with exact labels.

## G2-2-023-021  [P2] GAP  facet F07  effort M
- Legacy: AdminRecycleBinController.java:190-192 collegeId is required for type
- vNext now: src/app/(authenticated)/admin/departments/page.tsx:20-26 Select college to continue
- Fix: Show per-type scope-required error before query.
