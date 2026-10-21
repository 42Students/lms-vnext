# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-13/l17-u028-workspace-readiness.md

21 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l17-u028-workspace-readiness.md

## G2-17-028-001  [P2] GAP  facet F01 Route  effort S
- Legacy: LR:11-16 reads Next router dynamic workspaceId at `/superadmin/projects/workspaces/[workspaceId]/readiness`
- vNext now: NP:1-5 maps `/admin/projects/[projectId]/readiness`; legacy alias not visible here
- Fix: Ensure Super Admin navigation/old bookmarks redirect to admin path preserving UUID and selected college scope

## G2-17-028-002  [P2] GAP  facet F01 Shell/back  effort M
- Legacy: LS:13-28 builds workspace breadcrumbs, context-sensitive back target, full section tabs
- vNext now: NW:44-58 uses ProjectAdminNav, fixed `Back to workspaces`, 10 tabs
- Fix: Mirror legacy tab order/labels/breadcrumb/back destination (including source `from`) without losing authorization

## G2-17-028-003  [P2] GAP  facet F01 Override navigation  effort S
- Legacy: LR:62-69 plain `Manage override` button jumps to `/superadmin/projects/readiness?projectId=`
- vNext now: NW:84-89 embeds inline override form; NL:125-129 links to workspace detail
- Fix: Preserve prominent `Manage override` action at page head or document intentional inline replacement; verify legacy navigation path

## G2-17-028-004  [P2] GAP  facet F02 Layout order  effort M
- Legacy: LR:56-82 shell→error banner→6-row skeleton→WorkspaceReadinessOverview; LO:47-105 hero then override panel
- vNext now: NW:43-90 nav→back/head/status→tabs→Current readiness→override disclosure
- Fix: Match hero at top, progress within hero, four metric tiles, then override summary; avoid moving edit form ahead of overview

## G2-17-028-005  [P2] GAP  facet F02 Hero anatomy  effort M
- Legacy: LO:47-74 AntD Card with eyebrow, statement, Ready/Not ready Tag, progress then four metrics
- vNext now: NW:59-83 border-bottom section with definition list and 3 progress bars
- Fix: Recreate legacy hero sizing/spacing/sequence using shared visuals, no arbitrary card-in-card; leave semantics unchanged

## G2-17-028-006  [P2] MISSING  facet F03 Readiness verdict  effort S
- Legacy: LO:50-55 displays exact `This workspace is ready to submit` / `This workspace still has readiness gaps` and Ready/Not ready badge
- vNext now: NW:47-49 has badge but not full sentence
- Fix: Render complete legacy statement adjacent to status badge with identical punctuation/casing

## G2-17-028-007  [P2] MISSING  facet F03 Progress  effort M
- Legacy: LO:58-64 `Overall project progress`, percent label and Progress bar
- vNext now: NW:72-82 shows separate tasks/sprints/releases bars, no combined overall label/percentage
- Fix: Add derived overall progress calculation using legacy LU:~127 logic: round((completedTasks+completedSprints)/(totalTasks+totalSprints)*100), clamped 0..100

## G2-17-028-009  [P2] GAP  facet F04 Task counters  effort S
- Legacy: LD:10-13 total/completed tasks and sprints; LO:30-37 `Tasks complete X / Y`, `Sprints complete X / Y`
- vNext now: NS:90-95,121-134 computes totals and counts DONE/COMPLETED; NW:73-75 displays two ratios
- Fix: Match metric labels, spaces around slash, singular/zero handling and metric arrangement

## G2-17-028-010  [P2] GAP  facet F04 Submission  effort S
- Legacy: LD:20-21 submissionExists/status; LO:39-42 `Submission` = status or `Not submitted`, textOrDash fallback
- vNext now: NS:136-149 latest status; NW:65-66 same `Not submitted` but in a row rather than metric
- Fix: Render as fourth hero metric, preserve blank '—' fallback for submissionExists true without status

## G2-17-028-012  [P2] GAP  facet F04 Override summary  effort M
- Legacy: LO:76-105 if active shows Reason, Set by, Set at; otherwise exact `No manual readiness override is active. The status above is based on workspace progress and submission rules.`
- vNext now: NW:61-71 shows State/Reason/Submission status, overridden-by/date in loose paragraphs, no same empty explanatory card
- Fix: Recreate three-field override banner or empty explanation with correct conditional active state

## G2-17-028-013  [P2] GAP  facet F04 Override timestamp  effort S
- Legacy: LU:~19-69 accepts array/zone-less UTC, local display; LO:94 formatTimestamp
- vNext now: NW:69-70 uses formatProjectAdminActivityDateIst in IST
- Fix: Match legacy short-date time style and dash placeholder while retaining IST conversion and safe invalid value handling

## G2-17-028-014  [P2] GAP  facet F04 Override direction  effort S
- Legacy: LO:7-13 Tag `Force unlocked` with Unlock icon green / `Force blocked` with Lock icon volcano
- vNext now: NW:62 status displays raw state `FORCE_UNLOCK` or `FORCE_BLOCK` in definition list
- Fix: Humanize to exact labels, assign legacy icon/color and align Tag position

## G2-17-028-020  [P2] GAP  facet F07 Load failure  effort M
- Legacy: LR:71-73 `Workspace could not be loaded`, error detail, Retry reload
- vNext now: NW:33-39 `Workspace readiness unavailable` generic error and Back to workspaces
- Fix: Add inline Retry for transient fetch errors, keep safe generic auth failures distinguishable and preserve page tabs

## G2-17-028-021  [P2] GAP  facet F07 Missing workspace  effort S
- Legacy: LR:75-81 `Workspace not found` warning only after loading false
- vNext now: NW:21-39 merges invalid UUID/unavailable into same error
- Fix: Differentiate 404, invalid UUID, and 403 without disclosing outside-college project details; retain exact missing wording

## G2-17-028-031  [P2] GAP  facet F13 Initial loading  effort S
- Legacy: LH:18-25 starts loading true to avoid flashing false `not found`; LR:75-81 6-row skeleton
- vNext now: NP async server page + NW:28-40 error/final data; route loading fallback separate
- Fix: Mirror legacy skeleton for initial detail and scope-loading state; ensure no flash of 404 or empty verdict

## G2-17-028-033  [P2] GAP  facet F13 Snapshot missing  effort S
- Legacy: LO:16-25 warning `Readiness snapshot is unavailable` with retry instruction when workspace exists but readiness=null
- vNext now: NW:29-40 treats all failed readiness fetches as unavailable; no snapshot-missing distinction
- Fix: Add explicit missing embedded-readiness warning if workspace resolves without readiness; avoid false Not ready

## G2-17-028-036  [P2] GAP  facet F16 Responsive  effort M
- Legacy: LR:57-85 uses legacy admin-list-page shell; LO:47-74 Card + metrics flex; shell controls wrap LS:25
- vNext now: NW:61 uses 1→3 column at md; NF:115-118 mobile full-width Save
- Fix: Compare tablet/phone hero, 4 metrics grid, top action wrap and tab overflow against legacy SCSS screenshots

## G2-17-028-037  [P2] GAP  facet F17 Accessibility  effort M
- Legacy: LR:37-45 AntD Alert/Skeleton and LS:24 tabsAriaLabel; LO icon Tags
- vNext now: NW:51 tabs ariaLabel, NW:80 MetricBar role=progressbar; NF:80-112 labels and aria-invalid
- Fix: Keep meaningful percentage accessible, add assertive unreadiness/error announcements, verify keyboard focus on navigation/confirmation

## G2-17-028-038  [P2] GAP  facet F18 Exact copy  effort S
- Legacy: LR:61 subtitle `Understand submission readiness, proof coverage and any manual override at a glance.`; LO:31-42 four metric strings
- vNext now: NW:47-49 different subtitle and NW:60 heading `Current readiness`; no proof copy
- Fix: Lift exact subtitle, hero headings, metric names, override empty/active messages from LR/LO and legacy-copy A/B

## G2-17-028-039  [P2] GAP  facet F19 Data volume  effort M
- Legacy: LR:51-54 embedded readiness means no extra call, LH:28-49 one college-scoped request; reads resolvedTasks client-side
- vNext now: NS:34-71 parallel queries release/sprint/task/submissions then override; total rows fetched (no limits)
- Fix: Provide aggregate SQL counters for large workspaces but still fetch evidence subset; avoid O(tasks) client proof transfer where unnecessary

## G2-17-028-041  [P2] GAP  facet F20 Invalid time/IDs  effort S
- Legacy: LU:~19-69 parses Jackson arrays and zone-less UTC; LR:66 URL-encodes workspaceId
- vNext now: NW:21 validates UUID; NF:52 encodes ID; NW:69-70 IST formatter
- Fix: Keep backward-safe ID redirect, invalid timestamp placeholder, URL encoding and IST interpretation across formats
