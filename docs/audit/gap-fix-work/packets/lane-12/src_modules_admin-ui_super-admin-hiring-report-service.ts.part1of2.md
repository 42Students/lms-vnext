# Work packet: edit src/modules/admin-ui/super-admin-hiring-report-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-10-008-025  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2279-2307` totalApplications and status snapshot buckets from JobApplication
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:36-60` counts DISTINCT persisted placementApplications, dynamic stage fallback
- Fix: Map status taxonomy and application inclusion rules one-to-one for metric parity

## G2-10-008-028  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2443-2524` per-job companyName and jobTitle from Job plus stage counts
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:36-68` joins placementCompanies through relationship and job title
- Fix: Include legacy unlinked free-text company/job rows or document data-migration exclusivity

## G2-10-008-045  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-79` date endpoints inclusive day start/end ISO via .startOf/.endOf
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:31-35` parses date strings in +05:30 bounds
- Fix: Define single IST interpretation and inclusive end-of-day time boundary across app

## G2-10-008-063  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:911-937` GET metrics/funnel/company-report via three endpoints and different parameters
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:14-92` unified Drizzle report service and `src/app/(authenticated)/admin/placements/hiring/page.tsx:5-9` separate job directory read
- Fix: Keep endpoint-equivalent response sections for report accuracy even if served by one query

## G2-10-008-071  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2536-2550` resolves college jobs plus shared org jobs for metrics
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:62-68` confines to placementJobs.collegeId = selected
- Fix: Include organization-visible shared jobs in count/report if legacy required

## G2-10-008-106  [P1] GAP  facet F19  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2294-2307` GROUP BY status query, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2410-2429` cumulative history query
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:36-90` bounded aggregate query LIMIT5001, `src/modules/admin-ui/super-admin-hiring-funnel-model.ts:10-20` JS derive stages
- Fix: Retain bounded aggregate performance while adding correct historical funnel query

## G2-10-008-111  [P1] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-79` serializes dayjs local start/end into ISO timestamps
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:32-33` forces +05:30 boundaries, inclusive to 23:59:59.999
- Fix: Add timezone-specific integration test across IST midnight/DST-free date boundaries

## G2-10-008-116  [P1] GAP  facet F21  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2310-2340` relies on job_application_status_history transitions
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-60` depends on placementCollegeApplicationStages mutable stages and offer/joining records
- Fix: Read immutable stage history or persist compatible stage reach events for funnel/latency

## G2-10-008-118  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-39` legacy job_application unique learner/job, status, applied timestamp
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:31-45` uses placementApplications membership/job/status and submittedAt
- Fix: Map legacy statuses+appliedAt to new submission and college stage fields before interpreting KPIs

## G2-10-008-119  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:13-35` legacy immutable history records old/new status, changedAt, actor
- vNext now: `src/db/schema/placement-college-application-stages.ts:1-55` new college application stages schema and `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-60` only current stage
- Fix: Preserve historical transitions in equivalent vNext schema and use for funnel/time-to-shortlist

## G2-10-008-120  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:29-48` legacy job stores free-text company and optional linked companyId
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:62-68` inner joins company relationship, dropping free-text-only jobs
- Fix: Ensure unlinked migrated job names retained with fallback company representation

## G2-10-008-122  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2536-2545` resolves optional org jobs with college visibility
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:62-68` only explicit college matching
- Fix: Maintain old org-shared visibility in schema joins when authorized

## G2-13-031-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy Total Applications comes from admin hiring metrics endpoint. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-443`
- vNext now: vNext distinct application IDs includes withdrawn in total. `src/modules/admin-ui/super-admin-hiring-report-service.ts:36-43`
- Fix: Validate historical inclusion for withdrawals.

## G2-13-031-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy Applied, Shortlisted, Assessment from server metrics. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:444-453`
- vNext now: vNext tallies current persisted SUBMITTED stage only. `src/modules/admin-ui/super-admin-hiring-report-service.ts:29-44`
- Fix: Clarify ever-reached vs current-stage counts.

## G2-13-031-015  [P1] GAP  facet F04  effort M
- Legacy: Legacy Interview, Offered and Hired metrics from server. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:454-467`
- vNext now: vNext Hired requires accepted offer plus JOINED outcome. `src/modules/admin-ui/super-admin-hiring-report-service.ts:43-60`
- Fix: Reconcile old hired meaning.

## G2-13-031-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy Rejected, Withdrawn and Waitlisted exposed. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:469-486`
- vNext now: vNext Withdrawal separate status, others current stages. `src/modules/admin-ui/super-admin-hiring-report-service.ts:40-44,60-60`
- Fix: Reconcile mutually exclusive totals.

## G2-13-031-022  [P1] GAP  facet F06  effort M
- Legacy: Legacy DatePicker endOf day serialized to UTC ISO. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:71-85`
- vNext now: vNext IST 00:00 to 23:59:59.999 explicit date bounds. `src/modules/admin-ui/super-admin-hiring-report-service.ts:31-34`
- Fix: Compare exact boundary milliseconds.

## G2-13-031-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy three calls for metrics, funnel and report. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:98-165`
- vNext now: vNext one SQL grouping then derived metrics/funnel. `src/modules/admin-ui/super-admin-hiring-report-service.ts:14-92`
- Fix: Reconcile all three datasets for identical filters.

## G2-13-031-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy global Super Admin or college scoped report branch. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:96-155`
- vNext now: vNext requires selected college. `src/app/(authenticated)/admin/placements/analytics/page.tsx:36-40`, `src/modules/admin-ui/super-admin-hiring-report-service.ts:15-16`
- Fix: Decide whether global report is still intended.

## G2-13-031-063  [P1] GAP  facet F19  effort M
- Legacy: Legacy separates report fetches, no 5000-row cap visible. `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:98-165`
- vNext now: vNext grouped query cap5000+1 and partial warning. `src/modules/admin-ui/super-admin-hiring-report-service.ts:84-92`
- Fix: Load-test large college and reconcile totals.
