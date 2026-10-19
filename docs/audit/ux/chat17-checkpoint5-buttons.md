# Chat-17 checkpoint 5 — legacy LMS buttons

## Owner target

Make vNext controls indistinguishable from a new module inside the old LMS. Reference: `docs/orchestrator/queues/master-queue.md` OWNER GOAL and `docs/design/legacy-styles/components___button.scss`, `components___form.scss`, `components___variables.scss`, `components___antddesign.scss`, and measured `old-lms-shell-spec.md`.

## Completed

- Started by fast-forwarding `chatgpt/chat-17-b` to `main` commit `3de148112368b7201378f721841a5d4348ec9f6d` (0 lane-only changes ahead then).
- Pushed 54 independent `[chat-17]` commits across 54 files prior to this ledger.
- Shared Button maintains primary `#0a7c88`, white foreground, hover `#086873`, 36px minimum, 9px radius, 14px / weight 650, legacy secondary border and semantic danger/ghost. Kept existing `sm`/`md` APIs; introduced `lg`, `icon`, and `icon-sm` sizes, preserving loading, disabled, ref, type, aria and click handlers.
- Updated shared Input, Select, Textarea, Checkbox and Radio in separate commits without changing props; retained native `select` closing tag and browser keyboard semantics.
- Replaced statically styled native button controls across TPO, HR-linked placement workflows, faculty/academics, college administration, learner placement, projects, tracker and teacher pages/components with shared Button. Converted form button types deliberately: explicit submit/reset/button retained, native implicit-submit controls changed to explicit `type="submit"` to preserve HTML default behavior.
- Preserved spacing/layout classes required by the surrounding page rather than duplicating presentation colors, borders, typography and focus states. Kept arbitrary/conditional dynamic button styling where an automatic replacement was not safe.
- Performed source-only JSX opening/closing tag checks, including Button, select and client-directive import position. No app runtime, typecheck, lint, unit tests or CI, by owner instruction.

## Integration warning

Concurrent work advanced `main` from the starting commit during this lane. A read-only comparison against `main` head `20147e9877b743d565214703a807023a9bc6e042` found 18 overlapping files, including the shared inputs/button and several TPO components. **Do not overwrite the other lanes' newer versions** with a forced or synthetic merge. Reconcile these overlaps during the orchestrator merge; the lane branch remains pushed and preserves its full series of commits.

## Remaining verification

Pixel-exact parity still requires screenshot/computed-style comparison in the browser, including hover/focus/disabled states, desktop/mobile 36px/44px targets and icon alignment. Dynamic native button class expressions and anchor-as-button affordances need a separate manual judgment pass before replacement.
