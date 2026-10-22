# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-028-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-002-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-006-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-008-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-010-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-012-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-012-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-013-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-013-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-5-013-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)

## Results

- G2-4-028-032: OK — vNext src/app/(authenticated)/tpo/settings/team/page.tsx:1-12,95+ renders the team mutation actions: TpoSettingsTeamManage/TpoSettingsTeamRemove (src/components/tpo/tpo-settings-team-manage.tsx, assignable staff from tpo-settings-team-actions-service), TpoTeamAssignUnowned, TpoTeamHandover and TpoTeamAwayForm; matches docs/legacy-source/frontend/src/pages/tpo/settings.js:152 (TeamPeople create/remove/reassign).
- G2-5-002-037: OK — vNext src/components/placements/placement-calendar-workspace.tsx:321-336 links an INTERVIEW_SLOT event with applicationId to <job>/applications?applicationId=<id> for College Admin and Super Admin audiences, and src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:44-45 validates that UUID and opens that exact application detail; TPO audience goes to the round row with focus (no separate TPO applications route). Matches docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632,1040-1043.
- G2-5-006-018: OK — vNext src/components/attendance/admin-attendance-workspace.tsx:379-405 exports the day grid: Student + one column per day of the month, blank for unscheduled days, "N" when nothing counted, "P"/"A" for one session and "attended/counted" for several, filename attendance-class-<class>-course-<course>-<yyyy-mm>.csv; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:449-467.
- G2-5-008-030: OK — vNext src/modules/academics/college-section-mutation-model.ts:7-9,26-47 applies the same "Maximum must be a whole number from 1 to 200" bound and "Maximum cannot be less than minimum" invariant on both create (1..200 required) and edit (1..200, or null to keep an imported unlimited class), surfaced at src/components/academics/academics-actions.tsx:955; matches docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:91-105.
- G2-5-010-011: OK — vNext shows an explicit "Some setup options failed to load" notice with a "Retry options" link instead of empty options in src/app/(authenticated)/admin/classes/page.tsx:61 and src/app/(authenticated)/college/classes/page.tsx:47 (also college-recurring-preview.tsx:180); matches docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435.
- G2-5-012-027: OK — vNext src/modules/placements/placement-calendar-model.ts:132-139 makes the agenda range the anchor day through anchor+30 days; matches docs/legacy-source/frontend/src/pages/tpo/calendar.js:54-58.
- G2-5-012-051: OK — vNext src/components/placements/tpo-week-hour-calendar.tsx:61-66,184 lets a verified TPO (canCreate) click an empty hour to open the New follow-up form at that exact day/hour (IST preserved), and drag a follow-up to move it (:83-95); matches docs/legacy-source/frontend/src/pages/tpo/calendar.js:333-341.
- G2-5-013-016: OK — vNext src/modules/placements/tpo-bulk-application-stage-service.ts:17,180-190 (moveTpoBulkApplicationStages) caps a batch at TPO_BULK_STAGE_LIMIT=100 ("Maximum 100 applications per bulk update"), runs each item in its own transaction and returns every attempted ID in order with per-item success/failure; the College Admin pipeline src/modules/placements/college-application-stage-service.ts:57-103,349-353 returns per-application moved/skipped results with reasons. Matches docs/legacy-source/backend/.../service/AdminJobService.java:100-116.
- G2-5-013-045: OK — vNext maps each canonical stage in src/modules/placements/tpo-bulk-application-stage-service.ts:19-31 (TPO_LEGACY_APPLICATION_STAGE_MAP) and college-application-stage-service.ts:57,247-293 persists the reason (staff-only, default text when blank), optional assessmentUrl on the application and, with saveAssessmentUrlToJob, on the job (policy explicit, both overloads of AdminJobService.java:79-98).
- G2-5-013-046: OK — same implementations as G2-5-013-016: independent per-item transactions, 100-item cap in tpo-bulk-application-stage-service.ts:186,242 and a failed/skipped list with reasons in college-application-stage-service.ts:68-71,349-353; matches docs/legacy-source/backend/.../service/AdminJobService.java:100-116 (including explicit application-only vs job-default assessment-link behaviour via saveAssessmentUrlToJob).
