# Work packet: edit src/components/academics/college-term-mapping-manager.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-16/u007-college-semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-12-002-020  [P1] GAP  facet F05  effort S
- Legacy: Available courses from all college courses minus mapped `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:283-284`
- vNext now: Courses filtered to same department as term `src/components/academics/college-term-mapping-manager.tsx:69-74`
- Fix: Confirm cross-department electives and scope; allow legacy valid courses

## G2-12-002-024  [P1] GAP  facet F06  effort S
- Legacy: Add disabled on mapping error/table loading/reordering `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:363-375`
- vNext now: Add disabled only pending/no term/no selected IDs `src/components/academics/college-term-mapping-manager.tsx:153-170`
- Fix: Prevent add while mapping stale/unavailable

## G2-12-002-029  [P1] GAP  facet F07  effort S
- Legacy: Maps server field errors semester_id, course_ids, program_id `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:201-208`
- vNext now: Maps error codes to generic notice, not field-specific errors `src/components/academics/college-term-mapping-manager.tsx:59-65`
- Fix: Restore field error mapping

## G2-12-002-037  [P1] MISSING  facet F09  effort S
- Legacy: Dirty edit cancel prompts `Discard mapping changes?` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:243-252`
- vNext now: Cancel clears edit immediately `src/components/academics/college-term-mapping-manager.tsx:223-227`
- Fix: Confirm discarding edits

## G2-12-002-050  [P1] GAP  facet F12  effort S
- Legacy: Can select historical semesters by program (not active-only) `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:83-97,355-361`
- vNext now: Only active term choices `src/components/academics/college-term-mapping-manager.tsx:69`
- Fix: Allow browsing archived terms read-only

## G2-12-002-054  [P1] GAP  facet F13  effort S
- Legacy: Same-term refresh preserves stale rows with warning/retry `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:99-138,385-390`
- vNext now: Router.refresh no retained last-loaded snapshot `src/components/academics/college-term-mapping-manager.tsx:23-35`
- Fix: Preserve last successful data on refresh error

## G2-12-002-079  [P1] GAP  facet F23  effort S
- Legacy: Legacy hidden Boolean mandatory field `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:421-423`
- vNext now: VNext bulk additions hardcode CORE `src/components/academics/college-term-mapping-manager.tsx:77-87`
- Fix: Do not silently lose elective designation

## G2-16-007-018  [P1] GAP  facet F05  effort M
- Legacy: `SemesterCourseMapping.js:283-285`: available courses all college courses excluding mapped IDs.
- vNext now: `college-term-mapping-manager.tsx:73-74`: only same-department courses not mapped.
- Fix: Validate legacy cross-department mapping policy and permit valid college-wide courses where allowed.

## G2-16-007-022  [P1] GAP  facet F06  effort M
- Legacy: `SemesterCourseMapping.js:141-155`: college context change resets all lookup/mapping state and aborts prior async results.
- vNext now: `college/semester-courses/page.tsx:9-11`; `college-term-mapping-manager.tsx:23-34`: manager initializes state once and receives server data; no key on collegeId.
- Fix: Key manager by collegeId and reset state on college change to prevent stale cross-college draft/selection.

## G2-16-007-037  [P1] GAP  facet F09  effort S
- Legacy: `SemesterCourseMapping.js:243-252`: dirty edit Cancel opens `Discard mapping changes?` dialog.
- vNext now: `college-term-mapping-manager.tsx:226-227`: Cancel clears editing immediately.
- Fix: Prevent accidental edit loss with dirty-state discard confirmation.

## G2-16-007-042  [P1] GAP  facet F10  effort M
- Legacy: `SemesterService.js:28-29`: bulk add raw `course_ids`, no credits/type forced by client.
- vNext now: `college-term-mapping-manager.tsx:77-87`: emits mappings each `type:CORE`, `credits:3`.
- Fix: Match legacy server default choice and preserve actual is_mandatory/type semantics before setting CORE unconditionally.

## G2-16-007-046  [P1] GAP  facet F12  effort L
- Legacy: `SemesterCourseMapping.js:218-229`: edit credits (default 3), hidden isMandatory switch, courseOrder.
- vNext now: `college-term-mapping-manager.tsx:205-221`; `college-term-mapping-model.ts:9-12`: credits and position only; isMandatory omitted.
- Fix: Determine required legacy isMandatory storage parity; if preserved, migrate/read-write field even if hidden.

## G2-16-007-071  [P1] GAP  facet F20  effort M
- Legacy: `SemesterCourseMapping.js:57-60,77,90,115,130`: lookup/mapping sequence refs ignore responses from old scope.
- vNext now: `college-term-mapping-manager.tsx:23-34,36-67`: inFlight serializes writes but state keys persist across parent prop updates.
- Fix: Key manager per college scope and term, reset per-scope draft/edit to avoid stale state.

## G2-17-002-019  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:283-284 filters already-mapped courses only from college-wide choices.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:73-75 also restricts choices to exactly selected term's department.
- Fix: Confirm cross-department mapping policy; restore permissible college-wide courses if backend allows.

## G2-17-002-025  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:157-188 program/semester switches confirm if unsaved course choices exist; draft restoration per semester.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:133-146 stores draft but switches without confirmation, only emits inline notice.
- Fix: Confirm scope switch when unsaved selections exist; restore old current value until confirmed.

## G2-17-002-026  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:372-375 Add button disabled if no semester, mappingError, tableLoading, reordering or courses lookup error.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:166-169 disabled only pending, !termId or !selectedIds.length; no granular mapping-error state.
- Fix: Block add while mapped data unavailable or stale; represent lookup failures and pending reorder explicitly.

## G2-17-002-029  [P1] MISSING  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:421 hidden isMandatory Switch preserved on edit payload at :228-229.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:204-230 exposes credits/position only, src/modules/academics/college-term-mapping-model.ts:9-12 rejects isMandatory entirely.
- Fix: Decide and document mandatory-to-type migration; provide equivalent edit action if parity required.

## G2-17-002-030  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-426 Modal Save Changes/Cancel cannot mask-dismiss and disables closing while editLoading.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:204-229 inline form Save/Cancel, Cancel immediate unguarded.
- Fix: Use modal with exact actions and busy/dirty-close protections.

## G2-17-002-033  [P1] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:201-208 maps semester_id, course_ids, program_id server validation to Form controls and addError banner.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:59-62 maps FriendlyFetchError code to single string in generic inline error.
- Fix: Restore per-field API validation and operation-specific add error banner.

## G2-17-002-040  [P1] MISSING  facet F09  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:173-176 Modal.confirm 'Switch programs with unsaved course choices?' with selected count and 'Switch program'.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:133-136 switches program directly with notice only.
- Fix: Restore guarded unsaved-choice program confirmation with precise title/body/button.
