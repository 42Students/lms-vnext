> **Current strategy — 2026-11-03:** These screenshots are a **feature/UI-surface discovery archive**, not a pixel-exact acceptance target. The owner approved the [Capability & UI-Surface Parity Standard](https://github.com/42Students/lms-vnext/blob/main/docs/planning/legacy-capability-parity-standard.md). Keep all original PNGs, package inventory and capture coverage intact. Old screenshots reveal controls, sections and states; the legacy FE/BE source and tested vNext workflows determine completeness. Historical pixel matching plans below are superseded.

# Old LMS vs vNext screenshots

**Execution plan:** [PIXEL_PARITY_MASTER_PLAN.md](PIXEL_PARITY_MASTER_PLAN.md) — detailed, triple-audited visual matching strategy and strict evidence-based acceptance gates.\n\n**First execution audit:** [INITIAL_BASELINE_AUDIT_2026-11-03.md](INITIAL_BASELINE_AUDIT_2026-11-03.md) — verified image/package counts, coverage gaps, first pilot findings, and draft implementation links. The owner requested that the plan itself be documented here; the screenshot images and original package reference files remain read-only.

Reference images for matching vNext to the old LMS. Captured 2026-11-03 at 1280x800. Do not merge this branch into `main`.

- `old/<role>/`: the old LMS, which is the source of truth for look and wording.
- `vnext/<role>/`: vNext as deployed at capture time (`7acef7ec`).
- `packages/QUEUE.md`: the work list. Each package holds up to 10 screens of one page, old and vNext together.
- `packages/<role>-unmatched.md`: screens with no automatic pair.
- `<side>/<role>/coverage.json`: routes reached and pages flagged during capture.

## Known limits

- Old and vNext used different test users, so names and counts may differ. That is not a gap.
- Saves were blocked during capture, so vNext popups may show a false success state, and screens that only appear after saving are missing.
- Flags such as `load-failed` mean the screen shows a loading error. Check it before copying what it shows.
- Only 2 examples of each detail page were captured.
- Course Coordinator exists only on the old LMS.
- Old LMS code, for exact values: `docs/legacy-source/frontend` on `main`.

## Prompt for a lane

Copy this into a lane, replacing `<package>` with the next unclaimed package id in `packages/QUEUE.md`:

> Repo `42Students/lms-vnext`. Read `README.md` on branch `parity-baseline`, then open `packages/<package>.md` on that branch and view every image it lists, and match the old and vNext screens by what they show. The old LMS image is the source of truth.
>
> For each matched screen, list every visible difference: missing or extra elements, wording, font, size, weight, colour, spacing, alignment, borders, radius, icons, order, and sidebar or top bar. Ignore different names, counts and dates caused by different test users.
>
> Mark each difference as SHARED (a shared component or style, likely on many pages) or PAGE (this page only). Give the exact old value where you can, using `docs/legacy-source/frontend` on `main`, and do not guess values.
>
> Then fix them on a new branch from `main`, in the vNext source. Reuse old LMS styles. Fix SHARED items in the shared component, never per page, and first check whether another open branch already fixed that item. Keep the exact old LMS wording. Do not change server behaviour, permissions, or database code, and never edit the screenshot, coverage or original package reference files on `parity-baseline`; this plan is the only owner-authorized documentation exception.
>
> Finish with: the package id, the differences found, what you fixed, what you could not fix and why, and the branch name.
