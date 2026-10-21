# Work packet (wave 3): edit src/components/courses/faculty-lesson-authoring.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-all-assignments.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-4-012-026  [P1] MISSING  facet F06  effort L
- Legacy: Visibility dropdown defaults CLASS with SHARED alternative; locked on teacher edit. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:22-29`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:579-593`)
- vNext now: New creation always has deliveryId and no visibility picker. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Add CLASS/SHARED selector with permissions and scope writes.

## G2-4-012-030  [P1] MISSING  facet F06  effort L
- Legacy: Legacy starts with one Instructions resource; Add resource permits PDF/FILE/LINK repeats. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:109-110`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:735-766`)
- vNext now: New assignment create payload contains no resources. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Build repeatable resource editor with one Instructions constraint.

## G2-4-012-038  [P1] MISSING  facet F07  effort L
- Legacy: PDF-only upload validator and File upload failed. Try again toast. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:312-336`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:825-832`)
- vNext now: New assignment create lacks upload. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Add MIME/error handling plus upload retry.

## G2-4-012-065  [P1] MISSING  facet F14  effort L
- Legacy: Legacy PDF and FILE resources use presigned upload, Drive import fallback. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:312-332`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:803-877`)
- vNext now: New create sends no resources or files. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Restore signed uploads, Drive import and receipt persistence.

## G2-4-012-084  [P1] MISSING  facet F21  effort L
- Legacy: Legacy has presigned R2 upload and Drive import integration. (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:312-332`; `docs/legacy-source/frontend/src/components/Global/Offcanvas/Assignment/newAssignment.js:803-877`)
- vNext now: New assignment create has no resource upload. (`src/components/courses/faculty-lesson-authoring.tsx:384-398`)
- Fix: Restore signed resource upload and Drive integration or mark deliberate non-parity.

## G2-9-025-010  [P1] MISSING  facet F03  effort L
- Legacy: Multi-file upload input accepts selected extensions; disabled during save/upload or 20 materials `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:389-390`
- vNext now: Resource authoring only notes or externalUrl, no file input `src/components/courses/faculty-lesson-authoring.tsx:274-299` `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Add authenticated R2/GCS signed-upload/file receipt workflow, multi-upload, 20 cap with scan gating.

## G2-9-025-023  [P1] MISSING  facet F06  effort L
- Legacy: Editor fields Title, Notes, Add files, HTTPS link and optional link title `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:383-394`
- vNext now: New resource composer fields title, points, notes, URL; no file list/title input `src/components/courses/faculty-lesson-authoring.tsx:274-296` `src/components/courses/super-admin-content-authoring.tsx:26-29`
- Fix: Restore mixed-material composer fields and file/link titles.

## G2-9-025-046  [P1] MISSING  facet F12  effort L
- Legacy: Maximum20 files/links, supported file formats and 50MB cap `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:18-19,210-253`
- vNext now: Resource composer lacks material array and upload validation `src/components/courses/faculty-lesson-authoring.tsx:274-299`
- Fix: Implement MAX_MATERIALS and upload validations.

## G2-9-025-053  [P1] MISSING  facet F14  effort L
- Legacy: Multiple local file uploads, R2 object receipt metadata title/MIME/size `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:389-402`
- vNext now: No SA resource file upload field `src/components/courses/faculty-lesson-authoring.tsx:274-299`
- Fix: Implement secure private object receipts and attachment manifest.

## G2-9-025-072  [P1] MISSING  facet F23  effort L
- Legacy: Old composer supports multiple files/links with notes in one resource `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:324-416`
- vNext now: New authoring supports a single URL + notes and metadata-only edit `src/components/courses/faculty-lesson-authoring.tsx:274-299` `src/components/courses/super-admin-content-actions.tsx:129-145`
- Fix: Restore multi-material authoring and editing as high priority parity prerequisite.
