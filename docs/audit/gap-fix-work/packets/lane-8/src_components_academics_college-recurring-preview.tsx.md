# Work packet: edit src/components/academics/college-recurring-preview.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-5-003-052  [P1] GAP  facet F12 Business rules  effort M
- Legacy: No weekdays selected means daily recurrence across chosen date range. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- vNext now: Defaults weekdays Monday-Friday, requires nonempty weekday selection. (src/components/academics/college-recurring-preview.tsx:46-49; src/components/academics/college-recurring-preview.tsx:186-194; src/components/academics/college-recurring-preview.tsx:216-219)
- Fix: Support empty-as-daily legacy rule or explicitly warn and preselect all weekdays.

## G2-5-010-053  [P1] GAP  facet F12 Business rules  effort M
- Legacy: No selected weekdays means daily recurrence (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:562-569)
- vNext now: Requires weekday selection, default weekdays M-F (src/components/academics/college-recurring-preview.tsx:46-49; src/components/academics/college-recurring-preview.tsx:186-194)
- Fix: Restore daily-unchecked semantics.
