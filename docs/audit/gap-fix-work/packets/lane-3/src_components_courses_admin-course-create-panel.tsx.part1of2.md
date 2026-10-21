# Work packet: edit src/components/courses/admin-course-create-panel.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-18/u003-superadmin-courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-12-003-012  [P1] GAP  facet F03  effort S
- Legacy: Create/editor fields department,name,short title,official code,intro heading,description,takeaways,image,color,visible switch `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:41-94`
- vNext now: Create fields department/name/short title/official code/takeaways/card color/description, no intro heading,image, visible switch `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Restore missing page fields or document data-model exclusion

## G2-12-003-024  [P1] GAP  facet F06  effort S
- Legacy: Short display name required max64, placeholder e.g. DSA `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:52-55`
- vNext now: Short display name required max120 without placeholder `src/components/courses/admin-course-create-panel.tsx:305-309`
- Fix: Use max64 and placeholder to match legacy

## G2-12-003-026  [P1] MISSING  facet F06  effort S
- Legacy: Required `In this Course – Heading`, 255 max `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-67`
- vNext now: No introduction heading field `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Add heading field and persist/display semantics

## G2-12-003-027  [P1] GAP  facet F06  effort S
- Legacy: Required `In this Course – Description`, textarea rows3 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:68-71`
- vNext now: Optional Description max5000, placeholder `Optional Course description` `src/components/courses/admin-course-create-panel.tsx:328-331`
- Fix: Require and label home-page intro description

## G2-12-003-029  [P1] MISSING  facet F06  effort S
- Legacy: Upload Image/Change Image/Remove image with preview `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- vNext now: No image upload UI in create `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Add signed upload and image controls

## G2-12-003-031  [P1] GAP  facet F06  effort S
- Legacy: Course visible to students switch defaults true and controls `active`, `enabled` `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-95`
- vNext now: New course status defaults ACTIVE automatically, no switch `src/components/courses/admin-course-create-panel.tsx:190-207`
- Fix: Expose initial visibility and course-level toggle

## G2-12-003-033  [P1] GAP  facet F07  effort S
- Legacy: AntD required messages Enter a course name, Enter short display name, Enter heading, Enter course description `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:46-70`
- vNext now: HTML required for two fields; others optional, native messages `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Provide each exact field error

## G2-12-003-035  [P1] GAP  facet F07  effort S
- Legacy: Map create API errors course_name,short_title,dept_id to Form.Item `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:269-276`
- vNext now: Toast generic academicSetupErrorMessage; no field focus/errors `src/components/courses/admin-course-create-panel.tsx:173-187`
- Fix: Restore field-key mapping

## G2-12-003-046  [P1] GAP  facet F10  effort S
- Legacy: Legacy course create payload course_name,short_title,dept_id, active+enabled, allowedForDisplay, nested meta_data `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:229-253`
- vNext now: POST /api/courses flat departmentId,name,code,shortTitle,officialCode,cardColor,takeaways,description `src/components/courses/admin-course-create-panel.tsx:190-207`
- Fix: Document all dropped/flattened fields and defaults

## G2-12-003-048  [P1] GAP  facet F10  effort S
- Legacy: Duplicate prefill copies image, takeaways, heading, color, code and name (Copy), scroll and focus `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:306-317`
- vNext now: Prefill metadata and catalog fields with warning only catalog name/code/description/department copied `src/components/courses/admin-course-create-panel.tsx:105-115,288-292`
- Fix: Restore duplicate metadata coverage and focus flow

## G2-12-003-064  [P1] MISSING  facet F14  effort S
- Legacy: R2 course image presign upload and old-image deletion after update `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84,214-227`
- vNext now: No upload widget or image cleanup path `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Implement storage API signed upload and cleanup

## G2-12-003-082  [P1] MISSING  facet F21  effort S
- Legacy: External R2 presign image uploads and deleteFileFromR2 `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-227`
- vNext now: No external R2 calls from course form `src/components/courses/admin-course-create-panel.tsx:190-207`
- Fix: Use current signed GCP storage abstraction for image parity

## G2-18-003-013  [P1] GAP  facet F03  effort L
- Legacy: Legacy Preview Image 100px with Change/Upload/Remove controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:76-84`
- vNext now: vNext `admin-course-create-panel` controls metadata and colour, image upload not present in mapped Course step. `src/components/courses/admin-course-create-panel.tsx:110-129`, `src/components/courses/admin-course-create-panel.tsx:174-225`
- Fix: Implement signed-image upload preview/remove with same role/access and cancel semantics.

## G2-18-003-100  [P1] MISSING  facet F19  effort M
- Legacy: Legacy image upload async presign can outlive scope but sequence token ignores stale result. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:185-211`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`
- vNext now: vNext no upload implementation to protect. `src/components/courses/admin-course-create-panel.tsx:173-225`
- Fix: When adding upload, fence by collegeId and abort/ignore stale results.

## G2-3-008-027  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:52-60`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:305-327`
- Fix: Legacy short display name required max64, official code optional max40, new college code required max64 and shortTitle/officialCode hidden. Restore old field requirements.

## G2-3-008-028  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-70`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:328-332`
- Fix: Legacy introduction heading required <=255 and description required; vNext no heading and description optional <=5000.

## G2-3-008-031  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:90-94`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:549-555`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:190-205`; `src/components/courses/admin-course-create-panel.tsx:328-334`
- Fix: Legacy active/enabled/allowedForDisplay default true and switch; new always ACTIVE course creation, no Visible to students control/warning.

## G2-3-008-073  [P1] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-227`
- vNext now: `src/components/courses/admin-course-create-panel.tsx:190-205`
- Fix: Old upload seq invalidates stale presign when college switches and deletes stale image; new no media control, need same safety on restore.

## G2-12-003-040  [P2] MISSING  facet F08  effort S
- Legacy: Image upload success/error toasts `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:222-225`
- vNext now: No image upload so no corresponding messages `src/components/courses/admin-course-create-panel.tsx:294-334`
- Fix: Restore image upload feedback with upload control

## G2-18-003-044  [P2] GAP  facet F07  effort M
- Legacy: Legacy missing department error `Departments could not be loaded` and Retry. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:519-525`
- vNext now: vNext create page uses typed workspace data/permission boundaries; no equivalent local fetch alert visible in create component. `src/components/courses/admin-course-create-panel.tsx:94-100`, `src/app/(authenticated)/admin/courses/page.tsx:64-69`
- Fix: Show scoped department-fetch failure separately with retry and preserve last known list only if valid.
