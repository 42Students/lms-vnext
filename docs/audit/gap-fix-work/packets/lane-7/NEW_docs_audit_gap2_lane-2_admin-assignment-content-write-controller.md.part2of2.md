# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md (part 2 of 2)

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-content-write-controller.md

## G2-2-006-057  [P1] GAP  facet F22  effort S
- Legacy: LM:17-70 lesson_contents row stores content_data JSON, classId, facultyId, active/enabled, deadline wall-clock, version
- vNext now: NB:26-74 separate course_assignments with deliveryId, description, status, methods JSON, timestamp with zone, updatedAt
- Fix: Write field-level migration mapping and preserve versions, audience, content resource payload.

## G2-2-006-058  [P1] GAP  facet F22  effort S
- Legacy: LS:152-164 1-30 typed resources nested JSON
- vNext now: NM:7-21 normalized links only max sequence 19; lacks PDF/FILE/INSTRUCTIONS
- Fix: Add appropriate normalized/material payload tables and constraints for all types.

## G2-2-006-059  [P1] GAP  facet F22  effort S
- Legacy: LM:68-70 optimistic @Version persistent
- vNext now: NB:70-74 updatedAt but no integer version; NS:311-312 conditional optional version check
- Fix: Require non-optional CAS token for admin edits, including post-submission title edits.

## G2-2-006-062  [P1] MISSING  facet F23  effort S
- Legacy: LF:143-181 rich resources and attachments supported by legacy
- vNext now: NP:100-163 not included, NM:7-21 link-only
- Fix: Restoration prerequisite before claiming exact admin assignment authoring parity.

## G2-2-006-021  [P2] GAP  facet F07  effort S
- Legacy: LC:47-50 exact forbidden 'Admin access required'
- vNext now: NS:239-246 centralized courses.manage guard
- Fix: Map rejected admin mutation to exact response copy and HTTP 403 as appropriate.

## G2-2-006-022  [P2] GAP  facet F07  effort S
- Legacy: LC:51-53 exact 'Assignment and lesson are required'
- vNext now: NV:34-60 Zod error shape, NR:56-57 generic API error
- Fix: Map missing lesson to legacy field-level/error banner wording.

## G2-2-006-023  [P2] GAP  facet F07  effort S
- Legacy: LC:54-57 'Lesson not found', 'Cannot resolve college scope'
- vNext now: NS:215-247 scoped loader/requirePermission errors
- Fix: Preserve distinct not-found versus unscoped forbidden states.

## G2-2-006-025  [P2] GAP  facet F07  effort S
- Legacy: LS:157-164 'Choose distinct valid submission methods'
- vNext now: NP:60-61 only empty methods validation
- Fix: Reject duplicates and invalid methods in both client and API with exact message.

## G2-2-006-026  [P2] GAP  facet F07  effort S
- Legacy: LS:284-301 exact title/points/deadline errors
- vNext now: NP:57-70 generic 1-10000/title and date messages
- Fix: Align precise validation messages per field.

## G2-2-006-028  [P2] GAP  facet F08  effort S
- Legacy: LC:59-60 returns Response OK 'Assignment saved'
- vNext now: NR:52-55 201 {assignment}, NP:86 success 'Assignment draft created. Publish it...'
- Fix: Preserve legacy success semantics or explicitly migrate to staged-publish UX.

## G2-2-006-029  [P2] GAP  facet F08  effort S
- Legacy: LF:234-246 toast 'Assignment created'/'Assignment updated', failure 'Failed to save assignment'
- vNext now: NP:80-88 generic error and inline success, no same toast
- Fix: Restore exact legacy toast variants if clone requirement includes operations feedback.
