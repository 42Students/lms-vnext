# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u005-college-admin-project-template-detail.md

30 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u005-college-admin-project-template-detail.md

## G2-7-005-004  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:148-169: header title, fixed subtitle, Back and primary Use this template.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33-43: dynamic template title/summary and back+Version badge.
- Fix: Restore dedicated `Project template` page head, subtitle and two actions.

## G2-7-005-005  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:190-210: template header Card with status, version Tag, title, summary, published-at.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33-45: only title/summary in PageHeader and Version badge.
- Fix: Render status/version/title/summary/published-at summary card in legacy order.

## G2-7-005-006  [P2] GAP  facet F02  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:212-219: separate `Section counts` Card with Overview/Sprints/Tasks/Resources tags.
- vNext now: V/components/projects/project-template-view.tsx:93-109,131-139: count badge per Sprints/Tasks/Resources section; no centralized counts or Overview count.
- Fix: Restore Section counts card, including Overview count.

## G2-7-005-007  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:221-225: four small Cards in order Overview, Sprints, Tasks, Resources.
- vNext now: V/components/projects/project-template-view.tsx:69-110,130-171: border-separated sections, inserts Releases after Overview.
- Fix: Use legacy four-card order and styles; treat Releases as optional enhancement.

## G2-7-005-008  [P2] MISSING  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:153-168: outlined Back to templates and primary plus-icon Use this template.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:39-42: PageBackLink and neutral Version badge; no plus CTA.
- Fix: Restore PlusOutlined-style primary button and Back action.

## G2-7-005-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:194-197: lifecycle status colorful Tag and ReadOutlined Version N Tag.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:41: neutral Version badge only.
- Fix: Show lifecycle status and book/version icon together.

## G2-7-005-011  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:150-151: title `Project template`, subtitle `Maintained by 42Students — use this template to start a workspace.`
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33-37: dynamically displays version.title/version.summary.
- Fix: Move template title/summary into card; restore exact page header copy.

## G2-7-005-012  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:200-208: display normalised title, summary fallback em dash, `Published at: {timestamp}`.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:34-37: summary fallback fixed `Published template assigned to this college.`, no date.
- Fix: Restore em-dash fallback and Published at timestamp.

## G2-7-005-015  [P2] GAP  facet F04  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:47-50: row tags show first title/name/label fallback.
- vNext now: V/components/projects/project-template-view.tsx:146-158: article displays title, fallback key/Untitled and description.
- Fix: Restore tag-style concise list label fallback or document intentional detail enhancement.

## G2-7-005-016  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:44-65: Overview one-column bordered Descriptions; Sprint/Task/Resource entries pill Tags.
- vNext now: V/components/projects/project-template-view.tsx:69-91,131-171: Overview prose/list and vertically stacked articles.
- Fix: Restore bordered Descriptions and compact Tag rows.

## G2-7-005-017  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:212-218: explicit four count badges on one card, zero shown.
- vNext now: V/components/projects/project-template-view.tsx:93-110: releases added, count only for list-type sections; no Overview count.
- Fix: Compute Overview meaningful key count, show count zero when absent.

## G2-7-005-027  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:100; api/Services/AdminService.js:410-420: `getProjectTemplateById(id,collegeId)` GET `/api/v1/admin/project-templates/:integerId`.
- vNext now: V/modules/projects/template-service.ts:163-237: direct DB lookup of assigned published template version by UUID.
- Fix: Map legacy integer to new UUID catalog and document endpoint replacement.

## G2-7-005-028  [P2] GAP  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:100-114: response is full ProjectTemplateDTO with overview/sprints/tasks/resources.
- vNext now: V/modules/projects/template-service.ts:186-237: joins assignment/template/version and reads JSONB blueprint.
- Fix: Guarantee all legacy sections mapped to published blueprint, not silently omitted.

## G2-7-005-032  [P2] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:132-140: no college keeps tab strip visible.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:18: immediately returns generic missing-college component.
- Fix: Preserve templates tab strip in no-scope state.

## G2-7-005-033  [P2] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:27-34: section whitelist overview goal/deliverables excludes legacy junk fields.
- vNext now: V/components/projects/project-template-view.tsx:3-8,69-89: goal/deliverables plus definitionOfDone; schema assumes typed shape.
- Fix: Normalize legacy flexible overview types and consistently count/render allowed fields.

## G2-7-005-034  [P2] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:45-49: object array rows use title OR name OR label fallback.
- vNext now: V/components/projects/project-template-view.tsx:145-154: only title or key fallback.
- Fix: Accept name/label fallbacks during legacy blueprint ingestion.

## G2-7-005-037  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:171-184: error and Retry available when GET fails.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:16-26: no error boundary in this component.
- Fix: Use explicit ErrorState with retry link rather than uncaught throw.

## G2-7-005-038  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:226-229: `Template not found` only on clean no-data.
- vNext now: V/modules/projects/template-service.ts:230-235: missing assignment throws; no route-local empty handling.
- Fix: Distinguish 404, no assignment and transient backend failure.

## G2-7-005-041  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:43-65: compact Cards/Space wraps multi-value pill lists.
- vNext now: V/components/projects/project-template-view.tsx:68-111: full-width sections and responsive md two-column overview.
- Fix: Restore 1-column bordered Descriptions and small card spacing responsive widths.

## G2-7-005-043  [P2] GAP  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:153-167: Back and Use are native Ant Buttons, Use disabled while template missing.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:39-42: back link, no disabled Use action.
- Fix: Use native accessible button/link, disable until validated assignment.

## G2-7-005-045  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:150-166: copy `Project template`, `Maintained by 42Students — use this template to start a workspace.`, `Back to templates`, `Use this template`.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33-42: dynamic title/summary and `Template catalogue`; Use missing.
- Fix: Restore four exact strings and button placement.

## G2-7-005-046  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:194-219: `Published at:`, `Section counts`, `Overview N`, `Sprints N`, `Tasks N`, `Resources N`.
- vNext now: V/components/projects/project-template-view.tsx:93-109,135-143: headings, per-section badge; published date absent.
- Fix: Restore status/timestamp/count labels.

## G2-7-005-051  [P2] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:162-167: templateId URL-encoded in use-template query.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:27-47: use-template href absent.
- Fix: URL-encode template UUID in restored CTA.

## G2-7-005-054  [P2] GAP  facet F22  effort L
- Legacy: LBE/dto/projects/ProjectTemplateDTO.java:7-27: id,status,templateVersion,lifecycleStatus,publishedAt,overview,sprints,tasks,resources,delivery,meetings,activity.
- vNext now: V/modules/projects/template-service.ts:185-237: assignment/version/template split, Blueprint with overview/releases/sprints/tasks/resources.
- Fix: Preserve meaningful delivery/meetings/activity if required by legacy template consumption.

## G2-7-005-055  [P2] GAP  facet F22  effort S
- Legacy: LBE/controller/AdminProjectTemplateController.java:103-132: GET global template by integer id; separate preview returns same payload.
- vNext now: V/modules/projects/template-service.ts:163-237: GET assigned only, no preview endpoint.
- Fix: Record intentional removal of redundant preview; validate assignment visibility.

## G2-7-005-010  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:213-218: section count labels as plain Tags.
- vNext now: V/components/projects/project-template-view.tsx:135-139: neutral numeric Badge near each section.
- Fix: Use exact compact Tags for central Section counts.

## G2-7-005-014  [P3] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:44-63: empty array says `No {section} configured`; empty object says `No {section} provided.`
- vNext now: V/components/projects/project-template-view.tsx:140-143: all empty section lists say `None configured.`
- Fix: Restore per-section empty sentences.

## G2-7-005-042  [P3] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:153-169: page header actions wrap at mobile.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:39-42: flex-wrap actions, only back+Version.
- Fix: Add Use action while preserving wrap and touch targets.

## G2-7-005-047  [P3] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:52-63: `No {section} configured` vs `No {section} provided.`
- vNext now: V/components/projects/project-template-view.tsx:140-143: `None configured.`
- Fix: Match detailed per-section empty copy.

## G2-7-005-049  [P3] GAP  facet F19  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:122-130: counts computed client-side only for four sections.
- vNext now: V/components/projects/project-template-view.tsx:135-139: counts rows length at render.
- Fix: Add computed Overview meaningful-field count.
