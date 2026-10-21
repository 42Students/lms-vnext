# Work packet: edit src/components/academics/college-section-management.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u003-college-admin-classes.md, docs/audit/gap2/lane-2/class-controller.md

## G2-5-003-025  [P1] GAP  facet F06 Forms  effort S
- Legacy: Maximum students numeric 1-200, default 60, lowerLimit hidden and preserved on edit. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- vNext now: Create capacity 1-200 default60; edit allows blank unlimited/1-10000. (src/components/academics/college-section-management.tsx:123-126; src/components/academics/college-section-management.tsx:206-209)
- Fix: Keep same 1-200 constraint on edits or explicitly approve expanded editing range.

## G2-2-031-038  [P3] GAP  facet F08  effort S
- Legacy: ClassController.java:103-106 create success message `OK` wrapped entity.
- vNext now: college-section-management.tsx:70-75 displays `Class created.` inline.
- Fix: Align toast/body/success copy with old style.

## G2-2-031-039  [P3] GAP  facet F08  effort S
- Legacy: ClassController.java:213-216 update returns `OK` envelope entity.
- vNext now: college-section-management.tsx:177 displays `Class updated.` inline.
- Fix: Keep legacy toast placement or document deliberate copy improvement.
