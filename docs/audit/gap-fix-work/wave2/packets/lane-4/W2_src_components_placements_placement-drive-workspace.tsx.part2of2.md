# Work packet (wave 2): edit src/components/placements/placement-drive-workspace.tsx (part 2 of 2)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid.md, docs/audit/gap2/lane-20/tpo-workspace-controller.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-11-010-081  [P2] GAP  facet F16  effort M
- Legacy: Header inline Space wrap handles compact desktop controls. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:381`
- vNext now: vNext actions collapse to one Dropdown, mobileSheet with min11 controls. `src/components/placements/placement-drive-workspace.tsx:252`
- Fix: Match header button placement at >=768px; retain minimum touch size mobile.

## G2-11-010-083  [P2] GAP  facet F16  effort M
- Legacy: One Next step colored card below header. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:393`
- vNext now: Border-bottom section and multi-column next action tiles. `src/components/placements/placement-drive-workspace.tsx:451`
- Fix: Match radius, border, padding and number of visible actions.

## G2-11-010-087  [P2] GAP  facet F18  effort S
- Legacy: Drive day panel heading Drive day operations and intro phone attendance text. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:470`
- vNext now: vNext accordion says Drive day overview with generic overview component. `src/components/placements/placement-drive-workspace.tsx:771`
- Fix: Keep exact Drive day tab heading/subtitle.

## G2-11-010-088  [P2] GAP  facet F18  effort M
- Legacy: Completed round action See attendance; other Open drive day. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:474`
- vNext now: vNext per-round See who reached this round and Enter results. `src/components/placements/placement-drive-workspace.tsx:525`
- Fix: Use status-dependent attendance action labels in Drive day tab.

## G2-11-010-089  [P2] GAP  facet F18  effort S
- Legacy: Completed meta Results applied, unscheduled Date to be decided. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:476`
- vNext now: vNext round meta says date/time or Date to be decided, results shown separately. `src/components/placements/placement-drive-workspace.tsx:501`
- Fix: Restore completed-specific Results applied text.

## G2-11-010-091  [P2] GAP  facet F19  effort L
- Legacy: Seven endpoints loaded concurrently, then per-section errors displayed. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:94`
- vNext now: First 8-way Promise.all plus optional 6-way fetches, journey etc; potentially large query count. `src/components/placements/placement-drive-workspace.tsx:99`
- Fix: Batch independent reads and stream tabs, avoid loading off-screen sections.

## G2-11-010-092  [P2] GAP  facet F19  effort M
- Legacy: Re-fetch on focus; requestId guards responses against prior calls. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:114`
- vNext now: vNext manual router refresh; no equivalent request sequence client guard. `src/components/placements/placement-drive-workspace.tsx:387`
- Fix: Revalidate on focus with stale-safe fetch sequencing.

## G2-11-010-093  [P2] GAP  facet F19  effort M
- Legacy: Only active tab mounts heavy applicants/rounds/offers. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:459`
- vNext now: Root loads applicants, offers, rounds, eligibility, requests regardless of active subpage. `src/components/placements/placement-drive-workspace.tsx:67`
- Fix: Defer off-tab data to matching route to reduce load.

## G2-11-010-099  [P2] GAP  facet F21  effort M
- Legacy: ShareModal invokes controlled company-sharing integration. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:552`
- vNext now: Share-preview route, explicit new flow. `src/components/placements/placement-drive-workspace.tsx:319`
- Fix: Document sharing approval and downstream recipient visibility parity.

## G2-11-010-102  [P2] GAP  facet F22  effort M
- Legacy: Round results status COMPLETED and stagedResults counters from backend. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:159`
- vNext now: vNext nested driveDay.rounds with STAGED/APPLIED participant records. `src/components/placements/placement-drive-workspace.tsx:488`
- Fix: Map equivalent result status semantics and duplicates.

## G2-11-010-104  [P2] GAP  facet F22  effort S
- Legacy: Legacy date fields applicationDeadline and round scheduledDate through dj. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:141`
- vNext now: New Date objects scheduledAt and Intl DateTimeFormat Asia/Kolkata. `src/components/placements/placement-drive-workspace.tsx:501`
- Fix: Preserve precise deadline/round date formatting and timezone.

## G2-11-010-107  [P2] GAP  facet F23  effort M
- Legacy: Frozen drives clone, not Edit. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:349`
- vNext now: vNext clone for CLOSED/CANCELLED and Edit draft only. `src/components/placements/placement-drive-workspace.tsx:328`
- Fix: Add rejected branch while retaining safe edit rules.

## G2-20-021-001  [P2] GAP  facet F01  effort M
- Legacy: Workspace applicant/offer/round/summary/activity GET `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:43-71`
- vNext now: Split TPO placement modules `src/components/placements/placement-drive-workspace.tsx:67-94`
- Fix: Crosswalk all tabs

## G2-20-021-003  [P2] GAP  facet F02  effort M
- Legacy: Five read sections `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:43-71`
- vNext now: Composite panels and optional readiness `src/components/placements/placement-drive-workspace.tsx:67-113`
- Fix: Compare section order

## G2-20-021-004  [P2] GAP  facet F03  effort S
- Legacy: Rounds with counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:55-59`
- vNext now: New rounds name/kind/status `src/components/placements/placement-drive-workspace.tsx:135-152`
- Fix: Restore count badges

## G2-20-021-021  [P2] GAP  facet F14  effort M
- Legacy: JSON rows imports rather than multipart `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoWorkspaceController.java:124-162`
- vNext now: New bulk import UI `src/components/placements/placement-drive-workspace.tsx:13-14`
- Fix: Map Excel preview/errors

## G2-10-012-057  [P3] GAP  facet F14  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:215-220 — Job description preview is ordinary text; no upload control.
- vNext now: src/components/placements/placement-drive-workspace.tsx:579-671 — Draft edit form may include description, not file edit in this subsection.
- Fix: Keep overview preview read-only and show actual job-description upload in Settings only.
