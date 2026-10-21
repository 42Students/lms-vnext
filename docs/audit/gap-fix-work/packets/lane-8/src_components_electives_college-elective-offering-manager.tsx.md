# Work packet: edit src/components/electives/college-elective-offering-manager.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-electives.md, docs/audit/gap2/lane-9/college-admin-electives.md

## G2-10-006-031  [P1] GAP  facet F06  effort L
- Legacy: Old offering created by courseId and nullable capacity, no explicit group selection in old modal `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-83`
- vNext now: New offering requires backed course delivery and optional group picker with capacity default30 `src/components/electives/college-elective-offering-manager.tsx:50-80` `src/components/electives/college-elective-offering-manager.tsx:136-155`
- Fix: Map course to delivery/section automatically or document new requirement and migrate existing electives safely

## G2-10-006-043  [P1] GAP  facet F09  effort L
- Legacy: Old ElectiveSlotPanel has AllocateModal OfferingRosterDrawer faculty and capacity modals `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:10-26` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-147`
- vNext now: New Manage offerings list and independent roster link; no equivalent same-screen faculty drawer `src/components/electives/college-elective-offering-manager.tsx:112-135`
- Fix: Restore nested offering faculty, allocation, roster drawer interactions with correct focus return

## G2-10-006-052  [P1] GAP  facet F12  effort M
- Legacy: Old capacity nullable allows unlimited seats in offering `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:169-174` `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-79`
- vNext now: New UI requires capacity 1..100000 and defaults30 `src/components/electives/college-elective-offering-manager.tsx:50-68` `src/components/electives/college-elective-offering-manager.tsx:152-155`
- Fix: Support null unlimited capacity and display unlimited where chosen

## G2-10-006-075  [P1] GAP  facet F21  effort L
- Legacy: Old roster allocation and faculty changes happen synchronously in controller service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:153-195`
- vNext now: New offering manager does not expose faculty assignment; roster is separate route `src/components/electives/college-elective-offering-manager.tsx:119-135`
- Fix: Ensure synchronous faculty and allocation operations stay available under authorized superadmin acting-college role

## G2-9-007-031  [P1] GAP  facet F06  effort L
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:214-223` — Offering Course + optional unlimited capacity, creates backed class
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:135-156` — Requires linked delivery, numeric capacity default30, optional group
- Fix: Restore automatic offering class and unlimited capacity policy

## G2-9-007-045  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/electives/ElectiveAdminController.java:124-159` — Offering create/update/archive/faculty endpoints
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:71-100` — Offering POST/PATCH/DELETE; faculty on roster server actions
- Fix: Verify exact side effects across group, class, delivery and faculty

## G2-9-007-053  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:305-352` — Offering creation creates group and GROUP_BACKED class
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:135-149` — New flow requires pre-existing delivery selector
- Fix: Restore backed class auto-create or offer equivalent action

## G2-10-006-038  [P2] GAP  facet F08  effort S
- Legacy: Old offering create success Offering added; faculty Faculty updated; capacity Capacity updated `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:71-126`
- vNext now: New offering messages Offering added. Offering updated. no matching faculty operation `src/components/electives/college-elective-offering-manager.tsx:68-85`
- Fix: Restore exact notification placement and faculty/capacity-specific messages

## G2-9-007-039  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:78-125` — Offering added, Faculty updated, Capacity updated toasts
- vNext now: `src/components/electives/college-elective-offering-manager.tsx:80-85` — Inline Offering added. / Offering updated. and roster status
- Fix: Use specific legacy wording and toast delivery

## G2-10-006-039  [P3] GAP  facet F08  effort S
- Legacy: Old archive success Offering archived, error API text in toast `docs/legacy-source/frontend/src/components/admin/electives/ElectiveSlotPanel.jsx:133-145`
- vNext now: New status inline Offering archived. and raw error `src/components/electives/college-elective-offering-manager.tsx:89-101`
- Fix: Align punctuation and toast placement
