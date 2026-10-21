# Work packet: edit src/app/(authenticated)/tpo/batches/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u029-tpo-batches-index.md

## G2-13-029-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:121-129`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:61-62`
- Fix: Legacy Could not load batches preserves page skeleton/full failure; vNext concurrent batch and unassigned load then partial in-page unavailable signals.

## G2-13-029-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:170-177`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:124-130`
- Fix: Legacy failed refresh reuses last-good data with Couldn't refresh batches warning and Retry button; vNext SSR partial failures indicate component-specific unavailability.

## G2-13-029-021  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:153-155`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:185-187`
- Fix: Legacy undo failure has error toast and global latest action; vNext per-batch TpoBatchUndoControl uses action ID and may have different failure copy.

## G2-13-029-022  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:153-160`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:184-188`
- Fix: Legacy Undo success toast 'Undone' and reload all batches; vNext per-cohort undo may refresh narrow page only, confirm toast.

## G2-13-029-023  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/batches/index.js:187-187`
- vNext now: `src/app/(authenticated)/tpo/batches/page.tsx:185-187`
- Fix: Legacy lastAction lists aggregate change count and actor across page, vNext last batch decision actor/timestamp per card.
