# Teacher / teach UX rollout — source handoff

Branch: `chatgpt/chat-3-b`, signed-off `docs/design-system/UX-PLAYBOOK.md`.

## Source coverage

- `/teacher`: 36 of 36 route files audited and recorded in `docs/audit/ux/teacher-*.md`.
- `/teach`: 2 of 2 route files audited and recorded in `docs/audit/ux/teach-*.md`.
- 33 rendered page sources changed; five compatibility/dispatcher routes intentionally retained with source tests only.
- Four role-shared faculty components updated (course cards/filters, contact directory, report student table, assessment overview).
- 38 route-named source cases in `tests/unit/UX-teacher-pages-round1.test.ts` through `round4.test.ts`, and four in `tests/unit/UX-teacher-shared-surfaces.test.ts`.
- Focus and link colour use deep-teal on white, 44px page controls, min-width handling. `/teach/courses` uses batched card summaries instead of N+1 per-course full reads.
- No legacy action text or authorization gates deliberately changed; no global shared UI primitives forked.

## Acceptance not yet certified

The source was committed but local tests/typecheck/lint and browser 320/360/390, safe-area, keyboard/focus, VoiceOver/TalkBack and WebView checks **were not executed** in chat-3. GitHub Actions has not reported a run for this branch. Page checkboxes remain unchecked until the orchestrator records passing test/runtime acceptance; do not score PE3 or claim a playbook PASS from source tests alone.
