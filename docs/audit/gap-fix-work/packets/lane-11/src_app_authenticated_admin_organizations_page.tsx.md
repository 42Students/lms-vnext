# Work packet: edit src/app/(authenticated)/admin/organizations/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-recycle-bin-controller.md

## G2-2-023-001  [P1] MISSING  facet F01  effort M
- Legacy: AdminRecycleBinController.java:54-59 exposes /api/v1/admin/recycle-bin
- vNext now: src/app/(authenticated)/admin has no recycle-bin route; admin/organizations/page.tsx:119-129 separate recovery
- Fix: Add centralized admin recycle-bin discovery page/route.

## G2-2-023-008  [P1] MISSING  facet F03  effort M
- Legacy: AdminRecycleBinController.java:115-156 types Department, Program, Class, Semester, Lecture Hall, Quiz, Notification, College, Organization
- vNext now: src/app/(authenticated)/admin/departments/page.tsx:13-53 departments; admin/organizations/page.tsx:119-129 org restore only
- Fix: Offer all nine restore type options with exact labels.

## G2-2-023-060  [P1] MISSING  facet F22  effort M
- Legacy: AdminRecycleBinController.java:115-157 lists nine entity tables and parent relation
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 only organization archived; others separate
- Fix: Build central entity disposition matrix before restore implementation.

## G2-2-023-020  [P2] MISSING  facet F07  effort M
- Legacy: AdminRecycleBinController.java:180-182 Unknown entityType: X error
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 no generic validation
- Fix: Return exact invalid entity type message / safe enum.

## G2-2-023-024  [P2] GAP  facet F08  effort M
- Legacy: AdminRecycleBinController.java:284-285 `${label} restored. Records beneath it are not automatically restored.`
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 warns child colleges not restored in UI
- Fix: Use consistent parent-only restore feedback across types.

## G2-2-023-026  [P3] GAP  facet F08  effort S
- Legacy: AdminRecycleBinController.java:195-197 GET row success OK
- vNext now: src/app/(authenticated)/admin/organizations/page.tsx:119-129 direct UI server list
- Fix: Emit result count and active type feedback.
