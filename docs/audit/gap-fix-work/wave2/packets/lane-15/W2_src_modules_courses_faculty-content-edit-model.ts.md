# Work packet (wave 2): edit src/modules/courses/faculty-content-edit-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/youtube.md

## G2-12-008-004  [P2] GAP  facet F02  effort S
- Legacy: Edit YoutubeDrawer mounted inside component `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:158-166`
- vNext now: Faculty edits via shared typed content patch path `src/modules/courses/faculty-content-edit-model.ts:2-13`
- Fix: Restore familiar drawer placement and affordance

## G2-12-008-006  [P2] MISSING  facet F03  effort S
- Legacy: Faculty EditOutlined and DeleteOutlined icon-only actions `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:173-195`
- vNext now: Shared faculty authoring model, player has no edit/delete buttons `src/modules/courses/faculty-content-edit-model.ts:71-97`
- Fix: Expose role-appropriate action icons in content chrome

## G2-12-008-015  [P2] GAP  facet F06  effort S
- Legacy: No learner form, faculty edit via YoutubeDrawer `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:50-57`
- vNext now: Faculty shared edit form model title/notes/url/duration `src/modules/courses/faculty-content-edit-model.ts:3-13,71-97`
- Fix: Audit edit form field labels and drawer defaults

## G2-12-008-016  [P2] GAP  facet F06  effort S
- Legacy: Delete Popconfirm Yes/No `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:180-194`
- vNext now: Shared faculty workflow, no delete control in learner player `src/modules/courses/faculty-content-edit-model.ts:71-97`
- Fix: Render same faculty confirmation chrome outside player

## G2-12-008-025  [P2] GAP  facet F09  effort S
- Legacy: YoutubeDrawer edit opens on icon and refreshAllContent on close `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:158-167`
- vNext now: Shared content editing draft/discard guard, no inline drawer here `src/modules/courses/faculty-content-edit-model.ts:65-76`
- Fix: Recreate edit drawer and on-close refresh

## G2-12-008-026  [P2] GAP  facet F09  effort S
- Legacy: Delete Popconfirm exact `Delete the YouTube video`, description, Yes/No `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:177-195`
- vNext now: Mutation model has no visible popconfirm titles `src/modules/courses/faculty-content-edit-model.ts:71-97`
- Fix: Add exact popconfirm to faculty surface

## G2-12-008-030  [P2] GAP  facet F10  effort S
- Legacy: Delete calls deleteLessonContent(YOUTUBE,content,user.id) and refresh `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:181-189`
- vNext now: Faculty patch/delete implemented separate from player `src/modules/courses/faculty-content-edit-model.ts:80-91`
- Fix: Check precise delete side effects and refetch authoring list

## G2-12-008-049  [P2] GAP  facet F18  effort S
- Legacy: Delete confirm Yes / No `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/youtube.js:178-194`
- vNext now: Shared editor no literal delete confirm `src/modules/courses/faculty-content-edit-model.ts:71-97`
- Fix: Match action labels
