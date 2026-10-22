# Deep verification packet (round 2, Claude agent 6)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-8-031-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-031-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-11-004-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-11-004-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-12-020-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_4.md)
- [ ] G2-13-017-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-017-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-018-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-13-018-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_6.md)
- [ ] G2-9-002-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-008-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-010-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-014-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-025-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-12-019-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-14-011-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_7.md)
- [ ] G2-14-011-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-012-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-012-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-012-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-015-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-015-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-015-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)

## Results

- G2-8-031-061: OK — vNext src/app/(authenticated)/tracker/logs/page.tsx:92-116,171-174 bounded knownOffset pagination ("Older signatures"/"Newer signatures", cap 100000) and expiry notice line 155 match docs/legacy-source/frontend/src/pages/tracker/logs.js:265-343 older-page loading.
- G2-8-031-067: OK — vNext src/db/schema/activity.ts:35-66 (legacyAuditId, legacyActionKey, legacyEntityType/Id, actorRoleSnapshot, sourceIpHash, sourceUserAgentFamily; raw IP/UA deliberately hashed/family-only for privacy) maps docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:12-61.
- G2-11-004-054: OK — vNext src/components/hr/hr-drive-draft-form.tsx:336-346,384-386 shows "Approved. The placement cell sets the dates and opens it to students." only when the receipt carries a DRAFT status and approvedJobId, matching docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:279.
- G2-11-004-064: OK — vNext src/components/hr/hr-drive-draft-form.tsx:319-376 maps the request receipt (id, status, approvedJobId) and 403/4xx/STALE/unknown error statuses, matching RecruiterPlanDriveController.java:47 and new.js:268-296.
- G2-12-020-020: OK — vNext src/db/schema/placement-company-identities.ts:12,47-48 verifiedBy42 default false with "Verified by 42"/"Not verified" copy; only src/modules/placements/super-admin-company-verification-service.ts:58 sets true (explicit workflow), domain add route sets false (src/app/api/placements/tpo/companies/[companyId]/domain/route.ts:24); matches CompanyDomain.java:34-35.
- G2-13-017-001: OK — vNext src/db/schema/projects.ts:545-549,584-585 (templateKey, deletedAt, deletedByWorkspace tombstone) with src/modules/projects/mentor-task-delete-service.ts:40-69 keeping deleted rows as suppression, matches ProjectTask.java:14-18.
- G2-13-017-007: OK — vNext src/db/schema/projects.ts:259,545-551 (legacyProjectId, legacyTaskId, legacyTaskKey varchar(120) preserving overlength keys beside strict 64-char templateKey) matches ProjectTask.java:20,26.
- G2-13-017-010: OK — vNext src/db/schema/projects.ts:461-463,556-557,586 (dueLabel, legacySprintKey, legacySprintLabel, dueDate) preserves ProjectTask.java:41-48 display data.
- G2-13-017-015: OK — vNext src/db/schema/projects.ts:914-950 project_task_submissions (versioned, submittedByMembershipId, timestamptz submittedAt) and src/modules/projects/validation.ts:516 submissionUrl .max(2048) match ProjectTask.java:85-92.
- G2-13-017-016: OK — vNext src/db/schema/projects.ts:580-583 createdByMembershipId/updatedByMembershipId + legacySortOrder:551 and activity events (mentor-task-delete-service.ts:57) match ProjectTask.java:94-104.
- G2-13-017-019: OK — vNext src/modules/projects/mentor-task-delete-service.ts:44-69 soft-deletes with deletedByWorkspace=true and templateKey so the deleted row suppresses template fallback, matching ProjectTaskRepository.java:21-26.
- G2-13-017-031: OK — vNext src/db/schema/projects.ts:584-585,626 (deletedAt tombstone, active-order index where deletedAt is null) implement deleted-as-suppressed, matching ProjectTaskRepository.java:15-19.
- G2-13-017-035: OK — vNext src/db/schema/projects.ts:576-579 (legacyAssigneeId/Type namespaced snapshot, authorization only via assigneeMembershipId) and src/modules/projects/learner-own-task-service.ts:137-142 (only explicit LEARNER type maps) match ProjectTask.java:68-75.
- G2-13-018-008: FIXED — odd/nonstandard term counts no longer yield fractional years: programDurationYears now Math.ceil in src/modules/academics/program-service.ts and src/app/api/academics/programs/route.ts; src/modules/admin-ui/program-directory.ts programDurationYearsLabel shows "N semesters" for odd counts (durationTerms stays authoritative; NewProgram.java:21-22 is an integer).
- G2-13-018-014: OK — vNext src/modules/academics/program-service.ts:283-334 lists organization-wide programs for a platform admin scoped to an organization, matching NewProgramRepository.java:34-38.
- G2-9-002-087: FIXED — added guarded one-click "Mark graduated" (ConfirmDialog, POST /api/college/batches/{id}/graduate, toast, refresh) in new src/components/academics/college-batch-graduate-button.tsx, used on the final-term row in src/app/(authenticated)/college/batch-promotion/page.tsx; outdated "not available" copy updated. Matches BatchPromotion.js:312-344.
- G2-9-008-031: OK — vNext src/app/(authenticated)/college/hiring-dashboard/error.tsx:14-16 shows "Couldn't refresh hiring metrics" with visible Retry; page is server-rendered so no stale filtered data exists to preserve and no zero counts are implied (deliberate), matching HiringDashboard.js:417-425.
- G2-9-010-050: OK — vNext src/app/api/placements/college/jobs/[jobId]/applications/[applicationId]/route.ts:15-19 + src/modules/placements/college-application-detail-service.ts:262-292 append-only notes with amendsNoteId and activity audit under a row lock; a stale editor can never overwrite another's note (deliberately safer than AdminJobController.java:772-828).
- G2-9-014-018: FIXED — external-applicant score cell in src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx now renders rounded percent with purple/cyan/neutral thresholds; main table already does in src/components/placements/college-application-pipeline-controls.tsx:266-281 (Partial label when partialScore present). Matches JobApplications.js:1350-1378.
- G2-9-025-068: OK — vNext src/modules/courses/super-admin-content-directory-service.ts:41-47,109-158 lists structured child materials (lesson_content_materials) with notes/points/sequence; raw legacy html/materials JSON retained for importer review (src/db/schema/courses.ts:466) and not rendered because no reviewed sanitizer exists (deliberate security), vs AdminResources.js:266-285.
- G2-12-019-035: OK — vNext src/db/schema/placements.ts:1273-1275 public_ref is NOT NULL with a DB default, so every insert path (application-service.ts:1007, bulk-drive-service.ts:316) gets one, matching JobApplication.java:177-188 @PrePersist.
- G2-14-011-074: OK — vNext src/modules/placements/college-application-stage-service.ts:54-64 documents the global lock order and tests/unit/application-stage-lock-order.test.ts asserts it, matching PlacementJobServiceImpl.java:1169-1186.
- G2-14-011-076: OK — vNext src/modules/placements/college-application-stage-service.ts:326-364 enqueues notification_delivery_outbox rows inside the stage transaction (delivered after commit) and refuses unregistered email (line 71), equivalent to PlacementJobServiceImpl.java:1268-1273.
- G2-14-012-030: OK — vNext src/modules/placements/recruiter-message-email-provider.ts:144-153 requires an approved reply domain and a From address in the verified allowlist (stricter than ZeptoMailServiceImpl.java:123-132 by design).
- G2-14-012-034: OK — vNext src/modules/placements/recruiter-message-email-provider.ts:71-73,144-158 validates reply-to and From aliases; display name sanitized separately (ZeptoMailServiceImpl.java:123-132 only trimmed).
- G2-14-012-055: OK — vNext src/modules/placements/recruiter-message-email-provider.ts:144-153 enforces the approved sender/reply-domain policy (stricter than legacy trim-only ZeptoMailServiceImpl.java:123-132).
- G2-14-015-002: OK — vNext src/db/schema/placement-drive-requests.ts:67-68 separate typed request statuses REQUEST/SENT_BACK/DRAFT/REJECTED/CANCELLED match JobLifecycleStatus.java:10-13.
- G2-14-015-012: OK — vNext src/modules/placements/recruiter-drive-request-service.ts:192-210 persists recruiter intake as a distinct request (REQUEST, or DRAFT via approved draft job), matching JobLifecycleService.java:38-46.
- G2-14-015-026: OK — vNext src/modules/placements/tpo-drive-lifecycle-model.ts canTransitionPlacementJobStatus is the single check used by job-service.ts:869,1067,1142,1361 and tpo-drive-lifecycle-service.ts:226, matching JobLifecycleService.java:10-16.
- G2-14-017-046: OK — vNext src/db/schema/projects.ts:469-476 startedByMembershipId/completedByMembershipId and src/modules/projects/mentor-sprint-write-service.ts:111,222 actor-attributed activity events preserve ProjectSprint.java:102-120 provenance.

