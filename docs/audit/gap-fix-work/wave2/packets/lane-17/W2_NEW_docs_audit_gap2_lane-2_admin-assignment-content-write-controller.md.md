# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md

24 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md

## G2-2-006-001  [P2] GAP  facet F01  effort S
- Legacy: LC:24-27 dedicated POST /api/v1/admin/assignments/content/save
- vNext now: NR:34-55 POST /api/courses/assignments, generic create
- Fix: Document old endpoint retirement and update all admin builders and clients.

## G2-2-006-002  [P2] GAP  facet F01  effort S
- Legacy: LF:28-44 modal reached from admin assignment list; LA:4-5 API service
- vNext now: NP:91-100 inline create panel + NP:127 disclosure, not modal
- Fix: Restore modal-style creation or approve inline-panel redesign.

## G2-2-006-003  [P2] GAP  facet F02  effort S
- Legacy: LF:80-135 course/lesson/audience/details editor, LF:143-181 resources, LF:185-252 save
- vNext now: NP:100-163 Course/Lesson, Audience, Title, Points, disclosure Deadline/Instructions/Methods, confirm
- Fix: Reproduce legacy order and dedicated resource steps.

## G2-2-006-007  [P2] GAP  facet F04  effort S
- Legacy: LD:12-37 camel/snake fields lessonId,courseId,contentTitle,points,deadline,contentDataDTO
- vNext now: NV:34-60 lessonId,deliveryId,title,description,dueAt,allowedMethods,maxPoints,sequence
- Fix: Document field-by-field API mapping and adapt legacy resource JSON.

## G2-2-006-008  [P2] GAP  facet F04  effort S
- Legacy: LF:95-99 edit values from assignment, LF:103-125 loads full content data
- vNext now: NP:25-31 initial default create values, standalone edit via NS:186-205
- Fix: Use existing-resource detail loader in same admin edit UI, preserve scoped assignment identity.

## G2-2-006-009  [P2] GAP  facet F04  effort S
- Legacy: LM:55-58 deadline is India wall-clock LocalDateTime
- vNext now: NB:41-43 timestamptz dueAt, NP:67 parseCollegeIstLocal
- Fix: Preserve exact IST wall-clock interpretation when migrating legacy deadlines.

## G2-2-006-011  [P2] GAP  facet F06  effort S
- Legacy: LC:51-53 requires contentType ASSIGNMENT and lessonId
- vNext now: NR:34-50 inferred assignment route; NV:34-37 lessonId UUID
- Fix: Keep content-type invariance at route boundary and explicit lesson error.

## G2-2-006-012  [P2] GAP  facet F06  effort S
- Legacy: LF:129-133 defaults points 0, audience ALL, methods WRITTEN_RESPONSE
- vNext now: NP:25-31 points 10, first lesson, methods ALL, audience shared
- Fix: Restore exact initial defaults or document owner-approved redesign.

## G2-2-006-013  [P2] GAP  facet F06  effort S
- Legacy: LS:284-285 title required trimmed max 255
- vNext now: NP:116-118 input maxLength 200, NV:19-23 max 255
- Fix: Allow titles up to 255 in UI, match backend and legacy.

## G2-2-006-030  [P2] GAP  facet F09  effort S
- Legacy: LF:28-44 AdminAssignmentBuilderModal, LF:254-261 confirm when dirty
- vNext now: NP:100 inline form, NP:153-160 confirm create/discard
- Fix: Restore modal shell (course/lesson/section, resources, submit); preserve discard confirm.

## G2-2-006-032  [P2] GAP  facet F10  effort S
- Legacy: LC:44-60 POST save with @Valid DTO, writer.save returns LessonContents
- vNext now: NR:34-55 create only; PATCH elsewhere, returns {assignment}
- Fix: Map create/update to typed endpoints preserving expected response or formally version contract.

## G2-2-006-034  [P2] GAP  facet F10  effort S
- Legacy: LS:313-321 new row sets facultyId null for super-admin, active/enabled true
- vNext now: NB:60-64 createdByUserId required; NB:46-48 defaults DRAFT
- Fix: Map author identity and enabled/active flags to staged status model explicitly.

## G2-2-006-038  [P2] GAP  facet F12  effort S
- Legacy: LS:81-103 faculty teaching or admin/superadmin, class-college and active audience checks
- vNext now: NS:219-247 offering/delivery scope checks; class IDs replaced with delivery UUID
- Fix: Verify current class audience and teaching authorization on create/edit against legacy.

## G2-2-006-040  [P2] GAP  facet F12  effort S
- Legacy: LS:277-283 soft-disable when enabled=false without resource payload
- vNext now: NS:403-425 transition PUBLISH/ARCHIVE rather than enabled boolean
- Fix: Map legacy soft disable to ARCHIVE and prevent submission history loss.

## G2-2-006-041  [P2] GAP  facet F12  effort S
- Legacy: LS:175-183 one INSTRUCTIONS, server-sanitized HTML
- vNext now: NP:133-136 plain textarea in disclosure
- Fix: Carry rich-content sanitization and instruction resource rules.

## G2-2-006-042  [P2] GAP  facet F13  effort S
- Legacy: LF:30-35 lessons/classes/details loading + error states, LF:185-189 blocks uploads
- vNext now: NP:98-100 no-lessons state; :71-90 pending/error; no upload-loading
- Fix: Restore detailed class/options-loading failures and upload pending guard.

## G2-2-006-043  [P2] GAP  facet F13  effort S
- Legacy: LF:103-128 edit detail failure warns 'Assignment details could not be loaded. Refresh and retry.'
- vNext now: NP:100-163 creation only; update in standalone actions
- Fix: Provide scoped edit-detail loading/error and safe retry.

## G2-2-006-047  [P2] GAP  facet F16  effort S
- Legacy: LF:28 modal AntD responsive; resource upload/scroll content
- vNext now: NP:91-100 small-screen stack and sm:two-column fields, no modal
- Fix: Compare phone/tablet layouts and modal scroll/focus; restore upload touch controls.

## G2-2-006-048  [P2] GAP  facet F17  effort S
- Legacy: LF:28-29 AntD Modal+Form validation/error per field
- vNext now: NP:100 role region, labels, Alert and ConfirmDialog, no legacy modal keyboard context
- Fix: Validate focus trapping, Escape/return focus and error announcements for clone.

## G2-2-006-050  [P2] GAP  facet F18  effort S
- Legacy: LF:129-130 points 0 and audience ALL; NP:116-125 Title/Points, Audience shared
- vNext now: NP:25-31 points 10, methods all; :108 Audience label
- Fix: Restore wording/default values per legacy copy source.

## G2-2-006-051  [P2] GAP  facet F19  effort S
- Legacy: LS:208-321 transactional save, one lesson lookup and class scope checks
- vNext now: NS:249-269 single insert, NP:65-66 local sections list and filters
- Fix: Avoid high-volume option fetch and guarantee resources atomicity.

## G2-2-006-053  [P2] GAP  facet F20  effort S
- Legacy: LS:296-298 India clock determines future deadline
- vNext now: NP:67 IST parser; NS:259-261 JS Date instant, publish NS:413-418
- Fix: Test DST-free IST wall-clock, seconds truncation and future cutoff in all entry paths.

## G2-2-006-054  [P2] GAP  facet F20  effort S
- Legacy: LS:146-149 sanitizes original filename, LS:180-203 sanitizes HTML
- vNext now: NP:133-136 plain text; NM:19 URL constraints
- Fix: Add equivalent HTML/filename safety in full resources editor.

## G2-2-006-049  [P3] GAP  facet F18  effort S
- Legacy: LF:234-235 'Assignment created' toast
- vNext now: NP:86 'Assignment draft created. Publish it to let learners submit.'
- Fix: Match exact notification text or record deliberate draft UX.
