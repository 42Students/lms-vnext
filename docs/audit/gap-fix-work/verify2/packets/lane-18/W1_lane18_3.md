# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-006-034 [P1] GAP facet F18
- Files: (none, new feature)
- Legacy: `index.js:13-16`: documentation specifically identifies `?cls=...` classroom query.
- Expected fix: Append cls query exactly within validated URLSearchParams.

## G2-17-005-014 [P1] GAP facet F06
- Files: src/modules/placements/learner-interview-view-model.ts, src/components/placements/learner-career-rounds-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16,67-68 view choices ahead/past/month, initial ahead, shallow router.replace query.
- Expected fix: Map old view=ahead\|past\|month links to new view or redirect to Schedule preserving old filter.

## G2-17-005-041 [P1] GAP facet F21
- Files: src/app/(authenticated)/learn/my-placements/interviews/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:11,73-99 integrates interviewService legacy records, jobs/all deadlines and TpoHubService calendar extras.
- Expected fix: Canonicalize old URL to combined Schedule including all placements sources; document no-data migration policy.

## G2-18-002-067 [P1] GAP facet F10
- Files: src/app/api/admin/lessons/bulk-status/route.ts, src/modules/courses/super-admin-lesson-bulk-visibility.ts
- Legacy: Legacy bulk POST `/api/v1/admin/lessons/bulk-status` sets lesson active/enabled Booleans. `docs/legacy-source/frontend/src/api/Services/AdminService.js:530-537`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-367`
- Expected fix: Resolve semantic mismatch: bulk lesson visibility must change effective lesson-level visibility as single toggle does, or label it bulk content visibility.

## G2-18-003-086 [P1] MISSING facet F15
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Legacy global progress policy updates key and shows `${label} updated` toast. `docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:91-116`
- Expected fix: Rebuild global setting save/reset and event audit with exact success/error feedback.

## G2-19-007-006 [P1] GAP facet F02
- Files: src/components/courses/admin-offering-section-tabs.tsx, src/components/courses/admin-offering-learning-page.tsx
- Legacy: Legacy tab content switches single Home or Syllabus pane `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:29-46` `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:172-179`
- Expected fix: Render mutually exclusive panels or approved legacy-equivalent tab display.

## G2-19-011-046 [P1] GAP facet F18
- Files: src/modules/placements/tpo-drive-lifecycle-list-model.ts
- Legacy: Legacy `isActive=false` no literal Expired job label `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63`
- Expected fix: Unify expired presentation and whether rounds can still run.

## G2-19-005-044 [P1] GAP facet F15
- Files: src/app/(authenticated)/learn/my-placements/calendar/page.tsx, src/modules/placements/learner-career-calendar-url-model.ts
- Legacy: Old URL retained as email/notification link target intentionally `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- Expected fix: Preserve incoming notification/bookmark destination and expected month display.

## G2-19-004-027 [P1] GAP facet F06
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy Confirm I'll attend button appears for booked, live, non-past, non-Talk, unconfirmed `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:17-22` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:90-95`
- Expected fix: Exclude talk-only and reschedule-pending rounds consistently from attendance confirmation.

## G2-19-017-025 [P1] GAP facet F10
- Files: src/modules/projects/mentor-meeting-decision-service.ts
- Legacy: Legacy history row stores projectId/meetingId/key/action/actor/before/after fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:17-51`
- Expected fix: Write typed immutable before+after revision in same transaction as meeting mutation.

## G2-19-010-034 [P1] GAP facet F10
- Files: src/modules/messaging/tpo-campaign-draft-service.ts, src/modules/messaging/tpo-campaign-dispatch-service.ts
- Legacy: Legacy POST `/api/v1/tpo/campaigns` stores header then sends within @Transactional service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoEmailCampaignController.java:37-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoEmailCampaignService.java:50-65`
- Expected fix: Map historical sent campaigns to final status without replaying external messages.

## G2-2-006-018 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: LS:184-199 LINK requires HTTPS; PDF/FILE validate key/size
- Expected fix: Implement full PDF/FILE/LINK/INSTRUCTIONS set with HTTPS+file checks.

## G2-2-007-038 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LC:132-137 orphan/stale class stats failure isolated as Unavailable
- Expected fix: Render Unavailable for broken per-row statistics instead of claiming zero.

## G2-2-010-046 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LF:165-168 distinguishes default vs custom
- Expected fix: Persist null/inherited flags per individual setting or separate override rows.

## G2-2-013-026 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: LC:79-81 failed one student count returns null, other three computed
- Expected fix: Implement per-field fallback null; never replace failure with zero.

## G2-2-014-048 [P1] MISSING facet F22
- Files: (none, new feature)
- Legacy: LC:118-128 only requested fields modify, other course metadata untouched
- Expected fix: Use partial update query, preserve metadata and optimistic version.

## G2-2-023-060 [P1] MISSING facet F22
- Files: src/app/(authenticated)/admin/organizations/page.tsx
- Legacy: AdminRecycleBinController.java:115-157 lists nine entity tables and parent relation
- Expected fix: Build central entity disposition matrix before restore implementation.

## G2-2-028-045 [P1] GAP facet F23
- Files: src/observability/logger.ts
- Legacy: BaseController.java:13-15 logs object payload without built-in redact/allowlist.
- Expected fix: Introduce privacy-safe allowed-field wrapper for all raw request logging before calling logInfo.

## G2-2-001-018 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LS:51-58 backend comma-separated multi-value filters and search title/summary/id/where_json
- Expected fix: Match legacy exact area membership and multi-area OR semantics; search full Where JSON including pages/endpoints.

## G2-2-003-011 [P1] MISSING facet F07
- Files: (none, new feature)
- Legacy: LC:38-45 warns missing per event + total startup ERROR
- Expected fix: Add startup validation enumerating each email-enabled event with missing ID and aggregate warning.

## G2-20-030-021 [P1] MISSING facet F03
- Files: src/app/(authenticated)/teacher/profile/page.tsx
- Legacy: Profile UserInfo includes 120px square avatar with upload pencil (`docs/legacy-source/frontend/src/components/profile/userInfo.js:105-117`)
- Expected fix: Add protected profile-image view and upload/edit control

## G2-15-031-036 [P1] GAP facet F12
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:94-96`
- Expected fix: Old present = roster minus absent conflates unmarked; new published gradebook leaves missing results unknown.

## G2-19-023-057 [P1] GAP facet F23
- Files: src/app/api/placements/notices/[noticeId]/read/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- Expected fix: Automatic mark-read-on-list dropped intentionally for explicit user acknowledgment, but this breaks old unread badge behavior.

## G2-3-018-046 [P1] MISSING facet F23
- Files: src/modules/projects/delivery-activity-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDeliveryEvent.java:14-48`
- Expected fix: Historical actor snapshots, event feedback, revision counts and evidence links are not preserved by vNext sanitized activity taxonomy. Add authorized dedicated delivery-history projection/storage.

## G2-3-026-019 [P1] GAP facet F06
- Files: src/modules/placements/recruiter-invite-otp-accept-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:83-92`
- Expected fix: Legacy payload accepts separate firstName,lastName,phone,email,code; vNext strict schema uses name,mobile,designation,code only. Establish explicit migration/compatibility mapping.
