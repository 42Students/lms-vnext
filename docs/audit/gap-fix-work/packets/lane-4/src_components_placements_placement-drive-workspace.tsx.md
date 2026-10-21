# Work packet: edit src/components/placements/placement-drive-workspace.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md, docs/audit/gap2/lane-11/tpo-drives-jobid.md

## G2-10-012-004  [P1] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — Header actions Edit drive -> /superadmin/jobs/:id/settings and View applications -> /superadmin/jobs/:id/applications.
- vNext now: src/components/placements/placement-drive-workspace.tsx:278-280,328-332 — Applications direct link; Edit draft only shown for isTpo, no equivalent Super Admin 'Edit drive' header button.
- Fix: Add Edit drive to settings and preserve primary View applications CTA for Super Admin.

## G2-10-012-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:197-200 — Open · Expired indicator depends on active, not-draft, applicationDeadline < now.
- vNext now: src/modules/placements/tpo-drive-header-model.ts:8-17; src/components/placements/placement-drive-workspace.tsx:395-401 — PUBLISHED mapped 'Published', no deadline-expired variation in header badge.
- Fix: Project Open · Expired precisely when deadline has passed but drive stays active.

## G2-10-012-025  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-212 — Edit drive and View applications are visible direct buttons.
- vNext now: src/components/placements/placement-drive-workspace.tsx:278-389 — Edit action not visible to Super Admin; extra actions are nested dropdown, CTA says Applications.
- Fix: Restore direct edit destination in settings; do not hide critical action in dropdown.

## G2-10-012-042  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:207-213 — Edit and Applications URLs under /superadmin/jobs/{jobId}.
- vNext now: src/components/placements/placement-drive-workspace.tsx:278-280,328-332 — Applications under /admin/placements/jobs/{jobId}, Edit draft under /tpo only.
- Fix: Map correct Super Admin edit route; avoid TPO-only hrefs from Super Admin.

## G2-10-012-043  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:39-68 — Main display waits for job GET and attention; metrics failure doesn't stop display.
- vNext now: src/components/placements/placement-drive-workspace.tsx:70-116 — Workspace Promise.all includes evaluation/screening/round/day etc; any single essential failure aborts whole page.
- Fix: Move optional panels into settled/lazy loads so overview remains resilient.

## G2-10-012-071  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:49-64 — Promise.allSettled of job and metrics; attention fetched separately; page resilience under partial failure.
- vNext now: src/components/placements/placement-drive-workspace.tsx:70-115; src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — Many Promise.all required calls and preloaded pipeline; one failure cancels entire server render.
- Fix: Split required identity and optional metrics/auxiliary reads; add per-panel recoveries.

## G2-10-012-075  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:42-68,96-99 — Two fetch callbacks depend on selected job+college; alerts independent, latest scope remounted.
- vNext now: src/components/placements/placement-drive-workspace.tsx:70-115 — Backend request scopes job, other module reads independently but not all optional panel errors caught.
- Fix: Ensure optional panels cannot replace/lose main header or violate scoped access.

## G2-10-014-008  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:137-143; docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:580-618 — Legacy full JobForm visible for edit, including draft state.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:30-36; src/components/placements/placement-drive-workspace.tsx:579-671 — Published edit shortened; draft edit moved to overview disclosure.
- Fix: Put complete editor in Settings for relevant lifecycle states.

## G2-10-014-019  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1140-1184 — Save/update, Save draft, Publish, Cancel vary by state.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:76-83; src/components/placements/placement-drive-workspace.tsx:579-671 — Published edit Review and save, draft save on Overview, missing exact controls.
- Fix: Provide legacy state-aware action strip.

## G2-11-010-006  [P1] GAP  facet F02  effort L
- Legacy: Legacy PageShell with ListingPageHeader then single Next step card then tab strip. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:366`
- vNext now: vNext PageHeader then status/detail region, deadline controls, Next step section, Journey, many sequential panels. `src/components/placements/placement-drive-workspace.tsx:395`
- Fix: Restore single next-step card directly below header and tabs below.

## G2-11-010-010  [P1] GAP  facet F02  effort M
- Legacy: Header actions are inline mainButton, Discussion, Extend deadline, More. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:380`
- vNext now: Header actions are nested Dropdown trigger Actions with many links; primary usually inside dropdown. `src/components/placements/placement-drive-workspace.tsx:252`
- Fix: Keep one context-sensitive primary visible in header, Discussion and More visible.

## G2-11-010-040  [P1] GAP  facet F07  effort M
- Legacy: Close prohibited when Applicants/Rounds/Offers partial loads fail. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:291`
- vNext now: Optional readiness errors caught null, others primary Promise.all may fail whole server render. `src/components/placements/placement-drive-workspace.tsx:101`
- Fix: Fail close safely on missing data while preserving page with error per section.

## G2-11-010-042  [P1] GAP  facet F07  effort M
- Legacy: Partial section errors list exact failed names, warns zero counts unreliable. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:452`
- vNext now: vNext warning for Bulk applicants, readiness, but no unified per-section summary. `src/components/placements/placement-drive-workspace.tsx:692`
- Fix: Aggregate section failures with nonzero-claim guard and Retry.

## G2-11-010-045  [P1] MISSING  facet F08  effort M
- Legacy: Stale old data warning Couldn't refresh this drive, Showing the last drive data we loaded, Retry. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:445`
- vNext now: vNext revalidation refreshes server page, no last-good panel at root. `src/components/placements/placement-drive-workspace.tsx:387`
- Fix: Add retained snapshot/error banner and Retry without blanking loaded page.

## G2-11-010-072  [P1] GAP  facet F13  effort M
- Legacy: Independent service failures surface names, preserve other tab content. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:452`
- vNext now: Optional service catches null; some warnings but no unified names. `src/components/placements/placement-drive-workspace.tsx:101`
- Fix: Preserve partial content and section error diagnostics.

## G2-11-010-103  [P1] GAP  facet F22  effort L
- Legacy: Selection statuses SELECTED/PENDING_VERIFICATION, RELEASED/ACCEPTED. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:140`
- vNext now: New offer controls use ISSUED/ACCEPTED/DECLINED/WITHDRAWN states. `src/components/placements/placement-drive-workspace.tsx:784`
- Fix: Document state transition mapping before cloning selection counts.

## G2-11-010-106  [P1] GAP  facet F23  effort L
- Legacy: Legacy 6-tab layout with one Next step and focus-scoped pane. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:267`
- vNext now: vNext long scroll workspace, many disclosures, extra utility sections. `src/components/placements/placement-drive-workspace.tsx:483`
- Fix: Group new functionality behind old-look tabs and restore first-screen density.

## G2-11-010-109  [P1] GAP  facet F23  effort M
- Legacy: Old retention of stale data plus sectional Retry. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:442`
- vNext now: New optional warning only for readiness/Bulk applicants. `src/components/placements/placement-drive-workspace.tsx:390`
- Fix: Provide unified retriable partial-data states.
