# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u005-college-admin-project-template-detail.md

12 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u005-college-admin-project-template-detail.md

## G2-7-005-002  [P1] MISSING  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:160-167: `Use this template` opens new workspace form with `?templateId=` and template preselected.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33-47: no Use this template CTA or creation deep link.
- Fix: Add primary use-template CTA to `/college/projects/create?templateId=<UUID>` preselecting assigned version.

## G2-7-005-003  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:84,100: legacy route template ID integer sent to GET by id.
- vNext now: V/modules/projects/template-service.ts:163-171,185-203: template ID must be UUID and assigned to college.
- Fix: Bridge old integer-ID bookmarks via redirect/lookup if legacy deep-link migration required.

## G2-7-005-019  [P1] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:153-167: only Back and Use actions; detail itself read-only.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:39-42: only Back action.
- Fix: Restore use-template form launch; keep editing disabled.

## G2-7-005-021  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:102-114,171-183: failed GET -> `Template could not be loaded` with API error and Retry button.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:20-25: awaited service can throw, no local ErrorState/retry.
- Fix: Catch access/not found/database read separately; show legacy Retry and failure message.

## G2-7-005-026  [P1] GAP  facet F09  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:160-166: old weaker modal create flow removed in favor of dedicated form.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:33-47: no create modal or form entry.
- Fix: Add deep link to full workspace create form, never lightweight duplicate modal.

## G2-7-005-029  [P1] GAP  facet F10  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:145-230: GET only; click Use navigates to creation route.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:16-47: GET only; missing creation navigation.
- Fix: Restore CTA to authoritative create route.

## G2-7-005-031  [P1] GAP  facet F11  effort M
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:69-74: college is browsing global platform catalog read-only, superadmin authors.
- vNext now: V/modules/projects/template-service.ts:185-235: only assigned, PUBLISHED templates with nonrevoked college assignment.
- Fix: Determine whether old catalog exposed all published templates; if so add read-only browsing or assignment explanation.

## G2-7-005-053  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectTemplate.java:12-45,68-90: project_template numeric id, slug80/title160, lifecycleStatus, publishedAt, four JSON blocks.
- vNext now: V/db/schema/projects.ts:26-118: template UUID, slug96/title text, status DRAFT/PUBLISHED/ARCHIVED, version blueprint JSONB.
- Fix: Define template migration/model adapter for ID, lifecycle timestamp and all JSON section fields.

## G2-7-005-056  [P1] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:157-165: removed redundant Preview and alternate weak create modal; only full create workflow.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:27-47: neither preview nor use action.
- Fix: Restore only full create CTA, not preview or modal.

## G2-7-005-057  [P1] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:69-74: college read-only global template catalog.
- vNext now: V/modules/projects/template-service.ts:225-235: version must be assigned and published.
- Fix: Ensure scope/authorization and catalog visibility meet product requirements.

## G2-7-005-022  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:225-229: if successful but no template, `Template not found`; does not show alongside failure.
- vNext now: V/modules/projects/template-service.ts:225-235: throws PROJECT_TEMPLATE_NOT_ASSIGNED; no mapped not-found component.
- Fix: Render true not-found/no-assignment state distinct from service errors.

## G2-7-005-023  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:132-142: missing college warning `Admin not assigned to a college` and instruction, preserves Projects group strip.
- vNext now: V/app/(authenticated)/college/projects/templates/[templateId]/page.tsx:16-18: generic ProjectAdminMissingCollege without detail-specific copy.
- Fix: Restore exact no-college message and project nav.
