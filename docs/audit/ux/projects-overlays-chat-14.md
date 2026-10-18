# Project overlays — UX coverage (chat-14)

This project-components ownership pass includes the following named surfaces. Tests are:
- `tests/unit/UX-projects-mentor-overlays-01.test.ts`: mentor sprint, task, release, meeting and resource draft protection, confirmation and pending semantics.
- `tests/unit/UX-projects-shared-overlays-02.test.ts`: admin, learner, college and shared project confirmation semantics.
- `tests/unit/UX-mentor-scroll-motion-01.test.ts`: native board detail dialog accessibility and scroll.
  
The shared `Dialog` and `ConfirmDialog` own focus trapping, `aria-labelledby`, Escape and backdrop behaviour and focus restoration. Each feature surface must supply a title and protect destructive/dirty operations before dismissal. The native mentor task dialog calls `showModal()`, closes via Escape/cancel and restores opener focus. Per-component test assertions verify that consumers preserve their part of the contract; shared-kit behaviour is covered by its own UI tests.

| Component file | Evidence |
|---|---|
| `src/components/projects/mentor-sprint-write.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-sprint-details-edit.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-release-editor.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-task-create.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-task-details-edit.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-task-status-transition.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-project-closeout-control.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-meeting-notes-editor.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/mentor-meeting-reschedule.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/project-meeting-controls.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/project-resource-controls.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/project-resource-files-panel.tsx` | `UX-projects-mentor-overlays-01` |
| `src/components/projects/college-project-mentor-dialog.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/college-project-student-roster-dialog.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/learner-board-task-detail-dialog.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-admin-submission-review.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-archive-control.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-create-control.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-delivery-reopen-control.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-final-delivery-controls.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-lifecycle-actions.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-mentor-reassignment.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-readiness-override-form.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-task-submission-control.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-team-controls.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/project-template-controls.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/super-admin-template-college-bulk.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/template-metadata-edit-control.tsx` | `UX-projects-shared-overlays-02` |
| `src/components/projects/mentor-board-task-detail-dialog.tsx` | `UX-mentor-scroll-motion-01` |

The remaining native or server-only components that do not construct an overlay are not counted as overlays. Legacy copy must remain unchanged. These are source tests, not a substitute for keyboard/browser regression in the orchestrator.
