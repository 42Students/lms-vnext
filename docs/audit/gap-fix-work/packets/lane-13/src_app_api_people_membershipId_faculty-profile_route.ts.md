# Work packet: edit src/app/api/people/[membershipId]/faculty-profile/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-002  [P1] GAP  facet F01  effort L
- Legacy: `ProfileSectionsPanel.js:481-493`, `Faculty.js:1-7` admin opens profile section editor from faculty roster using faculty ID.
- vNext now: `src/app/api/people/[membershipId]/faculty-profile/route.ts:18-70` offers admin academic profile GET/PUT; `details/page.tsx:13` only permits own FACULTY membership for full sections.
- Fix: Provide college-admin authorized full faculty profile read/edit for supported sections or document explicit product restriction with owner approval.

## G2-1-003-048  [P1] GAP  facet F11  effort L
- Legacy: `FacultyProfileController.java:55-89` admin can access same-college faculty; non-admin faculty self-only; learner denied; superadmin allowed.
- vNext now: `teacher/profile/details/page.tsx:11-15` requires active FACULTY membership for own self doc; admin academic route `people/[membershipId]/faculty-profile/route.ts:18-69` has separate scoped permissions.
- Fix: Provide full authorized staff profile access for admin/superadmin respecting college scope and no learner access.

## G2-1-003-049  [P1] GAP  facet F11  effort L
- Legacy: `FacultyProfileController.java:91-106` college admin can read another ADMIN/TPO profile but cannot write; superadmin allowed.
- vNext now: `faculty-self-section-model.ts:25-30` only own nonidentity sections; admin `people/[membershipId]/faculty-profile/route.ts:18-69` limited academic columns.
- Fix: Reimplement protected-role read/write distinction in full profile admin editor and API.
