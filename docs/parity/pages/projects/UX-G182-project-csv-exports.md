# UX-G182 — Projects export readability and data boundary review

**Tracker:** `docs/tracker.json#uxReview` · **Status:** DOING until browser/CI evidence is recorded.  
**Scope:** Seven registered outbound serializers in `src/modules/projects`.

## Changes

| Registered export | Verified contract / improvement |
| --- | --- |
| Class team roster | Retains exact authorized roster and spreadsheet-formula escaping; adds UTF-8 signature for non-Latin team/roll labels |
| Learner project activity | Preserves existing `UTC time,Actor,Subject,Summary` header contract; truncates by Unicode code point to avoid broken surrogate pairs; keeps the authorized 100-row limit |
| Mentor project activity | Adds a defensive 200-row cap inside the serializer and counts both supplied omitted rows and accidental overflow; rejects invalid omission counts |
| Mentor calendar | Puts the export-truncated notice in a clearly identified first column |
| Mentor portfolio activity | Puts the export-truncated notice in the first column without exposing actor identities or URLs |
| Mentor reviews | Moves the export-capped label out of the assigned-project column |
| Mentor task-review history | Puts the truncated-export label in the first column; maintains the redacted reviewed-decision fields |

## Security and compatibility boundaries

- Data selection, tenant authorization, project assignment checks, route permissions, server filters, and CSV response cache-control are unchanged.
- Text is still passed through existing per-model spreadsheet-formula sanitization. No columns for actor email, review notes, project files, direct meeting links, or private metadata were added.
- Existing learner CSV header tests explicitly require the header without a UTF-8 signature; that compatibility contract is preserved.
- The existing truncation limits of other export models are unchanged.

## Test and acceptance plan

New unit suite: `tests/unit/ux-g182-project-export-ux.test.ts` (seven scenarios).
Existing regressions worth executing together:
```sh
npx vitest run tests/unit/ux-g182-project-export-ux.test.ts \
  tests/unit/project-class-team-csv-export.test.ts \
  tests/unit/learner-project-activity-csv-model.test.ts \
  tests/unit/mentor-project-activity-export.test.ts \
  tests/unit/mentor-calendar-export-model.test.ts \
  tests/unit/mentor-activity-portfolio-csv.test.ts \
  tests/unit/mentor-task-review-export.test.ts \
  tests/unit/PROJ-BREAK-chat6-export-integrity.test.ts \
  tests/unit/PROJ-BREAK-LEARNER-02.test.ts \
  tests/unit/PROJ-BREAK-SA-42-learner-activity-export-unicode.test.ts
npm run typecheck
npm run ux:groups -- --check
```

For DONE, require a successful exact-commit CI/test run, desktop and mobile browser download/encoding/empty/truncated cases on authorized screens, and scoped regression/security sign-off. A cancelled workflow is **not** a pass. Do not mark this group DONE from source review alone.
