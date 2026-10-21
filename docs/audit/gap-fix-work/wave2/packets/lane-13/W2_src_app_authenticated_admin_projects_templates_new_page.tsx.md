# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/templates/new/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-5-029-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy route `/superadmin/projects/templates/new` inside superadmin projects grouped shell, `Back to templates` button in page head. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:46-53,148-166`
- vNext now: vNext `/admin/projects/templates/new` has PageBackLink above PageHeader; group shell not rendered on this page. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:7-20`
- Fix: Match old group shell tabstrip and back button placement.

## G2-5-029-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy order: group shell, page head/back, Card generic help paragraph, full vertical Form. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:148-172`
- vNext now: vNext page header and unboxed grid form, introductory draft summary then basic fields. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:14-19`, `src/components/projects/super-admin-template-create-form.tsx:38-56`
- Fix: Wrap form in original card, align header/help spacing and section dividers.

## G2-5-029-056  [P2] GAP  facet F18  effort M
- Legacy: Legacy header subtitle and generic template help exact. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:151-170`
- vNext now: vNext extra publishing restriction and seeded draft text. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:16-18`, `src/components/projects/super-admin-template-create-form.tsx:39-39`
- Fix: Restore original title/subtitle/help before adding safety notes.

## G2-5-029-006  [P3] GAP  facet F03  effort S
- Legacy: Legacy heading `Create project template` and `Define the reusable blueprint for workspaces.` `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:151-155`
- vNext now: vNext heading matches, adds college-scope publishing restriction in description. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:14-18`
- Fix: Keep original subtitle as first line; show policy restriction separately.
