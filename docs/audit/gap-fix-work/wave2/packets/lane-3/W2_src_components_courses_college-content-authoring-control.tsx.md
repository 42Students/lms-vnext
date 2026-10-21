# Work packet (wave 2): edit src/components/courses/college-content-authoring-control.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-007  [P2] GAP  facet F02  effort M
- Legacy: Resource Editor is 700px Ant modal, maskClosable=false and destroyOnClose (`AdminResources.js:379-380`).
- vNext now: New inline editor div max-w-3xl, no overlay (`college-content-authoring-control.tsx:159-160`).
- Fix: Recreate centered modal layout, title, backdrop and focus trap.

## G2-18-007-008  [P2] GAP  facet F03  effort S
- Legacy: Old Video H1 `Videos`, help `Upload a video or link a YouTube video to a lesson.` (`LessonContent.js:111-114,1131-1147`).
- vNext now: New PageHeader `Video`, authoring H2 `Video Content` (`college/videos/page.tsx:34-35`; `college-content-authoring-control.tsx:153-156`).
- Fix: Restore plural title/help and create-card header.

## G2-18-007-012  [P2] GAP  facet F03  effort M
- Legacy: Legacy Video create card `Add a video`, Live `Schedule a live class` (`LessonContent.js:1144-1147`).
- vNext now: New button `Import from link` or `Schedule live class` with collapsed form (`college-content-authoring-control.tsx:53,153-159`).
- Fix: Use legacy card and Add Content CTA; make form visible initially.

## G2-18-007-013  [P2] GAP  facet F03  effort L
- Legacy: Old Video Existing Content columns Title, Type, Order, Students, Content, Action (`LessonContent.js:967-1078`).
- vNext now: New metadata catalogue Content, Course/cohort, Lesson/path, Scope, State; edit in separate details list (`college-content-aggregate.tsx:222-263`; `college-content-authoring-control.tsx:222-283`).
- Fix: Render exact old column headers/order and row actions together.

## G2-18-007-016  [P2] GAP  facet F04  effort S
- Legacy: Old Order column is row-position index+1 despite persisted sequence (`LessonContent.js:976-978`).
- vNext now: New list shows editable `sequence+1` with Save order (`college-content-authoring-control.tsx:264-269`).
- Fix: Match displayed row position and distinguish stored ordering for user.

## G2-18-007-021  [P2] GAP  facet F05  effort M
- Legacy: Old authoring separately chooses Course then Lesson with searchable options (`LessonContent.js:1170-1200`).
- vNext now: New Lesson Select folds course/courseCode/lesson into single option (`college-content-authoring-control.tsx:159-166`).
- Fix: Restore cascading searchable Course and Lesson selects.

## G2-18-007-022  [P2] GAP  facet F05  effort M
- Legacy: Old Resource Course/Lesson/Class selects independent, disabled until parent selected (`AdminResources.js:335-359`).
- vNext now: New editor shows Lesson+Section and global catalogue filters (`college-content-authoring-control.tsx:159-176`; `college-content-aggregate.tsx:39-49`).
- Fix: Restore cascading toolbar with widths 260,260,300px and disabled/loading states.

## G2-18-007-026  [P2] GAP  facet F05  effort M
- Legacy: Old Ant table has pageSize10, size changer, showTotal and horizontal scroll (`LessonContent.js:1691-1714`).
- vNext now: New catalogue pageSize25, details Existing Content has no pagination (`college-content-aggregate.tsx:269-274`; `college-content-authoring-control.tsx:222-283`).
- Fix: Use old page-size defaults/size selector and fetch pages server-side.

## G2-18-007-029  [P2] GAP  facet F06  effort S
- Legacy: Old video Content Title field required with `Enter a content title`, placeholder `e.g., Introduction Video` (`LessonContent.js:1275-1281`).
- vNext now: New label `Title`, maxLength200, no placeholder (`college-content-authoring-control.tsx:177-179`).
- Fix: Restore literal label, placeholder and validation copy; align maxlength with backend.

## G2-18-007-032  [P2] GAP  facet F06  effort M
- Legacy: Old Live dates separate Start Date/Time, End Date/Time; time minuteStep15 (`LessonContent.js:1469-1523`).
- vNext now: New two `datetime-local` controls (`college-content-authoring-control.tsx:205-210`).
- Fix: Use separate DatePicker and TimePicker with 15m increments.

## G2-18-007-033  [P2] GAP  facet F06  effort S
- Legacy: Old Live initial date tomorrow, start/end next 1h/2h rounded (`LessonContent.js:1157-1168`).
- vNext now: New blank date/time fields until entry (`college-content-authoring-control.tsx:30-33,59-61`).
- Fix: Prepopulate old default schedule without timezone drift.

## G2-18-007-034  [P2] GAP  facet F06  effort M
- Legacy: Old timezone selector has IST, UTC, New York, Los Angeles, London (`LessonContent.js:1525-1537`).
- vNext now: New only IST and UTC (`college-content-authoring-control.tsx:189-202`).
- Fix: Restore all five IANA timezone options and DST-aware conversion.

## G2-18-007-048  [P2] GAP  facet F09  effort S
- Legacy: Old Video delete Popconfirm `Are you sure to delete this content?`, Yes/No (`LessonContent.js:1057-1073`).
- vNext now: New native window.confirm `Delete this content from student access? The record will be archived.` (`college-content-authoring-control.tsx:132-147`).
- Fix: Match dialog styling and copy; explain archive vs delete if intentional.

## G2-18-007-049  [P2] GAP  facet F09  effort S
- Legacy: Old Resource delete `Delete this resource?` and `Students will no longer see it.` (`AdminResources.js:314-321`).
- vNext now: New generic archive window.confirm (`college-content-authoring-control.tsx:132-147`).
- Fix: Restore resource-specific destructive dialog.

## G2-18-007-051  [P2] GAP  facet F10  effort M
- Legacy: Old content CRUD through Axios AdminService and LessonContentController `/api/v1/lesson/contents` (`LessonContent.js:5-7`; `LessonContentController.java:49-55`).
- vNext now: New POST/PATCH `/api/courses/lesson-contents`, POST transition (`college-content-authoring-control.tsx:102-108,132-150`).
- Fix: Map legacy request/response/errors to new API; keep write restrictions.

## G2-18-007-063  [P2] GAP  facet F13  effort M
- Legacy: Old no selection shows course/lesson prompt and empty Ant table (`AdminResources.js:81-87,335-378`; `LessonContent.js:1691-1714`).
- vNext now: New default catalogue lists all, editor defaults to first lesson (`college-content-authoring-control.tsx:29-43`; `college-content-aggregate.tsx:180-190`).
- Fix: Match dependent selection state/empty copy before list.

## G2-18-007-070  [P2] GAP  facet F16  effort M
- Legacy: Old Resource selector widths260/260/300 and Space wrap (`AdminResources.js:335-362`).
- vNext now: New select form max-w-3xl grid, catalogue mobile separate cards (`college-content-authoring-control.tsx:159-175`; `college-content-aggregate.tsx:192-221`).
- Fix: Restore select widths/wrapping, ensure horizontal overflow at narrow widths.

## G2-18-007-071  [P2] MISSING  facet F17  effort M
- Legacy: Old video sortable keyboard grip explains Space/arrow move/Space drop (`LessonContent.js:69-85`).
- vNext now: New numeric order control, no grip (`college-content-authoring-control.tsx:264-269`).
- Fix: Add keyboard DnD sensor and SR reorder instructions.

## G2-18-007-072  [P2] GAP  facet F17  effort M
- Legacy: Old Ant Modal/Popconfirm have dialog semantics and focus handling (`AdminResources.js:317-321,379-380`).
- vNext now: New inline editor with native window.confirm (`college-content-authoring-control.tsx:102-103,132-147`).
- Fix: Use accessible dialog/confirm components, return focus to edit trigger.

## G2-18-007-073  [P2] MISSING  facet F17  effort S
- Legacy: Old file list Remove button has label `Remove {title}` (`AdminResources.js:395-401`).
- vNext now: New creation has no file list; existing control separate and gated (`college-content-authoring-control.tsx:270-281`).
- Fix: Per-material remove button should restore exact accessible label.

## G2-18-007-076  [P2] GAP  facet F19  effort M
- Legacy: Old Resource load sequence guard ensures latest scope wins, retains stale list on refresh (`AdminResources.js:137-169`).
- vNext now: New server aggregate and `router.refresh()` writes, but existing list is initial first250 (`college-content-authoring-control.tsx:48-52,109-113`; `college-content-authoring-service.ts:58-71`).
- Fix: Use paged scoped GET with stale-request abort and nonblocking refresh.

## G2-18-007-087  [P2] GAP  facet F23  effort M
- Legacy: Old Create Content starts from Course to Lesson picker (`LessonContent.js:1170-1200`).
- vNext now: New disabled create when no active learning-path lessons (`college-content-authoring-control.tsx:153-158`; `college-content-authoring-service.ts:22-33`).
- Fix: Provide direct navigation/setup to add required offering/path/lesson; explain new prerequisite.

## G2-18-007-074  [P3] GAP  facet F18  effort S
- Legacy: Old `Add Content`, `Add Resource`, `Edit Content: {title}` labels (`LessonContent.js:1560-1565,1720-1735`; `AdminResources.js:379-410`).
- vNext now: New generic `Save`, button `Import from link`, `Schedule live class` (`college-content-authoring-control.tsx:53,153-156,216-220`).
- Fix: Use literal legacy labels/primary CTA.

## G2-18-007-075  [P3] GAP  facet F18  effort S
- Legacy: Old resource delete `Students will no longer see it.` (`AdminResources.js:317-319`).
- vNext now: New delete confirms archive record instead (`college-content-authoring-control.tsx:132-147`).
- Fix: Restore user-facing impact wording while accurately disclosing archival.
