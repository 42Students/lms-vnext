# Work packet: edit src/modules/colleges/admin-today-attention-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-dashboard.md, docs/audit/gap2/lane-9/superadmin-dashboard.md

## G2-10-005-036  [P1] GAP  facet F10  effort L
- Legacy: Legacy Today calls getAdminCollegeDashboard with pending at-risk grading unstaffed setup gaps dueWeek and today payload `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:81-85` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- vNext now: New getSuperAdminTodayBoard returns six aggregate counts and no item lists or thresholds `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Build endpoint projection returning each old section's totals and top items

## G2-10-005-067  [P1] GAP  facet F21  effort L
- Legacy: Old Today query returns six named issue sets and status per section `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- vNext now: New aggregate query loads classes no teacher and quiz counts only `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Implement missing attendance risk, grading backlog, setup gaps and drilldown sources

## G2-9-035-036  [P1] GAP  facet F10  effort L
- Legacy: Legacy Today calls getAdminCollegeDashboard with pending at-risk grading unstaffed setup gaps dueWeek and today payload `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:81-85` `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- vNext now: New getSuperAdminTodayBoard returns six aggregate counts and no item lists or thresholds `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Build endpoint projection returning each old section's totals and top items

## G2-9-035-067  [P1] GAP  facet F21  effort L
- Legacy: Old Today query returns six named issue sets and status per section `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- vNext now: New aggregate query loads classes no teacher and quiz counts only `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Implement missing attendance risk, grading backlog, setup gaps and drilldown sources

## G2-9-035-102  [P1] GAP  facet F10  effort M
- Legacy: Legacy Today class 'held so far' from actual dashboard today.heldCount `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:140-143`
- vNext now: New classesEnded derived from timetable endsAt <= now `src/modules/colleges/admin-today-attention-service.ts:23-35,54-56`
- Fix: Derive actual held status rather than equating calendar elapsed with held.

## G2-9-035-103  [P1] GAP  facet F10  effort L
- Legacy: Legacy Today attendance pending refers to held last7 days `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:149-154`
- vNext now: New filters scheduled classes today and elapsed event `src/modules/colleges/admin-today-attention-service.ts:19-35`
- Fix: Restore 7-day attendance-pending window and exclude cancelled sessions.

## G2-9-035-115  [P1] GAP  facet F19  effort L
- Legacy: Legacy fetch Today full issue sets plus limited items, explicit remainder count `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:51-63,113-123`
- vNext now: New aggregate-only query returns 6 integers, no previews `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Create paginated/per-card capped row projections with remainder count.

## G2-9-035-119  [P1] GAP  facet F22  effort L
- Legacy: Legacy state source Today dashboard response has 6 issue categories `docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:113-123`
- vNext now: New DB queries timetable/teacher/quiz; attendance risk, grading, setup gap data not selected `src/modules/colleges/admin-today-attention-service.ts:21-56`
- Fix: Extend data projection joins to existing attendance/submission/structure models.
