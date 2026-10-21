# Work packet: edit src/modules/placements/tpo-self-profile-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u030-tpo-profile.md

## G2-19-030-016  [P1] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/userInfo.js:99-105 — portrait image userDetails.website, fallback initials/name, 120px square.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:27-34,58-67 — selects only name/roles/college/department, excludes photo.
- Fix: Add scoped profileImage read and avatar fallback.

## G2-19-030-026  [P1] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyProfileServiceImpl.java:118-125 — image URL must use HTTPS/approved storage key; custom validation messages.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:58-67 — read-only service has no image mutation validation.
- Fix: Add image authorization, HTTPS validation, upload attestations.

## G2-19-030-036  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyProfileController.java:204-215 — requireAccessFacultyProfile(facultyId), validates image ownership.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:112-150 — checks self membership, active user and college; no upload.
- Fix: Apply same self actor + image ownership to future write.

## G2-19-030-060  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/TpoProfileCard.jsx:46-56 — legacy faculty record firstName,lastName,department,contactMobile,contactMail,website.
- vNext now: src/modules/placements/tpo-self-profile-service.ts:58-67,155-162 — users.displayName, college names, membership roles/status, primaryDepartmentName; no photo/contact fields.
- Fix: Add a safe profile view model mapping legacy identity/contact/photo fields.
