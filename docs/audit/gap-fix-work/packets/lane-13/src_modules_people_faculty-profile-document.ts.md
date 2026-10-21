# Work packet: edit src/modules/people/faculty-profile-document.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md, docs/audit/gap2/lane-4/faculty-model.md

## G2-1-003-035  [P1] GAP  facet F07  effort S
- Legacy: `FacultyProfileServiceImpl.java:259-300` contact errors primary mobile 10 digits, alternate 10–15, not same, primary required if alternate, email valid.
- vNext now: `faculty-profile-document.ts:46-73` validates individual fields but does not enforce alternate≠primary or alternate requires primary.
- Fix: Add cross-field contact validators on all authorized contact edit routes and migrate invalid combinations.

## G2-1-003-058  [P1] GAP  facet F14  effort L
- Legacy: `FacultyProfileController.java:141-155,204-215,289-302` accepts image/identity storage refs, not binary multipart; UI fields `profileSectionSchemas.js:14-35`.
- vNext now: `faculty-profile-document.ts:302-319` uses private document receipt IDs; editor `faculty-profile-editor.tsx:92-135` has no file widgets.
- Fix: Add secure upload/download/preview for profile image and identity documents with ownership constraints and receipt binding.

## G2-1-003-082  [P1] GAP  facet F23  effort L
- Legacy: `FacultyProfileServiceImpl.java:207-592` repeatable lists have no max; vNext capped sections, migrated legacy over-limit lists may fail entire document.
- vNext now: `faculty-profile-document.ts:292-298` max item counts; `faculty-profile-self.staged.ts:72-223` full document parsing.
- Fix: Implement pre-migration exception report and no-truncation remediation for over-limit records.

## G2-20-030-039  [P1] GAP  facet F07  effort M
- Legacy: Primary mobile field missing error 'Primary mobile number is required' (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:65-78`)
- vNext now: Schema contactMobile permits empty; contact editor disabled (`src/modules/people/faculty-profile-document.ts:40-60`, `src/app/(authenticated)/teacher/profile/contacts/page.tsx:22-35`)
- Fix: Require primary number in authenticated editable contact flow when legacy semantics apply

## G2-4-020-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy contactPhone,contactMobile,contactMail strings. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:88-96`)
- vNext now: New profileDocument contact fields regex phone 10-15,email max320; canonical users.email/phoneE164 separate. (`src/modules/people/faculty-profile-document.ts:46-72`; `src/db/schema/users.ts:16-20`)
- Fix: Resolve primary/secondary contact authority and avoid exposing unverified contact details.

## G2-4-020-035  [P1] GAP  facet F10  effort L
- Legacy: Legacy faculty row has personal/contact/social fields and JSON collections. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Faculty.java:74-198`)
- vNext now: New self profile editor writes JSON with optimistic version; staging says not wired to runtime until registration. (`src/modules/people/faculty-profile-document.ts:282-333`; `src/modules/people/faculty-profile-self.staged.ts:60-69`)
- Fix: Verify canonical schema/journal and route integration before marking self profile complete.

## G2-1-003-037  [P2] GAP  facet F07  effort L
- Legacy: `FacultyProfileServiceImpl.java:117-126` profile image only HTTPS/approved object key; exact error 'Profile image URL must use HTTPS.'
- vNext now: `faculty-self-section-model.ts:25-30` self route doesn't edit image, document stores profileImageDocumentId (`faculty-profile-document.ts:302`).
- Fix: Add secure authorized profile photo replacement with image-validation copy.
