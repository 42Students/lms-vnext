# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u008-superadmin-classes.md

36 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u008-superadmin-classes.md

## G2-5-008-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: SuperAdminGroupShell academic group and classes active item (docs/legacy-source/frontend/src/pages/superadmin/classes.js:23-29)
- vNext now: Standalone PageHeader and AcademicSetupSteps step6 (src/app/(authenticated)/admin/classes/page.tsx:34-37)
- Fix: Restore grouped Academic Setup navigation and selected Classes item.

## G2-5-008-002  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: No scope warning Alert title Select a college to continue + exact sentence (docs/legacy-source/frontend/src/pages/superadmin/classes.js:10-21)
- vNext now: Standalone p role=status concatenates both strings (src/app/(authenticated)/admin/classes/page.tsx:37)
- Fix: Use warning Alert icon and border/padding as original.

## G2-5-008-005  [P2] GAP  facet F02 Layout/section order  effort L
- Legacy: Two-column Create New Class/Section left; Existing Classes/Sections right (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:440-465)
- vNext now: Collapsed Create class first, then filter form and full-width Manage classes (src/app/(authenticated)/admin/classes/page.tsx:38-76)
- Fix: Restore side-by-side 10/14 columns and always-open create form.

## G2-5-008-006  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Title Classes & Sections, full explanatory subtitle (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:442-443)
- vNext now: PageHeader title Classes no description (src/app/(authenticated)/admin/classes/page.tsx:35)
- Fix: Use exact Classes & Sections and subtitle.

## G2-5-008-007  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Toolbar above directory: Refresh, Export classes.csv, result count, search/program/batch (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:467-512)
- vNext now: Filters before table, Refresh inside form, CSV absent from page (src/app/(authenticated)/admin/classes/page.tsx:40-76)
- Fix: Restore toolbar including Export CSV and result count.

## G2-5-008-009  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Create New Class/Section card visible by default and Save+Add Another (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:448-464)
- vNext now: Create class disclosure closed by default (src/components/academics/college-section-management.tsx:78-143)
- Fix: Open permanently with exact heading/action.

## G2-5-008-014  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Table columns Class Name, Program, Batch, Max Students, Description, Students, Actions (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-402)
- vNext now: Class, Program, Batch, Description, Students, Max Students, Actions; reordered (src/app/(authenticated)/admin/classes/page.tsx:81-96)
- Fix: Restore legacy column order and capitalization.

## G2-5-008-016  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Capacity 0 displays No limit; positive number otherwise (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:395-397)
- vNext now: Null shows dash, 0 displayed as numeric (src/app/(authenticated)/admin/classes/page.tsx:94)
- Fix: Align sentinel zero/no limit mapping and migrate.

## G2-5-008-017  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Students tag Unavailable on failed count (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:399-402)
- vNext now: Active learner count numeral with Class full chip (src/app/(authenticated)/admin/classes/page.tsx:90-93)
- Fix: Differentiate count error from real zero, preserve Unavailable.

## G2-5-008-020  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: AntD table fixed 7 headers; Edit/Schedule/Delete in Actions (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:389-427)
- vNext now: DataTable 7 headers and inline Manage students/Schedule links (src/app/(authenticated)/admin/classes/page.tsx:79-96)
- Fix: Restore cell order/spacing and legacy action controls.

## G2-5-008-022  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: Program selector dependent searchable Batch, 165px (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:485-494)
- vNext now: Program Select and Batch code text search independently (src/app/(authenticated)/admin/classes/page.tsx:42-52)
- Fix: Restore dependent Batch picklist and disable state.

## G2-5-008-025  [P2] GAP  facet F06 Forms  effort M
- Legacy: Program and Batch searchable AntD Select, Batch disabled until program (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:63-77)
- vNext now: Native selects with batch list and selected program; disable semantics differ (src/components/academics/college-section-management.tsx:89-104)
- Fix: Restore searchable Select and select-program-first placeholder.

## G2-5-008-034  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Create errors mapped to individual AntD form inputs (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:242-247)
- vNext now: Single error notice for first Zod issue (src/components/academics/college-section-management.tsx:59-74)
- Fix: Display per-field server errors/focus first invalid.

## G2-5-008-036  [P2] GAP  facet F08 Success/toasts  effort S
- Legacy: Created class “NAME”. Next, register or move students into this section. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:235-249)
- vNext now: Class created. notice (src/components/academics/college-section-management.tsx:68-74)
- Fix: Use exact named success toast, reset form accordingly.

## G2-5-008-038  [P2] MISSING  facet F08 Success/toasts  effort S
- Legacy: Deleted class “NAME”. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:293-301)
- vNext now: Archive/Restore instead, no deletion toast (src/components/academics/college-section-lifecycle-action.tsx:25-37)
- Fix: Restore delete success and failure feedback.

## G2-5-008-039  [P2] MISSING  facet F08 Success/toasts  effort S
- Legacy: Scheduled X of N recurring sessions toast (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:355-362)
- vNext now: No recurring action in this page (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Provide exact recurrence outcomes and feedback.

## G2-5-008-040  [P2] GAP  facet F09 Modals/drawers  effort M
- Legacy: Edit class “NAME” modal width550, mask nonclosable (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:513-525)
- vNext now: Edit class NAME Dialog and differing button case (src/components/academics/college-section-management.tsx:191-234)
- Fix: Match title quotes, dialog size and closure guard.

## G2-5-008-041  [P2] GAP  facet F09 Modals/drawers  effort S
- Legacy: Discard edits to “NAME”? unsaved changes will be lost (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:263-266)
- vNext now: Discard unsaved class changes? different text (src/components/academics/college-section-management.tsx:229-233)
- Fix: Restore named title/detail.

## G2-5-008-044  [P2] GAP  facet F10 Actions/side effects  effort L
- Legacy: POST /api/v1/class/create with program_id,batch_id,name,limits (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:235-249; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-106)
- vNext now: POST /api/college/classes, cohortId/period/name/code/capacity (src/modules/academics/college-section-mutation-service.ts:156-178)
- Fix: Ensure payload mapping and name/description preservation.

## G2-5-008-050  [P2] GAP  facet F11 Permissions  effort S
- Legacy: Missing college warning without redirect (docs/legacy-source/frontend/src/pages/superadmin/classes.js:10-21)
- vNext now: Missing college paragraph status not alert (src/app/(authenticated)/admin/classes/page.tsx:37)
- Fix: Match alert and avoid accidental denial state.

## G2-5-008-056  [P2] GAP  facet F13 States  effort S
- Legacy: Filtered empty vs missing classes vs read failure distinct (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:506-508)
- vNext now: No matching classes on this page for any empty (src/app/(authenticated)/admin/classes/page.tsx:80)
- Fix: Restore context-specific empty/error messages.

## G2-5-008-057  [P2] GAP  facet F13 States  effort M
- Legacy: Option failure warning retry (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- vNext now: No partial error banner (src/app/(authenticated)/admin/classes/page.tsx:28-33)
- Fix: Catch/Retry option load separately.

## G2-5-008-058  [P2] MISSING  facet F14 Exports  effort M
- Legacy: Export classes.csv in table toolbar, all filtered rows (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:468-476)
- vNext now: No Export CSV link on Super Admin page (src/app/(authenticated)/admin/classes/page.tsx:34-108)
- Fix: Add scoped classes.csv with exact headers and all filtered rows.

## G2-5-008-061  [P2] GAP  facet F16 Responsive  effort L
- Legacy: AntD Row create col10 / directory col14 desktop, xs24 stack (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:446-467)
- vNext now: Full width create/filter/table stacked all breakpoints (src/app/(authenticated)/admin/classes/page.tsx:38-108)
- Fix: Restore 10/14 desktop split.

## G2-5-008-064  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Delete disabled has meaningful tooltip/aria action names (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:410-423)
- vNext now: Management anchor labels, no Delete tooltip (src/app/(authenticated)/admin/classes/page.tsx:84-95)
- Fix: Reinstate accessible action explanation.

## G2-5-008-065  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Retry options action accessible (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:430-435)
- vNext now: No Retry for options (src/app/(authenticated)/admin/classes/page.tsx:28-33)
- Fix: Expose keyboard-operable retry.

## G2-5-008-068  [P2] GAP  facet F18 Wording  effort S
- Legacy: Create Class & Add Another, Add Another meaning retain context (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:459-462)
- vNext now: Create class action (src/components/academics/college-section-management.tsx:133-143)
- Fix: Match exact wording and retention behavior.

## G2-5-008-073  [P2] GAP  facet F20 Concurrency/time  effort M
- Legacy: Delete actionRef prevents double delete and Retry after error (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:287-306)
- vNext now: Archive inFlight lock, no delete retry (src/components/academics/college-section-lifecycle-action.tsx:15-39)
- Fix: Add guarded delete and safe Retry.

## G2-5-008-074  [P2] GAP  facet F21 Integrations  effort M
- Legacy: Create/update/delete audit trail through controller (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:75-106; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-255)
- vNext now: Activity events on create/update/archive (src/modules/academics/college-section-mutation-service.ts:156-236)
- Fix: Keep true DELETE event semantics vs archive.

## G2-5-008-075  [P2] GAP  facet F21 Integrations  effort L
- Legacy: Recurring schedule API writes sessions for permitted faculty/time (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:338-364; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminClassScheduleController.java:92-201)
- vNext now: Navigation to separate schedule page instead of direct action (src/app/(authenticated)/admin/classes/page.tsx:84-85)
- Fix: Connect Super Admin recurrence through scoped service.

## G2-5-008-010  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: Plus button Create Class & Add Another (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:459-462)
- vNext now: Create class button no plus icon (src/components/academics/college-section-management.tsx:133-137)
- Fix: Restore icon and copy.

## G2-5-008-018  [P3] GAP  facet F04 Data formatting  effort S
- Legacy: Description tooltip and ellipsis (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:398)
- vNext now: Full description or —, no ellipsis (src/app/(authenticated)/admin/classes/page.tsx:89)
- Fix: Restore ellipsis/tooltip on long descriptions.

## G2-5-008-026  [P3] GAP  facet F06 Forms  effort S
- Legacy: Class/Section Name placeholder e.g. CSE-A or Section 1 (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:79-85)
- vNext now: Class name field no example placeholder (src/components/academics/college-section-management.tsx:115-118)
- Fix: Restore exact example.

## G2-5-008-037  [P3] GAP  facet F08 Success/toasts  effort S
- Legacy: Updated class “NAME”. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285)
- vNext now: Class updated. inline (src/components/academics/college-section-management.tsx:175-180)
- Fix: Match exact update toast/copy.

## G2-5-008-067  [P3] GAP  facet F18 Wording  effort S
- Legacy: Search placeholder Search class, program, batch or capacity (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:469-470)
- vNext now: Label Search class, program or batch, no input placeholder (src/app/(authenticated)/admin/classes/page.tsx:53-55)
- Fix: Restore capacity and placeholder.

## G2-5-008-072  [P3] GAP  facet F20 Concurrency/time  effort S
- Legacy: Dirty edit cancel confirmation (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:263-266)
- vNext now: Dirty edit confirm exists but different words (src/components/academics/college-section-management.tsx:229-233)
- Fix: Align dialog wording.
