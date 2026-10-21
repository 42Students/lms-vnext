# Work packet (wave 2): edit src/components/courses/college-content-aggregate.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-013  [P2] GAP  facet F03  effort L
- Legacy: Old Video Existing Content columns Title, Type, Order, Students, Content, Action (`LessonContent.js:967-1078`).
- vNext now: New metadata catalogue Content, Course/cohort, Lesson/path, Scope, State; edit in separate details list (`college-content-aggregate.tsx:222-263`; `college-content-authoring-control.tsx:222-283`).
- Fix: Render exact old column headers/order and row actions together.

## G2-18-007-014  [P2] GAP  facet F03  effort M
- Legacy: Old Resource table Title, Visibility, Students, Materials, Action (`AdminResources.js:307-322`).
- vNext now: New Resource table Content, Course/cohort, Lesson/path, Materials, Scope, State (`college-content-aggregate.tsx:222-263`).
- Fix: Restore five legacy columns and inline row actions; keep supplementary metadata as expansion.

## G2-18-007-017  [P2] GAP  facet F04  effort S
- Legacy: Old Students column uses green Visible or neutral Hidden tags (`LessonContent.js:978-979`; `AdminResources.js:311-312`).
- vNext now: New displays `Visible to students`/`Hidden from students` beside enum state (`college-content-aggregate.tsx:254-261`).
- Fix: Restore Visible/Hidden tag badges, variants, placement.

## G2-18-007-020  [P2] GAP  facet F04  effort M
- Legacy: Old Resource Materials counts nested resourceMaterials length (`AdminResources.js:26-45,313`).
- vNext now: New counts material table when runtime ready; else Unavailable, warns legacy links stored separately (`college-content-aggregate.tsx:171-179,251-253`).
- Fix: Count normalized files and legacy URL accurately; display fallback pending migration.

## G2-18-007-022  [P2] GAP  facet F05  effort M
- Legacy: Old Resource Course/Lesson/Class selects independent, disabled until parent selected (`AdminResources.js:335-359`).
- vNext now: New editor shows Lesson+Section and global catalogue filters (`college-content-authoring-control.tsx:159-176`; `college-content-aggregate.tsx:39-49`).
- Fix: Restore cascading toolbar with widths 260,260,300px and disabled/loading states.

## G2-18-007-026  [P2] GAP  facet F05  effort M
- Legacy: Old Ant table has pageSize10, size changer, showTotal and horizontal scroll (`LessonContent.js:1691-1714`).
- vNext now: New catalogue pageSize25, details Existing Content has no pagination (`college-content-aggregate.tsx:269-274`; `college-content-authoring-control.tsx:222-283`).
- Fix: Use old page-size defaults/size selector and fetch pages server-side.

## G2-18-007-061  [P2] GAP  facet F13  effort M
- Legacy: Old Resources 6×5 skeleton and `Refreshing resources…` partial spinner (`AdminResources.js:363-378`).
- vNext now: New SSR aggregate no equivalent inline Resource skeleton (`college/resources/page.tsx:33-42`; `college-content-aggregate.tsx:180-192`).
- Fix: Restore table-skeleton and refresh-in-progress visual states.

## G2-18-007-063  [P2] GAP  facet F13  effort M
- Legacy: Old no selection shows course/lesson prompt and empty Ant table (`AdminResources.js:81-87,335-378`; `LessonContent.js:1691-1714`).
- vNext now: New default catalogue lists all, editor defaults to first lesson (`college-content-authoring-control.tsx:29-43`; `college-content-aggregate.tsx:180-190`).
- Fix: Match dependent selection state/empty copy before list.

## G2-18-007-067  [P2] GAP  facet F14  effort M
- Legacy: Old `lesson-content.csv` includes id,title,type,sequence,points,deadline,duration,active,enabled (`LessonContent.js:1573-1592`).
- vNext now: New filtered video export metadata by different fields (`college/videos/page.tsx:38-43`; `college-content-aggregate.tsx:171-175`).
- Fix: Offer exact legacy schema/filename from Existing Content.

## G2-18-007-070  [P2] GAP  facet F16  effort M
- Legacy: Old Resource selector widths260/260/300 and Space wrap (`AdminResources.js:335-362`).
- vNext now: New select form max-w-3xl grid, catalogue mobile separate cards (`college-content-authoring-control.tsx:159-175`; `college-content-aggregate.tsx:192-221`).
- Fix: Restore select widths/wrapping, ensure horizontal overflow at narrow widths.

## G2-18-007-015  [P3] GAP  facet F04  effort S
- Legacy: Old table Type formats enums into Video, YouTube, Live class, Resource and Assignment (`LessonContent.js:973-975`).
- vNext now: New catalogue renders `item.contentType` uppercase (`college-content-aggregate.tsx:194-202,235-237`).
- Fix: Humanize enum values to exact old display labels.

## G2-18-007-027  [P3] GAP  facet F05  effort S
- Legacy: Old Resources table pageSize15 (`AdminResources.js:374-378`).
- vNext now: New 25/page (`college-content-aggregate.tsx:269-274`).
- Fix: Implement 15/page specifically for resources.
