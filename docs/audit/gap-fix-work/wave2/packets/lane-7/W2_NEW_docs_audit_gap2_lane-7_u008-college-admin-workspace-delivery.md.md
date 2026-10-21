# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u008-college-admin-workspace-delivery.md

29 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u008-college-admin-workspace-delivery.md

## G2-7-008-001  [P2] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:13-21,43-49: route `/college-admin/projects/workspaces/:slug/delivery` in AdminWorkspaceShell with title from workspace.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx:1-25: `/college/projects/:UUID/delivery` generic AdminProjectSectionPage.
- Fix: Provide legacy slug-route redirect and preserve selected Delivery workspace tab.

## G2-7-008-004  [P2] GAP  facet F02  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:45-60: dedicated workspace shell subtitle + one delivery overview component.
- vNext now: V/components/projects/project-workspace.tsx:1212-1415: Final submission section as list of all versions and controls.
- Fix: Restore original hero, Additional evidence and Review grouping.

## G2-7-008-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:88-116: Additional evidence as separate Card with count extra.
- vNext now: V/components/projects/project-workspace.tsx:1300-1322: inline section inside each submission card, no count header.
- Fix: Restore separate evidence Card and additional-item count.

## G2-7-008-007  [P2] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:118-137: Review as separate Card with reviewed by/at + mentor feedback.
- vNext now: V/components/projects/project-workspace.tsx:1345-1354: per-version review callout, no reviewer/timestamp fields.
- Fix: Expose reviewed-by and reviewed-at with independent Review card.

## G2-7-008-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:56-58: Review status Tag tinted via reviewStatusColor.
- vNext now: V/components/projects/project-workspace.tsx:1270-1278: per-version submission status StatusBadge, not reviewStatus.
- Fix: Render actual review status with legacy color mapping independent of delivery status.

## G2-7-008-011  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:47-49: subtitle `Review the final submission package, evidence, revisions and mentor feedback.`
- vNext now: V/components/projects/project-workspace.tsx:1213-1224: heading `Final submission`, no equivalent workspace subtitle.
- Fix: Restore exact subtitle in workspace header.

## G2-7-008-012  [P2] GAP  facet F04  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:53-57: hero `Final delivery` / `Submission package and review state` and reviewStatus tag.
- vNext now: V/components/projects/project-workspace.tsx:1220-1224: `Final submission` heading, Version N and status per row.
- Fix: Restore exact eyebrow/headline and review badge.

## G2-7-008-013  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:41-46: Submission type, Submitted by, Submitted at, Revisions 4 facts.
- vNext now: V/components/projects/project-workspace.tsx:1280-1293: same four facts, but value type inferred from attachments and revision=version-1.
- Fix: Use backend submissionType and revisionCount where present, preserve fallback em dash.

## G2-7-008-017  [P2] GAP  facet F05  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:93-114: additional evidence shows original array order; item label/fileName/Attachment N.
- vNext now: V/components/projects/project-workspace.tsx:1302-1322: evidence order preserved but name from attachment.name else Evidence.
- Fix: Fallback label to item.label/fileName/Attachment N in original order.

## G2-7-008-020  [P2] GAP  facet F06  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:73-82: primary file/source link actions open new tabs safely.
- vNext now: V/components/projects/project-workspace.tsx:1324-1344: source/demo links, signed download control for attachments.
- Fix: Add primary submitted file action and source fallback while retaining signed-file authorization.

## G2-7-008-027  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:19; components/admin/projects/adminWorkspaceSection.js: workspace GET via getProjectById.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: Promise.all workspace, readiness, meetings, finalDelivery, taskSubmissions, evaluation, activity.
- Fix: Load only delivery essentials on audit detail to reduce unrelated data dependencies.

## G2-7-008-032  [P2] GAP  facet F12  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-34: no resolvedDelivery/data -> `No final delivery has been submitted yet.`
- vNext now: V/components/projects/project-workspace.tsx:1232-1235: zero final submissions -> `Not submitted`/`No final delivery has been submitted.`
- Fix: Match exact no-submission copy and task-level submission pointer.

## G2-7-008-035  [P2] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:36-39: legacy attachmentUrl/submissionFileUrl and sourceUrl direct safe HTTP.
- vNext now: V/components/projects/project-workspace.tsx:1244-1257,1299-1344: fileId signed download, source/demo, JSON attachment structure.
- Fix: Map persisted evidence and links into new scheme; maintain old URL fallback if migration exists.

## G2-7-008-037  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:20-33: no submission shows Delivery Card, empty message and task submissions hint.
- vNext now: V/components/projects/project-workspace.tsx:1232-1235: basic EmptyState no task-level hint.
- Fix: Restore instructional task-submission message and Delivery Card.

## G2-7-008-038  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:113-115: no evidence -> `No additional files or links.`
- vNext now: V/components/projects/project-workspace.tsx:1299-1322: entire evidence section omitted if zero.
- Fix: Render Additional evidence Card with explicit empty state.

## G2-7-008-039  [P2] GAP  facet F13  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:129-135: no mentor feedback -> `No mentor feedback has been recorded yet.`
- vNext now: V/components/projects/project-workspace.tsx:1345-1354: review feedback callout absent if none; no fallback.
- Fix: Show full Review Card with absence explanation.

## G2-7-008-042  [P2] GAP  facet F16  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:49-137: hero facts four-cell grid, evidence item list, review fields wrap.
- vNext now: V/components/projects/project-workspace.tsx:1279-1294: responsive sm 2-column facts inside each version.
- Fix: Restore hero facts grid and Card spacing at 375,768,1280.

## G2-7-008-045  [P2] GAP  facet F17  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:99-110: attachment displays fallback name and Unavailable link text.
- vNext now: V/components/projects/project-workspace.tsx:1302-1322: inaccessible FILE shows `(not available)` and LINK invalid shows File text.
- Fix: Distinguish invalid LINK from file; preserve meaningful accessible fallback.

## G2-7-008-046  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:48: `Review the final submission package, evidence, revisions and mentor feedback.`
- vNext now: V/components/projects/project-workspace.tsx:1212-1224: only `Final submission`.
- Fix: Restore exact header subtitle.

## G2-7-008-047  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:53-54: `Final delivery` and `Submission package and review state`.
- vNext now: V/components/projects/project-workspace.tsx:1220-1224: `Final submission`.
- Fix: Restore eyebrow and headline.

## G2-7-008-048  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:70-75,88-90,118-121: `Primary submission`, `Additional evidence`, `Review`, `Mentor feedback`.
- vNext now: V/components/projects/project-workspace.tsx:1299-1354: Additional evidence and Review callout only; no Primary submission label.
- Fix: Restore section headings and card structure.

## G2-7-008-050  [P2] GAP  facet F19  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:19: one workspace summary GET.
- vNext now: V/modules/projects/workspace-view-service.ts:37-66: fetches eight related services plus roster/template/comment counts.
- Fix: Use targeted delivery projection, or lazy load ancillary workspace tabs.

## G2-7-008-052  [P2] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:19,50-59: useAdminWorkspace reload action and skeleton on retry.
- vNext now: V/components/projects/admin-project-section-page.tsx:24-40: server action await without retry in section body.
- Fix: Expose retry without losing workspace tab/context.

## G2-7-008-008  [P3] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:2,73-82: DownloadOutlined for primary file, LinkOutlined for source.
- vNext now: V/components/projects/project-workspace.tsx:1325-1344: `Open source ↗`/`Open demo ↗` text, evidence file download distinct.
- Fix: Restore icon/button affordances and legacy primary file action.

## G2-7-008-010  [P3] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:90-92: additional evidence count with correct item plural.
- vNext now: V/components/projects/project-workspace.tsx:1299-1304: section heading Additional evidence but no count.
- Fix: Add count and pluralization in evidence card.

## G2-7-008-016  [P3] GAP  facet F05  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:61-69: responsive facts grid four named fields.
- vNext now: V/components/projects/project-workspace.tsx:1279-1294: 2-column definition list on sm, same number fields.
- Fix: Restore legacy 4-fact summary metric layout/spacing.

## G2-7-008-021  [P3] GAP  facet F06  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:93-110: each evidence item has Open or `Unavailable link` when invalid.
- vNext now: V/components/projects/project-workspace.tsx:1302-1322: invalid/missing file represented `File · name (not available)`; link kind-specific.
- Fix: Use consistent `Unavailable link` fallback and an accessible action slot.

## G2-7-008-028  [P3] GAP  facet F10  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-18: resolvedDelivery or delivery embedded in workspace DTO, no standalone detail GET.
- vNext now: V/modules/projects/workspace-view-service.ts:41-66: dedicated listProjectSubmissions and evaluation/reviews reads.
- Fix: Document API redesign; ensure latest resolvedDelivery projection parity.

## G2-7-008-049  [P3] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:26-28: `No final delivery has been submitted yet.` plus task-level hint.
- vNext now: V/components/projects/project-workspace.tsx:1232-1235: `No final delivery has been submitted.`
- Fix: Use exact no-submission strings.
