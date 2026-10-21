# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-015-013 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:92-106` createdByType,createdById,verifiedBy,releasedAt,respondedAt
- Expected fix: Persist creator actor type, verifier ID and pre-release/release timestamps via linked audit/history entities

## G2-13-015-033 [P1] GAP facet F11
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75` createdByType TPO or recruiter actor, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:99` verifierFacultyId distinct
- Expected fix: Record dual actor roles/verification evidence for delegated recruiter selection vs TPO release

## G2-13-015-053 [P1] GAP facet F20
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:44-55` nullable money scale unspecified, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:52` ctcLpa BigDecimal
- Expected fix: Define rounding/truncation policy and overflow handling for legacy fractional LPA salary

## G2-19-029-063 [P1] GAP facet F22 IDs/storage
- Files: (none, new feature)
- Legacy: Legacy LB:154-156 collegeId Integer; domain table stores primary+verified, branding entity logo
- Expected fix: Document integer→UUID migration contract and domain/branding field crosswalk; preserve no migration assumptions for currently empty vNext

## G2-13-016-043 [P1] GAP facet F22
- Files: src/db/schema/memberships.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:22-29` role.name,role.description plus `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37` id,createdAt,updatedAt,isDeleted
- Expected fix: Document every dropped role-definition column and migrate only authorized assignments; preserve audit date provenance if required

## G2-14-015-003 [P1] GAP facet F02
- Files: src/db/schema/placements.ts
- Legacy: Legacy seven string states share same Job.lifecycleStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:10-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- Expected fix: Document exact status projection and state-ownership split

## G2-14-016-063 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy separate capability collection table `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:70-73`
- Expected fix: Migrate capabilities and verify complete code mapping

## G2-14-019-003 [P1] GAP facet F02
- Files: src/db/schema/placements.ts, src/db/schema/placement-round-candidate-slots.ts
- Legacy: Legacy one Interview row houses scheduling status feedback and reschedule `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-171`
- Expected fix: Build complete join-backed detail for interview workbench

## G2-14-020-003 [P1] GAP facet F02
- Files: src/db/schema/placements.ts
- Legacy: Legacy stores relationship plus notes contact owner trust and link metrics in one row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:29-75`
- Expected fix: Crosswalk all missing per-college fields into bounded private CRM tables

## G2-14-021-003 [P1] GAP facet F02
- Files: src/db/schema/platform-setting-overrides.ts
- Legacy: Legacy entity holds scopeType scopeId settingKey settingValue and BaseModel audit flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AppSetting.java:9-25`
- Expected fix: Map legacy IDs deleted/version and creator provenance into new model

## G2-15-011-003 [P1] GAP facet F01
- Files: src/modules/activity/notification-service.ts
- Legacy: Old classId/courseSlug/courseId and personal recipient feeds. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:125-175`)
- Expected fix: Preserve course-context filters and deep-link origin in migrated inbox.

## G2-15-011-033 [P1] GAP facet F10
- Files: src/modules/activity/notification-service.ts
- Legacy: POST /api/v1/notification/createNotification; save maps DTO fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NotificationController.java:58-85`)
- Expected fix: Crosswalk compose-to-activity-event and safe bulk recipient creation.

## G2-15-016-043 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: Old indefinite grant null expiry allowed. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/RecruiterCollegeAccess.java:80-84`)
- Expected fix: Backfill explicit expiration policy and show grant expiry management.

## G2-16-014-023 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: JobOfferRepository.java:29-31 external acceptance waits 48h when acceptedDisputableUntil set.
- Expected fix: Do not trigger accepted-offer cascade before dispute window ends.

## G2-16-022-003 [P1] GAP facet F02
- Files: src/modules/placements/tpo-public-join-link-service.ts
- Legacy: CollegePublicLinkService.java:67-80 settings enabled/postDirect/hasLink/createdAt/opens/joins/token.
- Expected fix: Restore Post directly field and repeatable link sharing if approved.

## G2-16-031-093 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: TpoDriveController.java:65-102 legacy Job entity has numeric id and status REQUEST/SENT_BACK/REJECTED workflow.
- Expected fix: Create explicit legacy-id-map and mapping table for recruiter request provenance, job lifecycle and imports.

## G2-18-004-093 [P1] GAP facet F21
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/modules/activity/notification-service.ts
- Legacy: Legacy notifications come from class notification REST and college announcements REST; SSE class updates. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:22-24`, `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:379-409`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:145-163`
- Expected fix: Inventory old source producers, fanout, release/schedule and expose compatible refresh.

## G2-19-015-003 [P1] GAP facet F02
- Files: src/db/schema/tenant-domains.ts
- Legacy: Legacy table one tenant_domain row, BaseModel for soft delete/timestamps `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/TenantDomain.java:10-13` `docs/legacy-source/backend/src/main/resources/db/migration/V59__tenant_domains_branding_settings.sql:3-15`
- Expected fix: Plan soft-deleted historical domain/tombstone migration and re-registration semantics.

## G2-2-007-063 [P1] MISSING facet F23
- Files: (none, new feature)
- Legacy: LL:408-413 exact selected Section filter
- Expected fix: Implement exact class filter rather than treating presence as identity.

## G2-2-020-023 [P1] GAP facet F06
- Files: src/app/api/projects/[projectId]/route.ts
- Legacy: ProjectWorkspaceUpdateDTO.java:9-48 fields plus section tokens
- Expected fix: Map whole legacy update contract to section-specific versioned APIs.

## G2-20-023-003 [P1] MISSING facet F02
- Files: (none, new feature)
- Legacy: Mine then Open group lists `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:56-89`
- Expected fix: Add two list panels

## G2-20-018-023 [P1] GAP facet F11
- Files: src/db/schema/identity-auth-attempts.ts
- Legacy: Legacy preuser learnerId0 bypasses real account FK `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/VerificationServiceImpl.java:205-248`
- Expected fix: Design safe pre-registration identity before challenge creation

## G2-20-010-053 [P1] GAP facet F22
- Files: src/db/schema/recruiter-message-email.ts
- Legacy: Legacy MySQL adds thread recruiter_emailed_at/raw token, inbound_email audit/inbound state `docs/legacy-source/backend/src/main/resources/db/migration/V223__recruiter_message_email_and_replies.sql:5-35`
- Expected fix: Apply verified matching Drizzle/PostgreSQL migration and validate startup guard

## G2-3-014-013 [P1] GAP facet F05
- Files: src/modules/courses/college-course-catalogue-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchController.java:121-157`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/courses/CourseSearchCache.java:160-205`
- Expected fix: Legacy department/college-filtered search truncates scoped candidate list to limit BEFORE query substring filtering, potentially missing later matches; vNext filters before SQL limit. Preserve intended results, document fix to legacy truncation as deliberate parity exception.

## G2-3-020-043 [P1] GAP facet F22
- Files: src/db/schema/faculty-course-associations.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:9-23`
- Expected fix: Legacy `faculty_course_associations` int id/faculty_id/course_id/active vs vNext same-named Postgres table with UUID id/membership_id/course_id and endedAt. Requires explicit table migration/identifier mapping, not naive column copy.
