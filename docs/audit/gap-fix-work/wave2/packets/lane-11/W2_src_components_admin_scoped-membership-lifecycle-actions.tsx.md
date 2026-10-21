# Work packet (wave 2): edit src/components/admin/scoped-membership-lifecycle-actions.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/super-admin-user-admin-controller.md, docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md

## G2-1-007-009  [P2] GAP  facet F03  effort M
- Legacy: `AdminUsers.js:175-198` suspend and reactivate action, sessions and history buttons.
- vNext now: `person-onboard-dialog.tsx:69-84`, `scoped-membership-lifecycle-actions.tsx` membership role/status actions plus admin details.
- Fix: Replicate compact row actions for role-specific management and history.

## G2-14-002-014  [P2] GAP  facet F03  effort S
- Legacy: Legacy Delete Student icon permanently deletes including attendance; vNext only reversible membership lifecycle — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1085`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Record removal as intentional if owner agrees; avoid restoring unsafe destructive behavior

## G2-14-002-052  [P2] GAP  facet F09  effort M
- Legacy: Legacy Clear OTP/Impersonate/Delete confirmation Popconfirms; vNext only lifecycle confirmation — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:990-1085`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:35-62`
- Fix: Implement approved confirmations; deletion intentional removal pending policy

## G2-14-002-055  [P2] GAP  facet F10  effort S
- Legacy: Legacy delete DELETE /api/v1/learner/delete/{id}; vNext lifecycle status transition only — `docs/legacy-source/frontend/src/api/Services/AdminService.js:300-301`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:581-591`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:90-90`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Record retention-policy divergence before any destructive implementation

## G2-14-002-095  [P2] GAP  facet F22  effort M
- Legacy: Legacy delete records including attendance; vNext membership ENDED lifecycle no direct delete — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1066-1085`
- vNext now: `src/app/(authenticated)/admin/students/page.tsx:20-20`; `src/components/admin/scoped-membership-lifecycle-actions.tsx:18-33`
- Fix: Document retention equivalence and deletion decision

## G2-18-031-038  [P2] GAP  facet F09  effort M
- Legacy: Legacy destructive actions use AntD Popconfirm exact Suspend Student/Faculty, Reactivate, Delete and optional impersonate, lockout; Students.js:990-1085;Faculty.js:837-934
- vNext now: vNext ConfirmDialog with separate text reason for suspend, no hard delete in scoped actions; scoped-membership-lifecycle-actions.tsx:36-60
- Fix: Clone modal/popconfirm geometry and warning copy; show reason/confirm without losing initial context

## G2-18-031-066  [P2] GAP  facet F17  effort S
- Legacy: Legacy icon actions include descriptive aria-label identifying student/faculty, Popconfirm keyboard focus; Students.js:966-1084;Faculty.js:803-935
- vNext now: vNext row action dialogs and confirm use Button/ConfirmDialog, status live regions; scoped-membership-lifecycle-actions.tsx:36-62
- Fix: Preserve role+person named accessible labels, focus return and announced errors on every icon
