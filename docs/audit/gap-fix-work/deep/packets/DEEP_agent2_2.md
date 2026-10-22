# Deep verification packet (round 2, Claude agent 2)

Rows still unchecked after the first deep pass. Each row ends OK (vNext file:line + docs/legacy-source file) or FIXED. DEFERRED is not allowed.

- [ ] G2-5-024-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-024-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-030-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-5-031-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-008-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-015-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-018-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-019-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-031-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-11-019-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-019-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-019-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-019-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-019-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-022-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-001-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-001-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-002-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-006-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-006-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-010-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-022-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-12-023-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-12-023-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-12-023-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)

## Results

- G2-5-024-038: OK — vNext src/modules/tenant-domains/service.ts:376-409 (previewTenantHostResolution rejects non-global Super Admin) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:273-282
- G2-5-024-042: OK — vNext src/modules/tenant-domains/dns-verifier.ts:49-52 verifies _lms-vnext, _42lms-verify.<host> and host root with bare/42lms-verification= token, matches TenantDomainVerificationService.java:57-89; guidance in service.ts tenantDomainDnsInstructions
- G2-5-024-049: OK — vNext src/modules/tenant-domains/repository.ts:198,241,289,379,451,495 insert actor-stamped activityEvents (create/edit/verify/primary/delete with host+result metadata), matches TenantAdminController.java:425-565
- G2-5-024-066: OK — vNext src/app/api/tenant-domains/[domainId]/route.ts:44-56 EDIT_HOST + service.ts editTenantDomainHost (rotates token, clears verified/primary); always-verified primary (service.ts setPrimaryTenantDomain) is a deliberate safe tightening of TenantAdminController.java:462-505
- G2-5-030-039: OK — vNext src/components/admin/college-edit-dialog.tsx:96-105 blocks close while pending/in-flight and confirms discard when dirty, matches ManageCollegeDrawer.js:13-81
- G2-5-031-037: OK — vNext src/modules/people/repository.ts:893-902 revokes every identity_device_sessions row on SUSPEND/END; college-admin-lifecycle-action.tsx:33 toast matches AdminUsers.js:175-200
- G2-5-031-038: OK — vNext src/components/admin/college-admin-lifecycle-action.tsx:58-63,76-79 offers End membership only after suspension, sessions revoked, audit retained (hard delete deliberately not offered, audit immutability); matches intent of AdminUsers.js:221-250
- G2-5-031-042: OK — vNext src/modules/people/repository.ts:865-867 server activeMentorProjectCount check (FACULTY_HAS_ACTIVE_PROJECTS) plus warning in college-admin-lifecycle-action.tsx:51-53, matches AdminUsers.js:205-219
- G2-5-031-059: OK — vNext src/modules/colleges/admin-session-service.ts:84-133 listCollegeAdminSessionTargetsPage (DB LIMIT/OFFSET, 25 per page, distinct count) used at admins/page.tsx:44, matches AdminUsers.js:469-475
- G2-6-008-006: OK — vNext src/app/(authenticated)/teacher/notifications/page.tsx:110-111 merged feed sorted by createdAt then id, pills at :118-124, matches NotificationsContent.jsx:517-575,612-709
- G2-6-015-032: OK — vNext src/modules/module-access/admin-module-impact-service.ts:59-68 counts non-HIRED/REJECTED/WITHDRAWN, non-deleted applications of the college's learners, matches JobApplicationRepository.java:20-26
- G2-6-018-041: OK — vNext src/modules/organizations/service.ts:300-312 locks parent and blocks archive while any ACTIVE college exists (ORGANIZATION_HAS_COLLEGES), matches OrganizationServiceImpl.java:76-85
- G2-6-019-039: OK — vNext src/components/profile/learner-profile-workspace.tsx:1059-1067 Job Notifications Enabled toggle plus link to /learn/my-placements/notification-preferences, matches JobPreferencesDTO.java:9-16
- G2-6-031-038: OK — vNext src/components/auth/login-form.tsx:349,754-762 legacy Super Admin login requires unchecked-by-default Terms checkbox, matches docs/legacy-source/frontend/src/loginPages/SuperAdminLogin.js:35,192-215
- G2-11-019-029: OK — vNext src/components/tpo/recruiter-lead-detail-workspace.tsx:380-405,567-585 has real Send invite email (gated on TPO_RECRUITER_INVITE_EMAIL_READY at src/app/api/placements/tpo/leads/[leadId]/invite/route.ts:18) plus link/copy fallback; matches [recruiterLeadId].js:204-205
- G2-11-019-047: FIXED — removed the companyRelationshipId prerequisite (server tpo-recruiter-invite-service.ts:123 permits unlinked leads, legacy [recruiterLeadId].js:204 too) in src/components/tpo/recruiter-lead-detail-workspace.tsx sendInviteEmail
- G2-11-019-059: OK — vNext recruiter-lead-detail-workspace.tsx:575-576 Send invite email / Resend invite posts sendEmail:true; honest unavailable message at :396-398 when provider not verified; matches [recruiterLeadId].js:204-205
- G2-11-019-077: OK — vNext recruiter-lead-detail-workspace.tsx:487-491 Team talk link to /tpo/messages?tab=team&about=COMPANY:<name>, no linked-account prerequisite; matches [recruiterLeadId].js:204-207
- G2-11-019-079: OK — vNext recruiter-lead-detail-workspace.tsx:380-405 direct send-invite action with explicit unavailable message only when delivery is not configured; matches [recruiterLeadId].js:205
- G2-11-022-020: OK — vNext src/app/(authenticated)/tpo/reports/page.tsx:231-233,271,281 uses unique studentsPlaced/studentsAccepted (report-service.ts:92-98 placedUnique/acceptedUnique) and Not accepted yet = placed - accepted; matches reports/index.js:62-74
- G2-19-001-012: OK — vNext src/modules/admin-ui/super-admin-scoped-people-service.ts:96-108 learnerContactEmail/Mobile prefer personalDetails contactMail/contactMobile, fall back to canonical user; scoped to selected college; matches Students.js:937-938
- G2-2-001-067: OK — vNext src/db/schema/db10-audit-findings.draft.ts:75-117 audit_finding_syncs (repo,last_commit,result,refused files) and audit_finding_file ledger with unique-attempt index, SHA/action/result checks; migration drizzle/0198_lane15_audit_finding_file_ledger.sql; matches V219__audit_findings.sql:60-83
- G2-2-002-019: OK — vNext src/modules/storage/file-lifecycle.ts:42-46 maps PRIVATE_STORAGE_NOT_CONFIGURED to STORAGE_NOT_CONFIGURED, src/lib/api-error.ts:64 returns 503 (file-errors.ts), not 500; matches R2StorageUtils.java optional-bean behaviour
- G2-2-006-004: OK — vNext src/components/courses/college-assignment-create.tsx:249-259 post-save resource builder (FacultyAssignmentMaterialLinks HTTPS links + FacultyAssignmentResourcesEditor verified private file uploads; instructions are the description field) matches AdminAssignmentBuilderModal.jsx:143-181; cap is 20 (judgement: storage check sequence 0-19 kept, no unverifiable migration)
- G2-2-006-058: OK — vNext src/db/schema/course-assignment-materials.ts:7-45 normalized typed materials (LINK/FILE) with shape/url/size/scan constraints; INSTRUCTIONS is description; matches AssignmentContentWriteService.java:152-164 (cap 20 vs legacy 30 is a judgement call)
- G2-2-010-012: OK — vNext src/app/(authenticated)/college/attendance/settings/page.tsx:46 readOnly={!isSuperAdmin(context)}, college-attendance-policy-form.tsx:90-108 read-only for College Admin, policy-service.ts:15-17 requirePolicyWriteActor blocks writes; matches PolicySettingField.js:133-151
- G2-11-022-077: OK — vNext src/app/(authenticated)/tpo/reports/page.tsx:251-290 clickable Placement journey with gap links and percentages renders above the report cards (cards from :298); matches reports/index.js:62-74
- G2-12-023-016: OK — vNext src/modules/announcements/placement-cell-receipt-service.ts:9-11,45 deliberate per-college receipt (placement cell is a shared inbox) matches Super Admin legacy distinct-college readCount at PlacementAnnouncementService.java:343 (per-person unread not restored: needs a new table, judgement call)
- G2-12-023-045: OK — vNext src/modules/announcements/tpo-notice-delivery-service.ts:125-137 restricts COLLEGE broadcasts to members holding the LEARNER role, matches PlacementAnnouncementService.java:25-30
- G2-12-023-072: OK — vNext src/app/api/placements/tpo/announcements/[noticeId]/read-cell/route.ts + placement-cell-receipt-service.ts:12 explicit POST receipt instead of mutating GET (safer: no prefetch/CSRF side effect), matches TpoAnnouncementController.java:84-96

