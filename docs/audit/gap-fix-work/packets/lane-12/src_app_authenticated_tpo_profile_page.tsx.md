# Work packet: edit src/app/(authenticated)/tpo/profile/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-005  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:48-61 — top UserInfo photo/identity card, then How students and recruiters see you Descriptions card.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:59-115 — single Account details grid, no photo/identity card.
- Fix: Restore identity/photo card and second summary card.

## G2-19-030-007  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:96-111 — 120px square resilient avatar, name heading and pencil upload button.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:59-114 — no avatar or photo edit affordance.
- Fix: Add photo display/avatar and authorized edit affordance.

## G2-19-030-019  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:22-44 — photo upload file or photoFromLink; rest of profile read-only.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:117-123 — whole page read-only, no form.
- Fix: Restore authorized photo edit only, keep login contact admin-owned.

## G2-19-030-029  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:106 — PencilUploadButton invokes upload/URL chooser.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no edit chooser/menu.
- Fix: Restore photo picker with keyboard and signed URL flow.

## G2-19-030-039  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:116-130 — accepts HTTPS URL and owned image R2 key; previous owned file deleted best effort.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:117-123 — intentionally no file feature.
- Fix: Make owner decision on signed URL-only photo editing; enforce type/size and rollback.

## G2-19-030-025  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:37 — Could not upload the photo; docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:43 — Could not use that image.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no photo flow/error.
- Fix: Implement source upload/link error feedback.

## G2-19-030-027  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:25 — Photo updated toast after header update.
- vNext now: src/app/(authenticated)/tpo/profile/page.tsx:44-124 — no photo update/toast.
- Fix: Restore Photo updated success toast.
