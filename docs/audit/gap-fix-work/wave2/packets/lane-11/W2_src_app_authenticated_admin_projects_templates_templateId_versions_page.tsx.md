# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-5-017-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy version history entered from Super Admin template page; /versions UI `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:25-52`
- vNext now: New template history under admin/projects/templates/[templateId]/versions through section component `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx:1-18`
- Fix: Compare route/sidebar breadcrumb/parent header with legacy shell.

## G2-8-029-001  [P2] GAP  facet F01  effort M
- Legacy: Old template versions route /superadmin/projects/templates/{templateId}/versions uses numeric templateId from router docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:29-35.
- vNext now: New /admin/projects/templates/{UUID}/versions server route delegates section versions src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx:3-17.
- Fix: Redirect legacy numeric template deep links to canonical UUID.

## G2-8-029-035  [P2] GAP  facet F13  effort M
- Legacy: Old Skeleton 8 paragraphs on initial load; template error and version error distinct docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:169-180.
- vNext now: New server-driven read has ErrorState and no explicit Suspense skeleton in page src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx:3-19; src/components/projects/super-admin-template-subview-page.tsx:103-132.
- Fix: Match spinner/skeleton while navigating history and comparison.
