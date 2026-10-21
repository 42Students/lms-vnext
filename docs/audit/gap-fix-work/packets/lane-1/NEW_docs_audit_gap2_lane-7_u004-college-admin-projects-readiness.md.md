# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

19 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

## G2-7-004-002  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:244-262: `?projectId=` deep link hydrates selected workspace and mirrors it.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:108-111: projectId or workspaceId UUID supported, but only if found among capped workspaceChoices.
- Fix: Resolve scoped UUID directly independent of first-1000 choice list, preserving deep links.

## G2-7-004-005  [P1] GAP  facet F02  effort L
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:420-491: first card Active overrides, second Select workspace, third Current readiness, then Releases, Manual override.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:123-175: Select workspace first, Releases nested, Active overrides second, filters and workspace feed, no inline readiness/manual override.
- Fix: Restore order and all five legacy card blocks on same route.

## G2-7-004-017  [P1] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:520-542: `State` from backend readinessState, `Reason` conditional no duplicate override note.
- vNext now: V/components/projects/project-workspace-readiness.tsx:62-64: `State` prints FORCE_* or Automatic, reason fallback includes releases.
- Fix: Map full readinessState independently from override state; do not imply releases block legacy gate.

## G2-7-004-019  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:457-469: Active overrides table paged at 25 including all status values.
- vNext now: V/modules/projects/admin-readiness-overrides-service.ts:42-57: all active event rows filtered out when project archived, then unpaginated.
- Fix: Include archived projects in Active overrides; paginate all matching results at 25.

## G2-7-004-022  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:607-630: release Points column completed/committed count; Target date from API.
- vNext now: V/modules/projects/college-readiness-releases-service.ts:57-65: `points` only sum of estimate, `targetDate:null`, always em dash.
- Fix: Compute committed and completed points and real target date from schema/legacy source; don't render null constantly.

## G2-7-004-023  [P1] GAP  facet F05  effort L
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:512-583: single workspace readiness info displayed as descriptions table.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:177-269: replaces workspace detail with card/article for each workspace.
- Fix: Do not substitute multi-workspace summary feed for selected full readiness panel.

## G2-7-004-032  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:592-606: release failure shows `Couldn't load releases`, leaves readiness visible.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:111: release service rejection not individually caught before render.
- Fix: Isolate optional releases failure and show its alert without crashing readiness.

## G2-7-004-035  [P1] GAP  facet F09  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:700-724: Popconfirm is anchored to Save override and revalidates submission gate on opening.
- vNext now: V/components/projects/project-readiness-override-form.tsx:121-132: modal ConfirmDialog, no onOpen live-readiness preflight.
- Fix: Re-fetch submission state immediately before confirm; show changed gate and abort stale action if needed.

## G2-7-004-044  [P1] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:244-255: restores workspace by URL even if not on current paged choices.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:108-111: selected only when UUID in first 1000 choices.
- Fix: Validate project by college directly and load selection beyond list limit.

## G2-7-004-045  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:574-628: releases context only and explicitly do NOT influence readiness gate.
- vNext now: V/modules/projects/readiness-service.ts:100-107: executionComplete REQUIRES at least one SHIPPED release and all releases shipped.
- Fix: Remove release count/shipping from readiness gating; use task and sprint completion, respecting submission state and override.

## G2-7-004-048  [P1] GAP  facet F12  effort L
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:330-341: force-override column displays active Boolean read from ProjectReadinessDTO.
- vNext now: V/modules/projects/admin-readiness-overrides-service.ts:24-42: active overrides reconstructed from latest audit event, filtered state not CLEAR.
- Fix: Prove event stream authoritative vs persisted readiness fields, and handle missing/pre-migration events.

## G2-7-004-054  [P1] GAP  facet F14  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:428-454: `active-readiness-overrides.csv`, six headers Workspace,Workspace ID,Override direction,Override note,Overridden by,Overridden at.
- vNext now: V/app/api/projects/readiness-overrides/export/route.ts:14-22: same filename, five headers Workspace,Override,Note,By,At; Workspace ID missing.
- Fix: Restore six headers, workspace UUID/ID and exact labels/values.

## G2-7-004-067  [P1] GAP  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:112-115: two paged list reads (each 25), detail+releases on demand.
- vNext now: V/modules/projects/college-readiness-releases-service.ts:18-24: loads up to 1000 choices, then entire active overrides event history to select latest.
- Fix: Keep bounded/sargable pagination and prevent candidate invisibility >1000.

## G2-7-004-070  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:321-326,700-720: revalidates live submission state when confirm opens to avoid stale warning.
- vNext now: V/components/projects/project-readiness-override-form.tsx:35-67,121-132: no live preflight on confirm.
- Fix: Preflight latest readiness before showing/applying override.

## G2-7-004-075  [P1] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:590-640: explicit note releases are context only; they never block submission.
- vNext now: V/modules/projects/readiness-service.ts:100-107: releases length and shipping required for completion.
- Fix: Priority owner decision: correct vNext gate; separate informational release metrics.

## G2-7-004-076  [P1] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:420-751: one selected workspace admin-control view.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:123-269: uses report/workspace feed and a separate details form.
- Fix: Restore inline selected workspace full detail and override workflow.

## G2-7-004-030  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:491-498: failed workspace-list fetch gives `Couldn't load workspaces` with server error.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:98-105: general `Submission readiness unavailable` with generic description.
- Fix: Identify partial fetch failure in per-section alert.

## G2-7-004-031  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:513-524: failed per-workspace GET shows `Readiness could not be loaded`, hides stale detail.
- vNext now: V/components/projects/project-workspace-readiness.tsx:33-39: `Workspace readiness unavailable` full error, no original server text.
- Fix: Restore wording and avoid stale values.

## G2-7-004-034  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:312-326,637-655: warning when submission exists `Force Unlock/Block will have no effect here` with reopening guidance.
- vNext now: V/components/projects/project-readiness-override-form.tsx:74-78: short warning omits status/reopen and review action guidance.
- Fix: Restore explanatory warning including resubmission path.
