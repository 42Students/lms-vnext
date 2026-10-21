# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u010-classes-shared-component.md

9 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u010-classes-shared-component.md

## G2-5-010-011  [P1] GAP  facet F03 Visible elements  effort S
- Legacy: Option error warning with Reload icon Retry options (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- vNext now: No independent per-source options Retry warning (src/components/academics/college-section-management.tsx:78-88)
- Fix: Use explicit Retry options, not empty options.

## G2-5-010-014  [P1] GAP  facet F04 Data formatting  effort M
- Legacy: Program or Batch missing displays Name unavailable (ID X) (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:391-395)
- vNext now: Inner joins exclude orphan program/batch (src/modules/academics/college-structure-directory-service.ts:77-87)
- Fix: Include broken refs with explicit fallback, don't hide rows.

## G2-5-010-017  [P1] GAP  facet F04 Data formatting  effort S
- Legacy: Student counts from per-class learner read; failed displays Unavailable tag (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:399-402)
- vNext now: Counts active enrollments numeric, failure never distinguished (src/modules/academics/college-structure-directory-service.ts:129-159)
- Fix: Preserve Unknown state vs verified zero.

## G2-5-010-029  [P1] GAP  facet F06 Forms  effort S
- Legacy: Edit maxStudents 1–200, lower limit invariant (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:33-48; docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105)
- vNext now: Edit capacity blank or up to 10000 (src/components/academics/college-section-management.tsx:206-209)
- Fix: Keep same 1–200 range create/edit.

## G2-5-010-031  [P1] GAP  facet F06 Forms  effort M
- Legacy: Recurring weekdays can be unselected -> daily, time step 5m, end>start (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:533-579)
- vNext now: Preview weekdays preselected Mon-Fri and nonempty, no 5m step (src/components/academics/college-recurring-preview.tsx:171-194)
- Fix: Implement empty weekdays as daily and five-minute increments.

## G2-5-010-036  [P1] GAP  facet F07 Validation/errors  effort M
- Legacy: Partial setup lookup failure Retry options (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- vNext now: SSR Promise.all no distinct per-lookup retry (src/app/(authenticated)/college/classes/page.tsx:31-34)
- Fix: Distinguish options unavailable vs zero programs.

## G2-5-010-046  [P1] GAP  facet F10 Actions/side effects  effort L
- Legacy: PUT class/update allows valid Program/Batch reassignment (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-216)
- vNext now: PATCH forbids cohort/period reassignment (src/modules/academics/college-section-mutation-service.ts:180-236)
- Fix: Add sanctioned identity reassignment workflow.

## G2-5-010-077  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Hard delete class after no dependencies (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- vNext now: Archived class row retained (src/components/academics/college-section-lifecycle-action.tsx:19-54)
- Fix: Document persistence/retention semantics and migration.

## G2-5-010-079  [P1] GAP  facet F23 Extra/dropped  effort L
- Legacy: Recurring modal integral to component (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:526-599)
- vNext now: Moved to standalone preview page (src/components/academics/college-recurring-preview.tsx:142-215)
- Fix: Restore entry modal for pixel-level clone.
