# Work packet (wave 2): edit src/components/admin/person-onboard-dialog.tsx

31 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-5/u031-admin-users.md, docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md

## G2-1-007-002  [P2] GAP  facet F01  effort M
- Legacy: `SuperAdminUserAdminController.java:170-222` POST `/faculty-admins` creates ADMIN/TPO.
- vNext now: `src/components/admin/person-onboard-dialog.tsx:69-84` POST people onboarding with membership roles; `admin/faculty/page.tsx:22` forced FACULTY.
- Fix: Provide superadmin-only COLLEGE_ADMIN/TPO choice at targeted college rather than only forced FACULTY selector.

## G2-1-007-009  [P2] GAP  facet F03  effort M
- Legacy: `AdminUsers.js:175-198` suspend and reactivate action, sessions and history buttons.
- vNext now: `person-onboard-dialog.tsx:69-84`, `scoped-membership-lifecycle-actions.tsx` membership role/status actions plus admin details.
- Fix: Replicate compact row actions for role-specific management and history.

## G2-1-007-012  [P2] GAP  facet F04  effort M
- Legacy: `SuperAdminUserAdminController.java:221` create response `{user: Faculty}` with numeric id, role and contact.
- vNext now: `person-onboard-dialog.tsx:69-84` returns canonical user/membership from different API.
- Fix: Update old form response consumers and refresh correct role row.

## G2-1-007-019  [P2] GAP  facet F06  effort M
- Legacy: `SuperAdminUserAdminController.java:175-183` collegeId positive, normalized valid 10-digit Indian contactMobile.
- vNext now: `person-onboard-dialog.tsx:69-84,142-160` first/last name required and Indian mobile on forced FACULTY.
- Fix: Apply uniform 10-digit mobile validation to admin/TPO onboarding with field-level errors.

## G2-1-007-020  [P2] GAP  facet F06  effort S
- Legacy: `SuperAdminUserAdminController.java:201-209` name/mail optional trim; userType FACULTY.
- vNext now: `person-onboard-dialog.tsx:142-159` forced faculty names both required, generic displayName required.
- Fix: Decide intentional stricter required-name policy and migrate imported blank name handling.

## G2-1-007-030  [P2] GAP  facet F09  effort M
- Legacy: `AdminUsers.js:205-220,273-300` confirm flows via AntD Modal.confirm, sessions overlay.
- vNext now: `admin-revoke-sessions.tsx:44-48` ConfirmDialog, onboard dialog `person-onboard-dialog.tsx:130-149`.
- Fix: Match legacy modal geometry, button order, destructive styling and disabled state.

## G2-1-007-031  [P2] GAP  facet F10  effort M
- Legacy: `SuperAdminUserAdminController.java:170-222` inserts Faculty identity and audits FACULTY_ADMIN_CREATE.
- vNext now: `person-onboard-dialog.tsx:69-84` identity+membership onboarding and activity taxonomy, separate people service.
- Fix: Map audit event role, contact, tenant fields; ensure atomic membership create.

## G2-1-007-046  [P2] GAP  facet F16  effort M
- Legacy: `AdminUsers.js:205-220` row actions/multi-modal patterns from AntD; responsive organization filter form.
- vNext now: `admin/people/page.tsx:140-189` responsive filters and table, `person-onboard-dialog.tsx:130-149` mobile full-width actions.
- Fix: Live visual compare 375/768/1280 for filter collapse and modal button order.

## G2-18-031-039  [P2] GAP  facet F09  effort M
- Legacy: Legacy register in expandable section and full profile modal, Faculty reassign action popup; Students.js:1103-1130,982-989;Faculty.js:828-835,940-979
- vNext now: vNext PersonOnboardDialog and profile Dialog, reassignment component; person-onboard-dialog.tsx:120-153;admin/faculty/page.tsx:36-44
- Fix: Audit every trigger open/close, Escape, focus return, busy disable and mobile drawer sizing

## G2-18-031-061  [P2] GAP  facet F15  effort S
- Legacy: Legacy create toast promises phone OTP login; Students.js:509;Faculty.js:408
- vNext now: vNext identity provision does not send an invite/email at onboard; person-onboard-dialog.tsx:106-113;identity-provisioning.ts:36-64
- Fix: Distinguish 'can sign in' from 'sent notification'; update copy only if login provisioning succeeds

## G2-18-031-064  [P2] GAP  facet F16  effort M
- Legacy: Legacy Students/Faculty AntD Actions column pinned right from md screens and responsive grids xs24/lg12; Students.js:959-965,1131-1221;Faculty.js:796-801,979-1105
- vNext now: vNext page responsive forms with md:grid-cols-2, mobile 44px controls; college-student-register-form.tsx:70-124;person-onboard-dialog.tsx:120-155
- Fix: Clone breakpoint for pinned actions and original form columns; test 375/768/1280 without action overflow

## G2-18-031-067  [P2] GAP  facet F17  effort S
- Legacy: Legacy Form.Item has required labels, named errors, person selection, popconfirm cancel; Students.js:1134-1221;Faculty.js:983-1061
- vNext now: vNext native labels/aria roles but some errors top-level banner rather than field; college-student-register-form.tsx:70-132;person-onboard-dialog.tsx:153-253
- Fix: Attach field errors with aria-describedby and focus invalid field after rejected submit

## G2-18-031-068  [P2] GAP  facet F18  effort S
- Legacy: Legacy Student account headings Students, Register students, Roll No., Student registered successfully...; Students.js:928-936,1093-1105,509
- vNext now: vNext Registered Students, Register student/First Name/Roll Number and generic Onboard person on SA People; admin/students/page.tsx:62-84;person-onboard-dialog.tsx:120-148
- Fix: Use exact legacy title/action labeling when a vNext action serves same purpose

## G2-18-031-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy Faculty header Faculty, registration Register faculty, Type, Faculty updated successfully!; Faculty.js:769-784,940-952,465
- vNext now: vNext Registered Faculty, Register New Faculty, Faculty type/mentor checkbox and membership changes; admin/faculty/page.tsx:21-44;person-onboard-dialog.tsx:120-148,215-225
- Fix: Match visible faculty chrome while documenting multi-role changes

## G2-5-031-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy create Card titled `Create College Admin or TPO`; form grid three columns at desktop. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:361-426`
- vNext now: vNext separate modal onboarding, not inline card. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:20-29`, `src/components/admin/person-onboard-dialog.tsx:118-155`
- Fix: Match inline create form dimensions/ordering.

## G2-5-031-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy Create and Clear buttons at form end. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:420-423`
- vNext now: vNext Onboard person modal Cancel/Onboard buttons; no Clear button. `src/components/admin/person-onboard-dialog.tsx:118-149`
- Fix: Use exact Create/Clear and reset behavior in admin editor.

## G2-5-031-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy create fields Role default ADMIN; First Name; Last Name; Email; Mobile; optional Org; fixed College. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:377-417`
- vNext now: vNext forced role from which Onboard button clicked; split First/Last and mobile, optional email; no Organization selector. `src/components/admin/person-onboard-dialog.tsx:42-49,153-155`
- Fix: Align form field order, role dropdown and scoped organization read-only display.

## G2-5-031-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy Clear resets form/errors and reports dirty=false. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:420-422`
- vNext now: vNext reset after successful onboarding, Cancel closes but fields may persist until next open. `src/components/admin/person-onboard-dialog.tsx:54-59,104-112`
- Fix: Clear all values/field errors on cancel/new open.

## G2-5-031-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy role can be changed between ADMIN and TPO within same form. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:379-415`
- vNext now: vNext forcedRole per button; user cannot switch role in dialog. `src/components/admin/person-onboard-dialog.tsx:32-37,48-50`
- Fix: Provide role selector or equivalent direct button UX.

## G2-5-031-052  [P2] GAP  facet F16  effort M
- Legacy: Legacy create form Row gutter12 with three columns md8, one column phone. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:377-425`
- vNext now: vNext dialog two columns at md breakpoint. `src/components/admin/person-onboard-dialog.tsx:153-155`
- Fix: Match 3-column form and mobile stack/touch targets.

## G2-5-031-055  [P2] GAP  facet F17  effort M
- Legacy: Legacy email/tel autocomplete attributes; field error under Form.Item. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:394-400`
- vNext now: vNext Inputs/Toast but no same Form.Item field validation. `src/components/admin/person-onboard-dialog.tsx:153-155`
- Fix: Keep explicit labels and autocomplete/inputmode/aria-invalid.

## G2-5-031-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy `Create College Admin or TPO`, `Admin user was not created`. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:363-372`
- vNext now: vNext `College Admin and TPO accounts` + `Onboard person`. `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:21-31`, `src/components/admin/person-onboard-dialog.tsx:89-100`
- Fix: Match exact card/error headings.

## G2-5-031-063  [P2] GAP  facet F20  effort M
- Legacy: Legacy college switch resets dirty and refreshes role list, could hide unsaved form. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:58-64,104-124`
- vNext now: vNext create modal can be reopened with reset but no cross-route dirty guard. `src/components/admin/person-onboard-dialog.tsx:54-59`
- Fix: Confirm dirty on tenant switch.

## G2-6-001-006  [P2] GAP  facet F03  effort S
- Legacy: Old primary action `Register faculty` with plus icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:950-957`
- vNext now: New action `Register New Faculty` without plus icon `src/components/college/college-role-directory-workspace.tsx:91-93` `src/components/admin/person-onboard-dialog.tsx:118-127`
- Fix: Match exact action caption, plus glyph, and placement

## G2-6-001-058  [P2] GAP  facet F16  effort M
- Legacy: Old registration cards half-width at lg and full-width at xs `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:975-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1110-1114`
- vNext now: New modal grid becomes two columns at md and import is another page `src/components/admin/person-onboard-dialog.tsx:150-164` `src/app/(authenticated)/college/faculty/import/page.tsx:15-20`
- Fix: Match card/panel stacking and desktop 50/50 layout

## G2-6-001-062  [P2] GAP  facet F18  effort S
- Legacy: Old visible form heading `Register New Faculty` and list `Registered Faculty` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:978-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1275-1278`
- vNext now: New button/dialog `Register New Faculty`, list header `Faculty` `src/components/admin/person-onboard-dialog.tsx:118-127` `src/components/college/college-role-directory-workspace.tsx:84-99`
- Fix: Keep registered-faculty section heading and registration button's older caption

## G2-6-002-007  [P2] GAP  facet F03  effort S
- Legacy: Old header CTA says `Register faculty` with PlusOutlined `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:950-957`
- vNext now: New header CTA says `Register New Faculty` `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:118-127`
- Fix: Use exact caption/icon and open inline accordion

## G2-6-002-031  [P2] GAP  facet F06  effort S
- Legacy: Old mobile maxLength=10, inputMode tel and autocomplete tel `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1003-1010`
- vNext now: New phone input has inputMode tel but no 10 maxLength `src/components/admin/person-onboard-dialog.tsx:183-198`
- Fix: Cap 10 digits for faculty-only phone and retain mobile autofill semantics

## G2-6-002-072  [P2] GAP  facet F16  effort M
- Legacy: Old `Row/Col` registration becomes one column on phone and two on lg `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:975-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1110-1114`
- vNext now: New onboarding uses md two-column dialog; import one-column disclosure `src/components/admin/person-onboard-dialog.tsx:149-163` `src/components/admin/super-admin-faculty-bulk-import.tsx:87-96`
- Fix: Match card stacking at breakpoints and preserve mobile minimum touch target

## G2-6-003-009  [P2] GAP  facet F03  effort S
- Legacy: Old Faculty nested overview has `Register faculty` CTA `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-956`
- vNext now: New `PersonOnboardDialog` button `Register New Faculty` `src/app/(authenticated)/admin/faculty/page.tsx:21-23` `src/components/admin/person-onboard-dialog.tsx:118-126`
- Fix: Preserve exact CTA phrase/icon

## G2-6-003-032  [P2] GAP  facet F14  effort M
- Legacy: Old Faculty CSV five columns with Faculty Type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:746-755`
- vNext now: New admin bulk CSV sample four fields `src/app/(authenticated)/admin/faculty/page.tsx:25-28` `src/components/admin/person-onboard-dialog.tsx:75-84`
- Fix: Restore fifth Faculty Type template column and validation rules
