# Work packet: edit src/modules/people/learner-profile-document-edit-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-4/job-preferences-repository.md, docs/audit/gap2/lane-5/u019-learner.md

## G2-1-004-012  [P1] GAP  facet F04  effort L
- Legacy: `LearnerProfileController.java:129-155` owner gets identity full, admins masked, teachers denied; `IdentityDTO.java:10-13` stores Aadhaar/PAN and refs.
- vNext now: `learner-profile-document-edit-service.ts:13-17` disallows raw IDs in generic profile; `learn/profile/page.tsx:56-80` shows verification.
- Fix: Provide private owner document capture/read and authorized masked admin review, never raw ID in generic JSON.

## G2-1-004-026  [P1] GAP  facet F06  effort M
- Legacy: `LearnerProfileController.java:220-240` validates Aadhaar/PAN formats at boundary.
- vNext now: `learner-profile-document-edit-service.ts:16-17` rejects raw IDs; proof submission separate.
- Fix: Apply equivalent format validation in secured identity-proof workflow.

## G2-1-004-037  [P1] GAP  facet F10  effort L
- Legacy: `LearnerProfileServiceImpl.java:83-1044` persists JPA Learner, Qualification, JobPreferences and storage refs.
- vNext now: `profiles.ts:15-30` membership-keyed JSONB, `learner-profile-document-edit-service.ts:18-46` transaction.
- Fix: Write field-by-field parity/migration recipe respecting current no-data-migration decision.

## G2-1-004-047  [P1] GAP  facet F14  effort L
- Legacy: `LearnerProfileController.java:242-281` tenant-owned ID/image/video/resume storage keys or URLs; no binary body.
- vNext now: `learner-profile-document-edit-service.ts:16-17` refuses raw ID; `learn/profile/page.tsx:56-80` verification status.
- Fix: Supply signed receipt upload/view and private admin review with tenant binding.

## G2-4-015-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy GET/PUT learnerId/job-preferences reads and updates one JobPreferences row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1202`)
- vNext now: New learner profile edit plus separate Placement notifications PUT. (`src/modules/people/learner-profile-document-edit-service.ts:13-45`; `src/app/api/placements/preferences/notifications/route.ts:9-20`)
- Fix: Define complete contract adapter or migrate each old caller to both services.

## G2-4-015-020  [P1] GAP  facet F06  effort L
- Legacy: Legacy DTO accepts nullable fields and PUT updates only provided non-null properties. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:944-975`)
- vNext now: New profile write replaces whole document after CAS, notification write requires both booleans and baseline. (`src/modules/people/learner-profile-document-edit-service.ts:29-38`; `src/modules/placements/learner-placement-notification-model.ts:5-13`)
- Fix: Provide safe partial field updates without clobbering unrelated values.

## G2-4-015-034  [P1] GAP  facet F10  effort L
- Legacy: Legacy PUT upserts one record, returns same six fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:944-975`)
- vNext now: New profile and notification updates write separate tables without all-or-nothing transaction. (`src/modules/people/learner-profile-document-edit-service.ts:26-45`; `src/modules/placements/learner-placement-notification-service.ts:71-96`)
- Fix: Guard cross-service partial success or separate clearly-scoped saves.

## G2-5-019-022  [P1] GAP  facet F04  effort L
- Legacy: Legacy identity JSON stored in learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:163-166`
- vNext now: VNext schema PAN/Aadhaar typed but identity save blocked `src/modules/people/profile-validation.ts:189-219` `src/modules/people/learner-profile-document-edit-service.ts:13-17`
- Fix: Provide encrypted/receipt-backed identity storage, not raw profile JSON.

## G2-5-019-040  [P1] GAP  facet F07  effort L
- Legacy: Legacy identity JSON entity permits storage `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:163-166`
- vNext now: New edit rejects PAN/Aadhaar via PRIVATE_IDENTITY_STORAGE_NOT_READY `src/modules/people/learner-profile-document-edit-service.ts:13-17`
- Fix: Provide secure path with visible disabled rationale.

## G2-1-004-028  [P2] GAP  facet F07  effort S
- Legacy: `LearnerProfileController.java:295-324` 409 error 'Profile was updated elsewhere. Please refresh and try again.'
- vNext now: `learner-profile-document-edit-service.ts:30-32` emits `LEARNER_PROFILE_DOCUMENT_STALE`; workspace `:299-301` adds two-tab retained-draft copy.
- Fix: Map exact legacy wording and keep safely retained draft.
