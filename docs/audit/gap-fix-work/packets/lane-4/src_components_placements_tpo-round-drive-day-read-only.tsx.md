# Work packet: edit src/components/placements/tpo-round-drive-day-read-only.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-005  [P1] GAP  facet F02  effort L
- Legacy: Head → gate → six-count strip → sticky controls → student cards → paste dialog. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:234`
- vNext now: TPO has separate round details, eight-count progress, DataTable, result disclosures. `src/components/placements/tpo-round-drive-day-read-only.tsx:114`
- Fix: Recreate phone-first screen structure for TPO operator; keep new insights below.

## G2-11-008-006  [P1] MISSING  facet F02  effort M
- Legacy: Focused gate Search card precedes status strip. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:260`
- vNext now: No gate card. `src/components/placements/tpo-round-drive-day-read-only.tsx:180`
- Fix: Add high-visibility quick-check-in before summary.

## G2-11-008-010  [P1] MISSING  facet F03  effort M
- Legacy: Input.Search enter button labelled `Mark present`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:263`
- vNext now: No direct gate roll action. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Implement Enter-to-check-in with explicit action button.

## G2-11-008-011  [P1] MISSING  facet F03  effort M
- Legacy: Room chips offer `Call next · {room}`, `{waiting} waiting`, `{inside} in`. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:271`
- vNext now: No call-next chips (only separate nav links). `src/components/placements/tpo-round-drive-day-read-only.tsx:103`
- Fix: Add per-panel call-next controls.

## G2-11-008-025  [P1] MISSING  facet F05  effort M
- Legacy: Search filters name and roll (trim/lowercase). `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:81`
- vNext now: TPO table has no equivalent local query field. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Add client text search, no dropping matched candidate rows.

## G2-11-008-030  [P1] MISSING  facet F06  effort M
- Legacy: Gate autoFocus, allowClear, Enter, placeholder `Roll number, then Enter`, disabled if round locked. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:263`
- vNext now: No gate input in TPO. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Restore all gate input properties and disabled rule.

## G2-11-008-043  [P1] MISSING  facet F09  effort M
- Legacy: `Paste a list of roll numbers` dialog triggered from gate. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:359`
- vNext now: Only `Bulk stage round results` disclosure. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Restore separate attendance paste dialog.

## G2-11-008-045  [P1] MISSING  facet F09  effort M
- Legacy: Partial failure warning modal lists failed/unmatched and retains unresolved roll tokens. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:181`
- vNext now: No attendance paste partial-failure dialog. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Retain only unresolved values and display reason buckets.

## G2-11-008-046  [P1] MISSING  facet F09  effort M
- Legacy: OK disabled if zero matched, closed, or busy; modal can't cancel while busy. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:366`
- vNext now: No attendance paste dialog controls. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Enforce pending/locked/matched conditions.

## G2-11-008-058  [P1] MISSING  facet F12  effort M
- Legacy: Exact roll wins; unique suffix/prefix >=3 chars permitted; ambiguous max five. `docs/legacy-source/frontend/src/components/tpo/ui/driveDayRules.js:13`
- vNext now: No TPO gate roll resolver. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Port uniqueness and minimum-length rules.

## G2-11-008-059  [P1] MISSING  facet F12  effort M
- Legacy: Call-next uses PRESENT candidates, assigned-room precedence, earliest slot then roll. `docs/legacy-source/frontend/src/components/tpo/ui/driveDayRules.js:27`
- vNext now: No TPO call-next. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Port deterministic room queue.

## G2-11-008-063  [P1] MISSING  facet F13  effort M
- Legacy: Polling failure retains last roster and displays stale error with Retry. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:253`
- vNext now: No stale-data fallback in static TPO view. `src/components/placements/tpo-round-drive-day-read-only.tsx:81`
- Fix: Keep last successful snapshot with stale indicator.

## G2-11-008-078  [P1] GAP  facet F19  effort M
- Legacy: 20s polling uses monotonic loadSeqRef and unmount cleanup. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:50`
- vNext now: TPO overview static; coordinator refresh timer exists in different component. `src/components/placements/tpo-round-drive-day-read-only.tsx:81`
- Fix: Implement stale-safe refresh and timer cleanup on operator page.

## G2-11-008-083  [P1] MISSING  facet F20  effort S
- Legacy: Ambiguous suffix never auto-selects a student. `docs/legacy-source/frontend/src/components/tpo/ui/driveDayRules.js:19`
- vNext now: No suffix lookup. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Never guess matching student; list candidates.

## G2-11-008-034  [P2] MISSING  facet F07  effort S
- Legacy: Ambiguous suffix shows list of candidate rolls with `Type more of the roll number.` `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:137`
- vNext now: No ambiguous-roll feedback. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Port exact resolver and warning.

## G2-11-008-035  [P2] MISSING  facet F07  effort S
- Legacy: Unmatched gate roll produces `No student with roll number ... is on this roster.` `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:138`
- vNext now: No unmatched roll validation. `src/components/placements/tpo-round-drive-day-read-only.tsx:242`
- Fix: Port exact failure message.

## G2-11-008-042  [P2] MISSING  facet F08  effort M
- Legacy: Bulk success says `{done} marked present`, notes already present. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:193`
- vNext now: No bulk attendance success panel. `src/components/placements/tpo-round-drive-day-read-only.tsx:290`
- Fix: Add success summary for pasted rolls.
