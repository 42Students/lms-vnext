# Work packet (wave 2): edit src/components/projects/super-admin-template-subview-page.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md, docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md, docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-6/l11-u029-superadmin-template-sprints.md, docs/audit/gap2/lane-8/super-admin-project-template-versions.md

## G2-12-029-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:90-96 — /superadmin/projects/templates/:id/resources in SuperAdminTemplateShell.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:172-207 — /admin/projects/templates/:id/resources with separate breadcrumbs/tabs.
- Fix: Match source entry and section nav semantics.

## G2-12-029-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/SuperAdminTemplateShell.jsx:30-55 — Back to templates and Use this template header actions.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:179-195 — Back link, Use this template only when published and differently named.
- Fix: Align header actions by template status.

## G2-12-029-037  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:34-67,101-124 — first request Skeleton 8 paragraphs, Template not found warning.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:82-132 — async server loader, notFound for missing ID.
- Fix: Replicate loading and absent-template states.

## G2-12-029-038  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:97-99 — error Alert within shell above Card.
- vNext now: src/components/projects/super-admin-template-resource-editor.tsx:96-97 and src/components/projects/super-admin-template-subview-page.tsx:125-132 — error Banner under editor and full ErrorState on fetch failure.
- Fix: Match in-shell alert placement.

## G2-10-029-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:96-102 — /superadmin/projects/templates/:id/tasks inside SuperAdminTemplateShell.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:172-207 — /admin/projects/templates/:id/tasks with back link and tabs.
- Fix: Retain exact title, subtitle and tab-navigation hierarchy.

## G2-10-029-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/SuperAdminTemplateShell.jsx:30-55 — source Back to templates and Use this template primary always visible when templateId exists.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:179-195 — Back link, Use this template only for PUBLISHED and different wording.
- Fix: Restore legacy navigation/button wording, but retain safety restrictions on unpublished templates.

## G2-10-029-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:103-144 — Alert then Skeleton then Card, no intermediate read-only records.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:198-232,315-410 — badges, tabs, collapsed editor, read-only task records and info line.
- Fix: Make task-editor hierarchy match source; retain version metadata secondarily.

## G2-10-029-016  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:109-118 — zero rows No tasks yet; list title derived from title.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:315-338 — No tasks configured read-only empty state; editor says No tasks yet at src/components/projects/super-admin-template-plan-editor.tsx:275.
- Fix: Match source empty state and editor emphasis.

## G2-10-029-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:98-103 — only >12 tasks show case-insensitive item search.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:340-350 — read-only tasks sorted sprintKey then sequence, no editor search.
- Fix: Bring item search/pagination affordance to edit list.

## G2-10-029-037  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:229-235 — updates require Super Admin.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:209-218 — editor only for project-template.manage and non-ARCHIVED; read permission service in src/modules/projects/template-subview-service.ts:28-42.
- Fix: Document read vs edit gate and archived disabled behavior.

## G2-10-029-041  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:43-73,107-109 — Skeleton 8 rows during template fetch; mounted guard.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:82-132,172-232 — server fetch and unavailable ErrorState; loading route exists src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/loading.tsx:1-7.
- Fix: Align first-load skeleton height and retry behavior.

## G2-10-029-042  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/tasks.js:145-147 — Template not found warning Alert after load.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:114-119 — notFound() route 404.
- Fix: Use source warning semantics unless 404 intentional.

## G2-5-017-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy title/subtitle then Template versions Card containing vertical revision cards `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:164-185`
- vNext now: New PageHeader/tab strip then Version history list with bottom borders `src/components/projects/super-admin-template-subview-page.tsx:138-170,558-578`
- Fix: Match shell-level spacing/headings/card treatment, preserve new content semantics.

## G2-5-017-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy display header current version Tag and grouped per-version cards `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:166-168,187-205`
- vNext now: New top status badges and a list of bordered articles `src/components/projects/super-admin-template-subview-page.tsx:160-173,578-620`
- Fix: Compare badge placement/size and card styling at 1280/768/375.

## G2-5-017-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy row shows Version n, Current chip, action type chip, notes, changedAt `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:187-213`
- vNext now: New row shows Version n, createdAt, labels and changeNote/summary `src/components/projects/super-admin-template-subview-page.tsx:578-643`
- Fix: Preserve action type, changedAt and optional legacy notes with labels.

## G2-5-017-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy actions Compare changes and gated Roll back on each non-current row `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:205-231`
- vNext now: New row links Compare changes and inspect snapshot; rollback control on compare page `src/components/projects/super-admin-template-subview-page.tsx:630-643`
- Fix: Match click path or document deliberate safer two-step rollback.

## G2-5-017-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy changedAt LocalDateTime `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:25-26`
- vNext now: New createdAt timestamptz formatted only date IST in list `src/components/projects/super-admin-template-subview-page.tsx:30-38,603-610`
- Fix: Include time-of-day and correct timezone conversion where legacy history showed full timestamp.

## G2-5-017-032  [P2] GAP  facet F13  effort S
- Legacy: Legacy distinct errors, skeleton and 'No version history available' empty state `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:170-186,231-232`
- vNext now: New invalid-page retry and 'No version history' state `src/components/projects/super-admin-template-subview-page.tsx:97-135,558-563`
- Fix: Match empty/error copy and skeleton when practical.

## G2-5-017-036  [P2] GAP  facet F16  effort M
- Legacy: Legacy version cards stack, AntD Pagination `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:187-231`
- vNext now: New version list responsive breakpoints at 768/992 and Pagination `src/components/projects/super-admin-template-subview-page.tsx:565-671`
- Fix: Visually compare phone/tablet row spacing and action touch target.

## G2-5-017-038  [P2] GAP  facet F18  effort S
- Legacy: Legacy labels 'Template versions', 'Version N', 'Current', 'Compare changes', 'Roll back' `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:166-232`
- vNext now: New labels 'Version history', 'Compare changes and inspect snapshot →', 'Current version N' `src/components/projects/super-admin-template-subview-page.tsx:570-632`
- Fix: Compare exact old wording for page shell, keep deliberate new content where agreed.

## G2-11-029-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/projects/templates/[templateId]/sprints with SuperAdminLayout and scope-selected college (sprints.js:26-30,127-170).
- vNext now: New /admin/projects/templates/[templateId]/sprints passes section to shared subview (sprints/page.tsx:3-15; super-admin-template-subview-page.tsx:73-81).
- Fix: Retain old deep-link redirects, selected-college scope and navigation active state.

## G2-8-029-002  [P2] GAP  facet F01  effort M
- Legacy: Old compare changes opens modal in same version list, no route navigation docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:203-214,238-257.
- vNext now: New Compare link opens /versions/{versionId} dedicated page src/components/projects/super-admin-template-subview-page.tsx:629-633; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:15-18.
- Fix: Preserve return scroll/page and compare context after navigation.

## G2-8-029-004  [P2] GAP  facet F02  effort M
- Legacy: Old main Card titled Template versions contains Cards for each version with action row docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:177-227.
- vNext now: New continuous section Version history, version rows separated by borders src/components/projects/super-admin-template-subview-page.tsx:558-598.
- Fix: Clone old card/list density, controls placement and section title.

## G2-8-029-006  [P2] GAP  facet F03  effort M
- Legacy: Old current version Tag Current and disabled Roll back tooltip on top row docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:183-225.
- vNext now: New labels from templateVersionLabels and comparison always linked, rollback disabled on current src/components/projects/super-admin-template-subview-page.tsx:578-633; src/components/projects/super-admin-template-rollback-control.tsx:16-17,40-42.
- Fix: Add current-row explicit disabled rollback affordance and tooltip copy.

## G2-8-029-007  [P2] GAP  facet F03  effort M
- Legacy: Old action badges include version actionType statusLabel and notes docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:193-203.
- vNext now: New list shows version.title, changeNote, count fields, badges current/published src/components/projects/super-admin-template-subview-page.tsx:578-666.
- Fix: Display legacy action type separately from change notes.

## G2-8-029-008  [P2] GAP  facet F03  effort M
- Legacy: Old Compare changes and Roll back adjacent buttons in each old version row docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:203-224.
- vNext now: New Compare changes and inspect snapshot link on row, rollback only on comparison page src/components/projects/super-admin-template-subview-page.tsx:629-633; src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx:57-60.
- Fix: Make rollback discoverable without requiring deep link detour, while retaining review gate.

## G2-8-029-011  [P2] GAP  facet F04  effort M
- Legacy: Old version notes fallback textOrDash in card docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:201-202.
- vNext now: New changeNote fallback No change note recorded. src/components/projects/super-admin-template-subview-page.tsx:641-644.
- Fix: Match empty notes placeholder and distinguish note vs summary fields.

## G2-8-029-012  [P2] GAP  facet F04  effort M
- Legacy: Old changedAt formatted with formatTimestamp based on admin utility docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:18-25,201-202.
- vNext now: New createdAt formatted medium date Asia/Kolkata + IST no time src/components/projects/super-admin-template-subview-page.tsx:33-37,602-610.
- Fix: Include full date+time IST for version revisions, verify precision.

## G2-8-029-035  [P2] GAP  facet F13  effort M
- Legacy: Old Skeleton 8 paragraphs on initial load; template error and version error distinct docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:169-180.
- vNext now: New server-driven read has ErrorState and no explicit Suspense skeleton in page src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx:3-19; src/components/projects/super-admin-template-subview-page.tsx:103-132.
- Fix: Match spinner/skeleton while navigating history and comparison.

## G2-8-029-036  [P2] GAP  facet F13  effort M
- Legacy: Old no history Empty No version history available docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:230-234.
- vNext now: New NoItems title No version history, description No version records are available... src/components/projects/super-admin-template-subview-page.tsx:558-563.
- Fix: Match legacy empty state message and recovery action.

## G2-8-029-042  [P2] GAP  facet F18  effort M
- Legacy: Old header subtitle Browse the complete version history, compare a revision against the current template, then roll back if needed. docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:163-168.
- vNext now: New generic Template version history section with separate intro and count src/components/projects/super-admin-template-subview-page.tsx:558-576.
- Fix: Restore literal subtitle and Version N badge.

## G2-8-029-043  [P2] GAP  facet F18  effort M
- Legacy: Old action Compare changes, Roll back, Current, Template versions docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:177-225.
- vNext now: New Compare changes and inspect snapshot →, Restore this snapshot, Version history src/components/projects/super-admin-template-subview-page.tsx:558-633; src/components/projects/super-admin-template-rollback-control.tsx:32-39.
- Fix: Use familiar action names, new explanation subordinate.

## G2-8-029-049  [P2] GAP  facet F22  effort M
- Legacy: Old version revisions carry actionType changedAt and notes for audit history docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:193-203.
- vNext now: New version rows carry createdAt,summary,changeNote,version but not legacy actionType exposed src/components/projects/super-admin-template-subview-page.tsx:598-644.
- Fix: Migrate notes/action type/time and label faithfully.

## G2-12-029-008  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:123-125 — warning Template not found while keeping template shell.
- vNext now: src/components/projects/super-admin-template-subview-page.tsx:114-119 — Next notFound() 404.
- Fix: Preserve template-missing alert where user can recover.

## G2-5-017-010  [P3] GAP  facet F04  effort S
- Legacy: Legacy notes is arbitrary TEXT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:28-29`
- vNext now: New changeNote text; fallback 'No change note recorded.' `src/components/projects/super-admin-template-subview-page.tsx:641-644`
- Fix: Map notes→changeNote, retain exact fallback if parity required.

## G2-5-017-039  [P3] GAP  facet F18  effort S
- Legacy: Legacy default notes placeholder via textOrDash, timestamp formatTimestamp `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:194-203`
- vNext now: New changeNote fallback and formatDate IST date only `src/components/projects/super-admin-template-subview-page.tsx:603-610,641-644`
- Fix: Match empty-value and timestamp display if visual clone target requires.
