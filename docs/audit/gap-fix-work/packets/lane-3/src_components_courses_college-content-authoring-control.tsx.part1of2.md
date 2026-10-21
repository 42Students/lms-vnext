# Work packet: edit src/components/courses/college-content-authoring-control.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-023  [P1] GAP  facet F05  effort L
- Legacy: Old Existing Content filters Course, Lesson, Section; class change refetches (`LessonContent.js:1601-1664`).
- vNext now: New existing list first 250 records, client-filtered by Lesson, Section and free text, no Course (`college-content-authoring-service.ts:43-71`; `college-content-authoring-control.tsx:222-255`).
- Fix: Server-page/filter scoped list by Course/Lesson/Section; remove arbitrary 250 cap.

## G2-18-007-028  [P1] GAP  facet F06  effort L
- Legacy: Old Video create has separate Faculty selector and Audience (all/specific), Content Type and visible-to-students switch (`LessonContent.js:1170-1299,1545-1556`).
- vNext now: New has Lesson, Section, Title, URL, duration; no Faculty, content-type select or visible switch (`college-content-authoring-control.tsx:159-221`).
- Fix: Restore each authoring input and persist faculty/visibility state.

## G2-18-007-031  [P1] GAP  facet F06  effort L
- Legacy: Old video supports separate importVideoFromUrl and validateVideoUrl methods (`LessonContent.js:5,168-171`).
- vNext now: New `Import from link` means create YOUTUBE external URL (`college-content-authoring-control.tsx:53,87-91,103-108`).
- Fix: Distinguish video file-from-URL import vs linked YouTube authoring.

## G2-18-007-035  [P1] GAP  facet F06  effort M
- Legacy: Old visibility switch default true in Video and Resource create (`LessonContent.js:1553-1556`; `AdminResources.js:404-405`).
- vNext now: New editor no visibility checkbox, catalogue has visibility mutation (`college-content-authoring-control.tsx:159-221`; `college-content-aggregate.tsx:257-261`).
- Fix: Expose Visible to students in create/edit; persist atomically.

## G2-18-007-037  [P1] GAP  facet F07  effort S
- Legacy: Old Resource title max255 and exact error `Choose a course/lesson and enter a Resource title (1–255 characters).` (`AdminResources.js:255-259,383-384`).
- vNext now: New Title maxLength200 and generic `Choose a Lesson and enter a Title.` (`college-content-authoring-control.tsx:64-69,177-179`).
- Fix: Set correct 255 max & validation copy for RESOURCE.

## G2-18-007-039  [P1] MISSING  facet F07  effort M
- Legacy: Old resource max20 materials, 13 allowed extensions, 50MB/file (`AdminResources.js:18-19,210-219`).
- vNext now: New Resource new-editor has no file validation; existing materials gated (`college-content-authoring-control.tsx:223-225,270-281`).
- Fix: Enforce max20, ext/MIME and 50MB both UI and API for new resources.

## G2-18-007-046  [P1] GAP  facet F09  effort M
- Legacy: Old Resources `Add Resource`/`Edit Resource` modal and discard confirmation `Discard the changes to this resource?` (`AdminResources.js:179-208,379-380`).
- vNext now: New inline editor Cancel immediately `setOpen(false)` (`college-content-authoring-control.tsx:216-221`).
- Fix: Add dirty snapshot + confirm and modal focus handling.

## G2-18-007-047  [P1] GAP  facet F09  effort M
- Legacy: Old Video edit modal `Edit Content: {title}`, width600 and `Discard lesson-content edits?` (`LessonContent.js:748-761,1720-1730`).
- vNext now: New editor inline and cancel without dirty check (`college-content-authoring-control.tsx:159-160,216-221`).
- Fix: Restore modal heading and discard confirmation on close.

## G2-18-007-053  [P1] GAP  facet F10  effort L
- Legacy: Old class-specific reorder submits lessonId,classId,orderedContentIds (`LessonContent.js:940-965`).
- vNext now: New PATCH single content sequence (`college-content-authoring-control.tsx:116-130`).
- Fix: Use whole-section ordered-content endpoint with atomic validation.

## G2-18-007-064  [P1] GAP  facet F13  effort M
- Legacy: Old video dependency errors show Courses/Faculty/Lessons/Sections unavailable with Retry (`LessonContent.js:1148-1155`).
- vNext now: New server options error flows outside inline authoring; only No lessons message handled (`college/videos/page.tsx:32-37`; `college-content-authoring-control.tsx:153-158`).
- Fix: Add independent dependency error states/retry in authoring card.

## G2-18-007-078  [P1] GAP  facet F20  effort M
- Legacy: Old class change clears previous resource rows and invalidates request seq (`AdminResources.js:111-169`).
- vNext now: New list changes filters locally within initial `existing` and may show false empty after 250 (`college-content-authoring-control.tsx:43-52,235-255`).
- Fix: Request filtered results server-side, guard late responses.

## G2-18-007-079  [P1] GAP  facet F20  effort M
- Legacy: Old dirty Edit modal prompts on Cancel, preserving unsaved file replacement (`LessonContent.js:748-761`).
- vNext now: New Cancel simply hides form (`college-content-authoring-control.tsx:216-221`).
- Fix: Track dirty state and confirm discard; abort pending upload safely.

## G2-18-007-080  [P1] GAP  facet F20  effort L
- Legacy: Old timezone picker uses IANA zones including DST (`LessonContent.js:1525-1537`).
- vNext now: New conversion uses hard-coded +05:30 or +00:00 (`college-content-authoring-control.tsx:15-24,189-204`).
- Fix: Support full IANA timezone conversion with ambiguous DST boundary handling.

## G2-18-007-081  [P1] GAP  facet F21  effort L
- Legacy: Old integrations R2 presign, import-from-URL, YouTube, Zoom/Meet (`LessonContent.js:5,25,400-435,1453-1467`).
- vNext now: New HTTPS URL metadata and optional resource materials; no VIDEO upload/import (`college-content-authoring-control.tsx:63-115,270-281`).
- Fix: Wire storage/import/proxy integrations with strict authorization.

## G2-18-007-082  [P1] GAP  facet F21  effort L
- Legacy: Old Resource mixed FILE/LINK metadata (`AdminResources.js:26-45,225-238`).
- vNext now: New create Resource externalUrl+notes, materials only after resource exists (`college-content-authoring-control.tsx:103-108,270-281`).
- Fix: Support upload receipt attachment and separate material links in one create action.

## G2-18-007-085  [P1] GAP  facet F22  effort L
- Legacy: Old class-specific ordering managed separately from content sequence (`LessonContent.js:940-965`).
- vNext now: New content sequence global per lesson, no class reorder UI (`college-content-authoring-control.tsx:116-131,251-269`; `courses.ts:400`).
- Fix: Introduce section-specific ordered content mapping and concurrency token.

## G2-18-007-038  [P2] GAP  facet F07  effort M
- Legacy: Old resource requires file/link/notes; `Add a file, HTTPS link, or notes before saving.` (`AdminResources.js:260-262`).
- vNext now: New only notes/external URL, error `Add resource notes or an HTTPS link.` (`college-content-authoring-control.tsx:67-69`).
- Fix: Permit uploaded-file-only resources; match error copy.

## G2-18-007-040  [P2] GAP  facet F07  effort M
- Legacy: Old resource link validates https, prevents duplicate and over-20 (`AdminResources.js:246-252`).
- vNext now: New URL validates https, credentials, fragments, internal hosts and max2048, but only one link (`college-content-authoring-control.tsx:72-89`).
- Fix: Allow multiple uniquely titled links, retain stronger SSRF constraints.

## G2-18-007-042  [P2] GAP  facet F08  effort S
- Legacy: Old Video success `Lesson content updated successfully!`, delete `Lesson content deleted successfully!` (`LessonContent.js:900-922`).
- vNext now: New says `Content updated.`/`Content removed from student access.` (`college-content-authoring-control.tsx:111-113,147-150`).
- Fix: Restore context-specific success copy; disclose archive semantic changes.

## G2-18-007-044  [P2] GAP  facet F08  effort S
- Legacy: Old video failure toast `Failed to update content:` or `Failed to delete content:` (`LessonContent.js:905-922`).
- vNext now: New generic inline API error (`college-content-authoring-control.tsx:109-114,142-150`).
- Fix: Use failure action-specific wording and accessible Retry.
