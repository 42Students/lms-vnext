# Work packet: edit src/modules/people/faculty-profile-error-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md

## G2-1-003-033  [P2] GAP  facet F07  effort S
- Legacy: `FacultyProfileController.java:174-187` exact messages: 'Profile was updated elsewhere. Please refresh and try again.', 'Request body is missing or malformed'.
- vNext now: `faculty-profile-error-model.ts:5-20` says 'Your profile changed since you opened it. Reload...' and generic save errors.
- Fix: Align error copy and ensure precise cause/next action for stale edits.

## G2-1-003-038  [P2] GAP  facet F08  effort S
- Legacy: `FacultyProfileController.java:196-212,225-240,311-354` responds `Success`, `Updated successfully`, `Added successfully`, `Deleted successfully` in wrapped Response.
- vNext now: `faculty-profile-error-model.ts:47-50` returns '<Section> saved (revision N).' for all section PATCHs.
- Fix: Match action-specific success messages (add/update/remove) and show revision only as secondary metadata.
