# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

34 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md

## G2-7-004-003  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:379-385: Manage active override scrolls to same page's selected Manual override form.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:160-164: Manage navigates to `/<projectId>/readiness` separate page.
- Fix: Keep selected readiness and manual override inline on group page or provide equivalent focus-preserving navigation.

## G2-7-004-004  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:394-405: missing college shows readiness-specific warning.
- vNext now: V/app/(authenticated)/college/projects/readiness/page.tsx:20-21: generic missing-college component.
- Fix: Use exact readiness-specific warning.

## G2-7-004-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:420-472: Active overrides `Card` with badge and Export in extra.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:147-172: Disclosure with count inside heading; Export below.
- Fix: Restore card header badge+button grouping.

## G2-7-004-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:424-430: Badge with gold count (showZero) and DownloadOutlined small Export button.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:147-172: textual count in Disclosure title, plain anchor Export.
- Fix: Use gold badge and download icon inside card extra.

## G2-7-004-012  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:533-541: top readiness tag green Ready/red Not ready and suffix (override).
- vNext now: V/components/projects/project-workspace-readiness.tsx:47-49: Ready/Not ready status badge, no `(override)` suffix.
- Fix: Append `(override)` when forced and use legacy tones.

## G2-7-004-013  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:412-413: subtitle `See whether each team is ready to submit, and override the gate when you need to.`
- vNext now: V/components/projects/project-admin-readiness-page.tsx:119-120: prefixed `Execution completion and final-delivery readiness across project workspaces.`
- Fix: Restore exact subtitle.

## G2-7-004-014  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:330-341,355-373: overrides use `Force unlocked`/`Force blocked` labels, colored tags, note, by, at.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:154-162: `Ready`/`Not ready`, no Force prefix or icon.
- Fix: Map stored direction to exact forced labels.

## G2-7-004-015  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:526-581: `Tasks completed`, `Sprints completed`, `Releases shipped`, `Submission status`, `State`, `Reason`, `Override active`, note/by/at.
- vNext now: V/components/projects/project-workspace-readiness.tsx:59-82: State, Reason, Submission status and progress fields; no explicit Override active row.
- Fix: Restore all Descriptions labels and value fallbacks.

## G2-7-004-016  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:550-565: separate task and sprint progress bars, explaining readiness is server-driven.
- vNext now: V/components/projects/project-workspace-readiness.tsx:72-82: three MetricBars including Releases, no specific explanatory text near bars except header.
- Fix: Use two task/sprint bars; move release context to separate section.

## G2-7-004-024  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:492-512: Input.Search live clearable with `Search workspaces by title or ID` and Select.showSearch.
- vNext now: V/components/projects/admin-readiness-workspace-picker.tsx:17-24: Input with label matching but placeholder `Search workspace`; radio choices, no Select.
- Fix: Restore Input.Search icon/placeholder and searchable Select.

## G2-7-004-025  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:382-385: Manage action uses scrollIntoView to override form.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:160-164: navigates to separate detail.
- Fix: Scroll to inline form and set selected project, or explicitly redirect/focus form.

## G2-7-004-026  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:676-704: override state Radio.Button true/false plus Clear only if active.
- vNext now: V/components/projects/project-readiness-override-form.tsx:81-96: native Select lists Clear always.
- Fix: Use segmented radio control and conditionally show Clear only on active override.

## G2-7-004-028  [P2] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:700-724: confirm dropdown opens Popconfirm with decision-specific OK `Apply override`/`Clear override`.
- vNext now: V/components/projects/project-readiness-override-form.tsx:121-129: ConfirmDialog always button `Apply override`.
- Fix: Set confirm action label to Clear override for clear state.

## G2-7-004-037  [P2] GAP  facet F09  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:705-721: confirm descriptions differ for Clear/Apply and state with existing submission.
- vNext now: V/components/projects/project-readiness-override-form.tsx:124-126: generic `The manual override will be removed.`/`visible to mentors and learners`.
- Fix: Restore decision-specific effects text and submission precedence warning.

## G2-7-004-038  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:112-115: two GET `/api/v1/admin/projects/page` calls, one paged choices and one view READINESS_OVERRIDE.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:92-97: three server services read snapshots, all override events and up-to-1000 choices.
- Fix: Maintain scoped server pagination and distinct error handling for overrides/choices.

## G2-7-004-049  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:591-629: release Points column shows completedPoints/committedPoints.
- vNext now: V/modules/projects/college-readiness-releases-service.ts:56-65: only total estimates, not per-release completed fraction.
- Fix: Compute per-release committed and completed estimates.

## G2-7-004-052  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:738-750: no selected project -> informational `Select a workspace` alert with next steps.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:123-147: selector always exists, no equivalent info alert.
- Fix: Render non-selected instructional callout under selection.

## G2-7-004-055  [P2] GAP  facet F14  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:429-450: export only activeOverrides on displayed page, disabled empty.
- vNext now: V/app/api/projects/readiness-overrides/export/route.ts:13-22: export all active event-driven overrides regardless of displayed page; link always enabled.
- Fix: Export visible 25-row page and disable with empty as legacy; document scope.

## G2-7-004-058  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:490-511: workspace search/Select width420 max100%; override table scroll x=max-content.
- vNext now: V/components/projects/admin-readiness-workspace-picker.tsx:20-55: full-width 25 radio list max-h64 scroll; DataTable responsive.
- Fix: Honor 420px picker width and scrollable active table at mobile.

## G2-7-004-059  [P2] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:552-574: two responsive descriptions columns (xs1/sm2).
- vNext now: V/components/projects/project-workspace-readiness.tsx:61: 1 column mobile, 3 at >=768, different info cards.
- Fix: Use legacy 1/2 column details layout.

## G2-7-004-060  [P2] GAP  facet F17  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:490-511: Search has aria-label; showSearch searchable Select with proper option names.
- vNext now: V/components/projects/admin-readiness-workspace-picker.tsx:17-55: labelled search and Radio group; form `View readiness` button.
- Fix: Use accessible combo/search semantics and route selection without extra submit.

## G2-7-004-063  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:412-413: `Submission readiness` header and exact one sentence.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:119-120: `Submission readiness` but adds execution/final-delivery qualifier.
- Fix: Use legacy sentence exactly.

## G2-7-004-064  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:426-452: `Active overrides`, `Export displayed page CSV`.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:147-172: `Active overrides (N)`, `Export overrides CSV`.
- Fix: Restore labels while retaining numeric badge.

## G2-7-004-065  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:495-509: `Search workspaces by title or ID`, `Select a project workspace`, `Previous workspaces`, `Next workspaces`.
- vNext now: V/components/projects/admin-readiness-workspace-picker.tsx:17-55: `Search workspace`, radio list, `Previous`, `Next`, `View readiness`.
- Fix: Restore all selection control copy.

## G2-7-004-066  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:655-720: Popconfirm `Apply this readiness override?` / `Clear this readiness override?`, Save override.
- vNext now: V/modules/projects/readiness-override-copy.ts:1-8: titles and Save match, but form confirmLabel always Apply override at form.tsx:126.
- Fix: Use `Clear override` confirmation action when clearing.

## G2-7-004-072  [P2] GAP  facet F22  effort M
- Legacy: LBE/dto/projects/AdminProjectReadinessOverrideDTO.java:8-14: override Boolean nullable and note <=2000; ProjectReadinessDTO.java:6-27 includes ready/state/reason/overrideAt.
- vNext now: V/modules/projects/readiness-override-model.ts:2-9: state union FORCE_UNLOCK/BLOCK/CLEAR note1..2000, payload strict; readiness-service.ts:117-155 nested execution/submission.
- Fix: Define API adapter and public readiness fields mapping across versions.

## G2-7-004-010  [P3] MISSING  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:468-477: green CheckCircleFilled empty overrides pictogram.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:148-150: plain muted paragraph.
- Fix: Restore green all-clear icon and Empty component.

## G2-7-004-011  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:330-341: Force unlocked green lock icon / Force blocked volcano lock icon.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:154-162: plain direction text.
- Fix: Restore lock icons and directional tag colors.

## G2-7-004-027  [P3] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:651-675: note required unless Clear, maxLength=2000, showCount; clear note disabled.
- vNext now: V/components/projects/project-readiness-override-form.tsx:98-114: textarea omitted on Clear; maxlength 2000 and required when forced, no counter.
- Fix: Keep text counter, clearing explanation, disabled textarea state.

## G2-7-004-041  [P3] GAP  facet F10  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:274-291: response includes fresh readiness DTO; applies it without full refetch.
- vNext now: V/components/projects/project-readiness-override-form.tsx:57-59: router.refresh() after event write.
- Fix: Provide immediate updated readiness display without a full route load, or accept refresh tradeoff.

## G2-7-004-051  [P3] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:468-477: specific zero-overrides green all-clear empty.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:147-150: identical sentence but plain text.
- Fix: Restore icon and strong empty messaging.

## G2-7-004-053  [P3] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:591-606: no release data -> `No releases defined on this project.`
- vNext now: V/components/projects/project-admin-readiness-page.tsx:131-133: `No releases recorded`, `There are no releases for this workspace yet.`
- Fix: Restore release empty-state copy.

## G2-7-004-062  [P3] GAP  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:690-703: 2000-char showCount and disabled clearing hint.
- vNext now: V/components/projects/project-readiness-override-form.tsx:101-112: maxlength2000 with no counter.
- Fix: Add remaining-count feedback for textarea.

## G2-7-004-068  [P3] GAP  facet F19  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:274-291: optimistic response detail update and override list total recheck.
- vNext now: V/components/projects/project-readiness-override-form.tsx:57-60: full router refresh to rebuild all views.
- Fix: Consider response reconciliation without unnecessary full-group refresh.
