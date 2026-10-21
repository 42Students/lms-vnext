# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-013-051  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184,748-780 — Interview loader Spin and Alert error; Refresh control inside header.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx:1-3; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — Generic directory loader; schedule route lacks same list loading state.
- Fix: Clone spinner/text and skeleton shape for calendar.

## G2-10-012-051  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:114-135 — On main OR attention loading, Skeleton paragraph, avatar, two button shapes and 6 Pipeline Skeleton stats.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx:1-3 — GracefulPageLoading shape='directory', not same 56px avatar and six metrics skeleton.
- Fix: Rebuild overview-specific skeleton with legacy dimensions and 6 blocks.

## G2-10-012-063  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:114-135 — Skeleton layout adapts to xs/sm/md with card scaffold.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx:1-3 — Generic directory skeleton not matching overview card/breakpoints.
- Fix: Match responsive loader placeholders at mobile/tablet/desktop.
