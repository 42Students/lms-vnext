# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u034-superadmin-template-index.md, docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-7-034-002  [P2] GAP  facet F01  effort M
- Legacy: templates/[templateId]/index.js:16-19 router.replace preserves all non-templateId query keys
- vNext now: admin/projects/templates/[templateId]/page.tsx:19-27 directly renders overview, no query forwarding or redirect
- Fix: Preserve safe legacy query handoffs to new overview

## G2-7-034-006  [P2] GAP  facet F02  effort M
- Legacy: SuperAdminTemplateShell.jsx:30-58 inner template pages have one PageShell and six/seven section links
- vNext now: admin/projects/templates/[templateId]/page.tsx:50-113 ProjectAdminNav, PageBackLink, PageHeader, SuperAdminTemplateTabs
- Fix: Avoid stacked outer Projects tabs, match legacy template shell geometry

## G2-7-034-008  [P2] GAP  facet F03  effort S
- Legacy: templates/[templateId]/index.js:25-35 warning Alert No template in this link when id missing
- vNext now: admin/projects/templates/[templateId]/page.tsx:26-27 notFound on bad param
- Fix: Show actionable missing-ID warning instead of generic 404 on old malformed URL

## G2-7-034-022  [P2] GAP  facet F12  effort S
- Legacy: templates/[templateId]/index.js:6-9 old root is only compatibility redirect, not a page
- vNext now: admin/projects/templates/[templateId]/page.tsx:19-156 root IS full overview
- Fix: Support redirect, while new canonical route may render directly

## G2-7-034-024  [P2] GAP  facet F13  effort S
- Legacy: templates/[templateId]/index.js:38-43 Skeleton during router ready/hydration
- vNext now: admin/projects/templates/[templateId]/page.tsx:36-47 awaits detail and returns ErrorState
- Fix: Provide matching loading fallback on delayed detail read

## G2-7-034-025  [P2] GAP  facet F13  effort S
- Legacy: templates/[templateId]/index.js:25-35 no ID warning vs Skeleton
- vNext now: admin/projects/templates/[templateId]/page.tsx:26-27 invalid ID 404
- Fix: Preserve no-template state with Back action

## G2-7-034-029  [P2] GAP  facet F17  effort S
- Legacy: templates/[templateId]/index.js:25-35 warning Alert accessible title, no link
- vNext now: admin/projects/templates/[templateId]/page.tsx:26-27 404 notFound
- Fix: Provide accessible missing-ID guidance and focus heading

## G2-7-034-031  [P2] GAP  facet F18  effort S
- Legacy: templates/[templateId]/index.js:30 No template in this link
- vNext now: admin/projects/templates/[templateId]/page.tsx:26-27 no matching copy
- Fix: Restore exact warning title

## G2-7-034-032  [P2] GAP  facet F18  effort S
- Legacy: templates/[templateId]/index.js:31 The URL is missing a template id. Open the template from the Templates list instead.
- vNext now: admin/projects/templates/[templateId]/page.tsx:43-46 generic failed template detail
- Fix: Restore exact fallback text

## G2-7-035-004  [P2] GAP  facet F01  effort M
- Legacy: overview.js:563-568 SuperAdminTemplateShell section nav and heading
- vNext now: admin/projects/templates/[templateId]/page.tsx:50-113 template tabs and PageHeader
- Fix: Match original template shell title, actions and tab positions

## G2-7-035-006  [P2] GAP  facet F02  effort M
- Legacy: overview.js:563-587 shell then status/version Card with published/archived timestamps
- vNext now: admin/projects/templates/[templateId]/page.tsx:57-113 status in heading and version info in history
- Fix: Rebuild dedicated status/version/timestamp Card

## G2-7-035-009  [P2] GAP  facet F02  effort M
- Legacy: overview.js:573-730 10-row Skeleton then two Cards
- vNext now: admin/projects/templates/[templateId]/page.tsx:36-47 awaited service and ErrorState, no skeleton
- Fix: Provide ten-row template skeleton during loading

## G2-7-035-010  [P2] GAP  facet F03  effort M
- Legacy: overview.js:459-559 button order Audit trail, Preview, Create workspace, Duplicate, Publish/Unpublish, Archive
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 status, metadata edit, ProjectTemplateActions subset
- Fix: Restore order, exact icon family and enabled states

## G2-7-035-011  [P2] GAP  facet F03  effort S
- Legacy: overview.js:577-586 lifecycle status Tag and Version Tag with ReadOutlined
- vNext now: admin/projects/templates/[templateId]/page.tsx:65-75 StatusBadge and :123-151 version history
- Fix: Show Version N icon tag near status as legacy

## G2-7-035-012  [P2] MISSING  facet F03  effort M
- Legacy: overview.js:583-586 Published at/Archived at Descriptions
- vNext now: admin/projects/templates/[templateId]/page.tsx:57-155 not displayed in reviewed page
- Fix: Add publishedAt/archivedAt metadata

## G2-7-035-018  [P2] GAP  facet F04  effort S
- Legacy: overview.js:582-586 templateVersion, publishedAt, archivedAt fields
- vNext now: admin/projects/templates/[templateId]/page.tsx:105-110 versions count/current version, no publication timestamps
- Fix: Expose exact timestamps/status labels

## G2-7-035-042  [P2] GAP  facet F10  effort M
- Legacy: overview.js:362-382 GET project template preview endpoint
- vNext now: admin/projects/templates/[templateId]/page.tsx:113-121 embeds ProjectTemplateView with existing blueprint, no preview API
- Fix: Restore explicit preview of a prospective workspace

## G2-7-035-052  [P2] GAP  facet F13  effort M
- Legacy: overview.js:573 ten-row Skeleton while loading
- vNext now: admin/projects/templates/[templateId]/page.tsx:36-47 awaited fetch then ErrorState or rendered page
- Fix: Restore representative ten-row loading placeholder

## G2-7-035-053  [P2] GAP  facet F13  effort S
- Legacy: overview.js:569-570 Template could not be loaded Alert
- vNext now: admin/projects/templates/[templateId]/page.tsx:43 Project template unavailable ErrorState
- Fix: Match exact failed title and retry

## G2-7-035-054  [P2] GAP  facet F13  effort S
- Legacy: overview.js:727-729 Template not found warning when 404
- vNext now: admin/projects/templates/[templateId]/page.tsx:40 notFound
- Fix: Show recoverable template not found with Back link

## G2-7-035-055  [P2] MISSING  facet F13  effort S
- Legacy: overview.js:791-793 No preview available inside modal
- vNext now: admin/projects/templates/[templateId]/page.tsx:113-121 no preview modal
- Fix: Restore preview empty state

## G2-7-035-059  [P2] GAP  facet F16  effort M
- Legacy: overview.js:576-725 Card forms two-column md fields, one column xs
- vNext now: admin/projects/templates/[templateId]/page.tsx:50-155 flexible layout and Dialog for metadata
- Fix: Match 375/768/1280 breakpoints/card widths and action wrap

## G2-7-035-064  [P2] GAP  facet F18  effort S
- Legacy: overview.js:565-567 Identity, lifecycle and the overview content mentors and students read.
- vNext now: admin/projects/templates/[templateId]/page.tsx:58-62 description summary or Global project template.
- Fix: Use exact section subtitle, put summary in content

## G2-7-035-065  [P2] MISSING  facet F18  effort S
- Legacy: overview.js:595 Basic info, :629 Lifecycle settings, :652 Overview content, :692 Submission
- vNext now: admin/projects/templates/[templateId]/page.tsx:113-155 Overview and Version history sections
- Fix: Restore section headers and hierarchy

## G2-7-035-067  [P2] MISSING  facet F18  effort S
- Legacy: overview.js:469 Preview / :474 Create workspace / :487 Duplicate
- vNext now: admin/projects/templates/[templateId]/page.tsx:63-101 only metadata edit and actions
- Fix: Restore exact visible action wording/order

## G2-7-034-007  [P3] GAP  facet F03  effort S
- Legacy: templates/[templateId]/index.js:40-43 AntD Skeleton six rows
- vNext now: admin/projects/templates/[templateId]/page.tsx:50-156 actual content, no redirect state
- Fix: Add shape loading only if routed redirect not instantaneous
