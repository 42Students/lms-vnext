# Work packet: edit src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u034-superadmin-template-index.md, docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-034-004  [P1] GAP  facet F01  effort L
- Legacy: templates/[templateId]/index.js:15-16 accepts numeric/slug template IDs
- vNext now: admin/projects/templates/[templateId]/page.tsx:25-27 UUID validator only
- Fix: Resolve numeric legacy IDs and slugs safely to UUID

## G2-7-034-009  [P1] MISSING  facet F03  effort M
- Legacy: SuperAdminTemplateShell.jsx:46-52 Back to templates and Use this template primary actions
- vNext now: admin/projects/templates/[templateId]/page.tsx:56 Back, :63-101 status/global actions but no Use this template
- Fix: Restore primary Use this template with templateId handoff

## G2-7-034-010  [P1] GAP  facet F04  effort L
- Legacy: templates/[templateId]/index.js:11-12 templateId from dynamic route and rest params
- vNext now: admin/projects/templates/[templateId]/page.tsx:24-27 UUID projectTemplateIdSchema parse
- Fix: Provide migration ID bridge before typed route

## G2-7-034-019  [P1] MISSING  facet F10  effort M
- Legacy: SuperAdminTemplateShell.jsx:49-51 Use this template routes /superadmin/projects/workspaces/new?templateId={numeric}
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 missing use-template action
- Fix: Restore create-from-template route with safe UUID preselection

## G2-7-034-030  [P1] MISSING  facet F17  effort S
- Legacy: SuperAdminTemplateShell.jsx:46-52 two focusable Back/Use buttons
- vNext now: admin/projects/templates/[templateId]/page.tsx:56 Back plus lifecycle actions no Use
- Fix: Restore keyboard-accessible Use template control

## G2-7-034-033  [P1] MISSING  facet F18  effort S
- Legacy: SuperAdminTemplateShell.jsx:46 Back to templates and :51 Use this template
- vNext now: admin/projects/templates/[templateId]/page.tsx:56 Back to templates and no Use this template
- Fix: Restore exact Use this template CTA

## G2-7-034-040  [P1] MISSING  facet F23  effort M
- Legacy: SuperAdminTemplateShell.jsx:46-52 Use this template primary action
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no action
- Fix: Include in fix list, not dismissed as redundant

## G2-7-035-002  [P1] MISSING  facet F01  effort M
- Legacy: overview.js:445-468 Audit trail link /superadmin/projects/audit?entityId=slug&range=all
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no Audit trail action
- Fix: Add scoped Audit trail link with legacy entity filter mapping

## G2-7-035-003  [P1] MISSING  facet F01  effort M
- Legacy: overview.js:472-475 Create workspace action requires selected college
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no Create workspace primary action
- Fix: Restore create-from-template workflow with selected college guard

## G2-7-035-005  [P1] GAP  facet F01  effort L
- Legacy: overview.js:153-156 templateId accepts old numeric/slug
- vNext now: admin/projects/templates/[templateId]/page.tsx:25-27 UUID-only route
- Fix: Map legacy template identifiers to UUID before 404

## G2-7-035-007  [P1] GAP  facet F02  effort L
- Legacy: overview.js:589-725 one admin-form-card Basic info, Lifecycle settings, Overview content, Submission
- vNext now: admin/projects/templates/[templateId]/page.tsx:113-121 read-only ProjectTemplateView and metadata edit Dialog
- Fix: Restore full editable overview sections or document intentional split and editing routes

## G2-7-035-008  [P1] GAP  facet F02  effort L
- Legacy: overview.js:732-822 three modals Duplicate, Preview, Create from template
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 actions allow Duplicate; no Preview or Create modal
- Fix: Restore Preview and Create dialogs with field-level parity

## G2-7-035-034  [P1] MISSING  facet F08  effort M
- Legacy: overview.js:424 Workspace created from template / :435 server omitted ID warning
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no create action
- Fix: Restore success path, Summary redirect and missing-ID fallback

## G2-7-035-037  [P1] MISSING  facet F09  effort M
- Legacy: overview.js:761-795 Template preview Modal width820
- vNext now: admin/projects/templates/[templateId]/page.tsx:50-156 no Preview modal
- Fix: Restore 820px read-only preview dialog and six-row loading skeleton

## G2-7-035-046  [P1] MISSING  facet F11  effort M
- Legacy: overview.js:409-414 Create workspace requires selected college
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 no create action, not represented
- Fix: Retain selected-college assignment check on restored action

## G2-7-035-058  [P1] MISSING  facet F15  effort M
- Legacy: overview.js:409-443 creating workspace triggers membership/mentor notifications via server
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 create UI omitted
- Fix: Retain creation-side notifications when restored

## G2-7-035-073  [P1] GAP  facet F21  effort L
- Legacy: overview.js:39-49 9 AdminService APIs (preview/create/edit/lifecycle/duplicate)
- vNext now: admin/projects/templates/[templateId]/page.tsx:16-17 read template + action component subset
- Fix: Map each removed REST API into vNext service, with owner decision on omitted workflows

## G2-7-034-014  [P2] GAP  facet F07  effort S
- Legacy: templates/[templateId]/index.js:25-35 No template in this link with guidance
- vNext now: admin/projects/templates/[templateId]/page.tsx:27 notFound()
- Fix: Use equivalent recovery to Templates list

## G2-7-034-015  [P2] GAP  facet F07  effort S
- Legacy: templates/[templateId]/index.js:23-35 explicit ready/missing param state
- vNext now: admin/projects/templates/[templateId]/page.tsx:39-47 notFound and unavailable ErrorState
- Fix: Differentiate invalid UUID from missing/nonexistent template

## G2-7-035-031  [P2] GAP  facet F07  effort S
- Legacy: overview.js:235-240 Failed to load template, error Alert
- vNext now: admin/projects/templates/[templateId]/page.tsx:40-47 Project template unavailable ErrorState
- Fix: Match error heading, retry, known scope
