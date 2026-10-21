# Work packet (wave 2): edit src/components/placements/learner-save-drive-button.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-3/learner-saved-job.md, docs/audit/gap2/lane-19/learner-saved-job-service.md

## G2-14-005-006  [P2] GAP  facet F02  effort L
- Legacy: Legacy jobs cards have colored accent rail+48px company avatar+fixed three-fact column+heart action; vNext full-width border-bottom item rows with separate action sections — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:153-269`
- vNext now: `src/components/placements/learner-placement-jobs.tsx:520-540`; `src/components/placements/learner-save-drive-button.tsx:30-37`
- Fix: Use exact legacy four-column card, accent, avatar and compact facts grid

## G2-14-005-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy bookmark button icon-only heart with pressed and tooltip title for outage; vNext FilterChip heart and text action — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:249-266`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:30-37`
- Fix: Render icon-only heart on card, preserve accessible aria pressed/label and disabled tooltip

## G2-14-005-051  [P2] GAP  facet F10  effort S
- Legacy: Legacy saveJob/unsaveJob optimistic UI rollback; vNext POST/DELETE with success-after-server and no optimistic toggle — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:481-515`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:16-29`; `src/modules/placements/saved-job-service.ts:29-69`
- Fix: Flip heart immediately under lock, rollback on API fail, no success toast

## G2-17-011-003  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:1119-1128 — Bookmark heart icon on learner Job detail with Saved tooltip.
- vNext now: src/components/placements/learner-save-drive-button.tsx:30-37 — Labeled FilterChip with heart and action text.
- Fix: Rebuild compact heart button/tooltip parity on job detail.

## G2-17-011-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:1119-1128 — Heart save control alongside job actions on detail.
- vNext now: src/components/placements/learner-save-drive-button.tsx:30-37 — FilterChip spans text+icon; source component does not own card placement.
- Fix: Match original icon placement/spacing after inspecting caller.

## G2-17-011-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:404-425 — AntD success/error message after toggle.
- vNext now: src/components/placements/learner-save-drive-button.tsx:24-37 — Inline status string, not toast.
- Fix: Use app toast with legacy copy and duration.

## G2-17-011-035  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:392-402 — Saved-ID load rejection silently resets set to empty.
- vNext now: src/components/placements/learner-save-drive-button.tsx:12-14 — initialSaved prop; toggle errors shown inline.
- Fix: Distinguish unavailable saved-state from genuinely unsaved; retry.

## G2-3-019-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:127-141`, `251-265`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:30-36`
- Fix: Legacy list job card has icon-only heart with accessible name; vNext reusable FilterChip displays text and heart. Match legacy card footprint/spacing and icon style.

## G2-3-019-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:251-261`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:30-35`
- Fix: Legacy heart uses Ant HeartFilled/HeartOutlined with `data-saved` and no button text, vNext uses glyphs ♥/♡ plus Save for later/Remove from saved jobs text. Match icon and hover state.

## G2-3-019-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:477-511`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:16-36`
- Fix: Legacy list save toggles optimistically immediately, no success toast; vNext waits for fetch response, displays inline success text and refreshes page. Restore optimistic visual flip on cards; keep rollback on errors.

## G2-3-019-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:391-411`, `477-511`
- vNext now: `src/components/placements/learner-jobs-browse.tsx:104-112`, `src/components/placements/learner-save-drive-button.tsx:11-36`
- Fix: Legacy saved-IDs fetch failure disables heart toggles with `Saved drives are temporarily unavailable; retry loading.`; vNext saved-job read failure at server render does not produce same recoverable disabled state. Add failure-isolated data load/retry.

## G2-3-019-033  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:251-265`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:30-36`, `src/components/placements/learner-jobs-browse.tsx:126-132`
- Fix: Legacy heart icon has compact card control, vNext FilterChip min44px at mobile with text and expanded row. Compare exact placement at 375/768/1280 and preserve touch target.

## G2-3-019-035  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:477-511`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:14-36`
- Fix: Legacy errors are adjacent role=alert on each card and button disabled during support failure; vNext one inline status, no original saved-ids load error distinction. Add per-card alert/live state.

## G2-3-019-036  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:403-425`
- vNext now: `src/modules/placements/learner-saved-drives-model.ts:13-16`, `src/components/placements/learner-save-drive-button.tsx:24-36`
- Fix: Legacy list uses no success toast; detail uses exact `Saved for later`/`Removed from saved jobs`. VNext model supplies these texts but renders inline in all contexts. Restore context-dependent feedback.

## G2-3-019-040  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:477-514`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:16-29`
- Fix: Legacy immediate icon update then compensating rollback on failed save; vNext waits for server confirmation and router.refresh. Match optimistic update plus single-flight lock/reconcile.

## G2-14-005-048  [P3] GAP  facet F09  effort S
- Legacy: Legacy save heart icon has title when unavailable; vNext chip no temporarily-unavailable tooltip — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:249-259`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:30-37`
- Fix: Add tooltip/disabled reason to save affordance

## G2-17-011-006  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:1119-1128 — Unsaved outlined heart vs saved solid teal heart.
- vNext now: src/components/placements/learner-save-drive-button.tsx:31-35 — ♡ / ♥ text symbols, not AntD HeartOutlined/Filled.
- Fix: Use themed outlined/filled icon and teal saved state.

## G2-17-011-007  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:1119-1128 — Tooltips `Save for later` / `Saved`.
- vNext now: src/components/placements/learner-save-drive-button.tsx:31-35 — aria-label and visible Save for later/Remove; no Saved tooltip.
- Fix: Add exact Saved/Save for later tooltip.

## G2-17-011-040  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:1119-1128 — Compact heart icon suitable for narrow header.
- vNext now: src/components/placements/learner-save-drive-button.tsx:30-36 — Chip with text on mobile, min 44px touch.
- Fix: Keep touch target while matching icon-only desktop layout.

## G2-19-012-005  [P3] GAP  facet F03  effort S
- Legacy: Legacy UI uses save/unsave endpoints returning message `Job saved` and `Job removed from saved` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:782-785` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:817-820`
- vNext now: vNext button renders FilterChip with heart glyph and saved state `src/components/placements/learner-save-drive-button.tsx:30-36`
- Fix: Match old Save/Unsave copy and icon on the saved card.

## G2-19-012-040  [P3] GAP  facet F18  effort S
- Legacy: Legacy API messages `Job saved` / `Job removed from saved` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:783-785` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:818-820`
- vNext now: vNext visible action names come from learnerSavedDriveCopy and heart glyph `src/components/placements/learner-save-drive-button.tsx:30-36`
- Fix: Verify literal Save for later/Remove from saved wording.

## G2-3-019-007  [P3] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:403-426`
- vNext now: `src/components/placements/learner-save-drive-button.tsx:20-36`, `src/modules/placements/learner-saved-drives-model.ts:13-16`
- Fix: Legacy job detail gives Ant success toast `Saved for later`/`Removed from saved jobs`, vNext status text appears inline next to chip. Match detail-specific feedback form.
