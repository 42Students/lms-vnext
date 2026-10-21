# Work packet (wave 2): edit src/app/(authenticated)/college/videos/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy route sets active menu item `lesson-content` (`college-admin/lesson-content.js:18-20`).
- vNext now: New content pages show own PageHeader and navigation (`college/videos/page.tsx:33-35`; `college/resources/page.tsx:34-36`).
- Fix: Keep Courses & Content nav active and tab state matching requested type.

## G2-18-007-003  [P2] GAP  facet F01  effort S
- Legacy: Old no-college warning `Admin not assigned to a college`, contact administrator instruction (`college-admin/lesson-content.js:22-31`).
- vNext now: New returns CollegeCourseMissingScope for missing membership (`college/videos/page.tsx:18-19`; `college/resources/page.tsx:19-20`).
- Fix: Use same warning/copy under secure current college-membership gate.

## G2-18-007-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy uses AdminGroupShell > PageShell with content-tab strip in one module card (`AdminGroupShell.jsx:14-29`; `PageShell.jsx:50-89`).
- vNext now: New uses PageHeader with space-y-4/6, no local tab wrapper (`college/videos/page.tsx:33-44`; `college/resources/page.tsx:34-43`).
- Fix: Restore old grouped tab canvas, radius and padding, keep guarded access.

## G2-18-007-005  [P2] GAP  facet F02  effort M
- Legacy: Video/Live old two equal columns (`Col lg=12`) with create card and Existing Content card (`LessonContent.js:1144-1147,1571-1575`).
- vNext now: New vertical PageHeader, authoring section, aggregate (`college/videos/page.tsx:33-44`; `college/live-classes/page.tsx:26-40`).
- Fix: Restore side-by-side cards at lg and stacked mobile composition.

## G2-18-007-008  [P2] GAP  facet F03  effort S
- Legacy: Old Video H1 `Videos`, help `Upload a video or link a YouTube video to a lesson.` (`LessonContent.js:111-114,1131-1147`).
- vNext now: New PageHeader `Video`, authoring H2 `Video Content` (`college/videos/page.tsx:34-35`; `college-content-authoring-control.tsx:153-156`).
- Fix: Restore plural title/help and create-card header.

## G2-18-007-067  [P2] GAP  facet F14  effort M
- Legacy: Old `lesson-content.csv` includes id,title,type,sequence,points,deadline,duration,active,enabled (`LessonContent.js:1573-1592`).
- vNext now: New filtered video export metadata by different fields (`college/videos/page.tsx:38-43`; `college-content-aggregate.tsx:171-175`).
- Fix: Offer exact legacy schema/filename from Existing Content.

## G2-18-007-069  [P2] GAP  facet F16  effort M
- Legacy: Old Video two columns switch to stacked at lg responsive (`LessonContent.js:1144-1147,1571-1575`).
- vNext now: New authoring vertically stacked with aggregate at all widths (`college/videos/page.tsx:33-44`).
- Fix: Match legacy grid breakpoints and card gutters.
