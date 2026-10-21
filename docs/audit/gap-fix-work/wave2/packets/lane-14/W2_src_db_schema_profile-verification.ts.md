# Work packet (wave 2): edit src/db/schema/profile-verification.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md, docs/audit/gap2/lane-10/superadmin-verification.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md

## G2-1-010-073  [P2] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:209-218`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:274-277`: profile_verification snapshot+state and profile_verification_event journal keyed numeric learner_id.
- vNext now: `src/db/schema/profile-verification.ts:9-44`,`src/db/schema/profile-verification.ts:92-119`: UUID membership, status/version and event rows.
- Fix: Map legacy learner numeric IDs and event action timestamps into new UUID FK during migration.

## G2-1-010-074  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:56-59`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:543-545`: tpo_college_settings.tpo_can_verify_profiles.
- vNext now: `src/db/schema/profile-verification.ts:120-132`: profileVerificationSettings tpoCanVerifyProfiles default true.
- Fix: Migrate per-college setting without reverting silently to default.

## G2-10-024-103  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:450-455 — History timeline actor+timestamp+note.
- vNext now: src/db/schema/profile-verification.ts:92-116 — Versioned event snapshots and actor kind, 50-row cap in drawer.
- Fix: Expose all available relevant history and revision

## G2-16-031-097  [P2] GAP  facet F22  effort L
- Legacy: ProfileVerificationController.java:70-99 tracks verify/send-back CAS seenSubmittedAt and settings access.
- vNext now: profile-verification.ts:9-44 stores SUBMITTED/SENT_BACK/VERIFIED/UPDATE_PENDING, timestamps, settings; receipts lines45-76 scan status.
- Fix: Import old verified marks evidence and note history into new scoped verification records with stable stale-write tokens.
