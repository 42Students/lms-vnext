# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/l14-u029-tpo-batch-detail.md

19 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/l14-u029-tpo-batch-detail.md

## G2-14-029-001  [P2] GAP  facet F01  effort M
- Legacy: Root /tpo/batches/[batchId]?tab=students\|rules\|history shallow-replaces tab (batches/[batchId].js:30-32,47-52,128).
- vNext now: Root redirects tabs to distinct subroutes, adds classes and registrations alias (batches/[batchId]/page.tsx:24-32).
- Fix: Maintain deep links and all filter/query state.

## G2-14-029-003  [P2] GAP  facet F02  effort M
- Legacy: Back above title with state badge inline, subheading program/year, header Undo/Finish (batches/[batchId].js:367-384).
- vNext now: Back in header actions, state Badge below content, finish/undo disclosures (batches/[batchId]/page.tsx:40-41,85-102,131-136).
- Fix: Clone header hierarchy and direct actions.

## G2-14-029-004  [P2] GAP  facet F02  effort M
- Legacy: NextStep and WhoIsIn side-by-side above tabs (batches/[batchId].js:419-424).
- vNext now: Next step standalone then own counts/decision/eligibility snapshot (batches/[batchId]/page.tsx:42-126).
- Fix: Bring two original plan cards back side-by-side.

## G2-14-029-005  [P2] GAP  facet F02  effort M
- Legacy: Exactly three tabs Students(N), Rules, History in one view (batches/[batchId].js:424-440).
- vNext now: Route splits students/rules/history, plus extra workspace navigation (batches/[batchId]/page.tsx:29-31,41).
- Fix: Make original three primary tabs visible and map extras as secondary.

## G2-14-029-006  [P2] GAP  facet F03  effort M
- Legacy: Undo last decision with UndoOutlined and tooltip next to Finish (batches/[batchId].js:377-383).
- vNext now: Undo in Disclosure at bottom (batches/[batchId]/page.tsx:131-136).
- Fix: Move Undo to header with actor/date tooltip.

## G2-14-029-007  [P2] GAP  facet F03  effort M
- Legacy: Act on all/selected direct CTA data-testid batch.act (batches/[batchId].js:323-335).
- vNext now: Bulk changes hidden in Disclosure on Students route (batches/[batchId]/students/page.tsx:139-156).
- Fix: Expose selected action bar above roster.

## G2-14-029-008  [P2] GAP  facet F04  effort M
- Legacy: StatusBadge on title, state from STATE map (batches/[batchId].js:345-346,373).
- vNext now: Badge from tpoBatchPlacementState beneath eligibility decision (batches/[batchId]/page.tsx:85-88).
- Fix: Restore position, casing and state color.

## G2-14-029-009  [P2] GAP  facet F04  effort M
- Legacy: History fallback actor 'Someone' and day format D MMM YYYY, h:mm a (batches/[batchId].js:349-361).
- vNext now: New timeline uses Unknown actor, batchHistoryDate (batches/[batchId]/history/page.tsx:28-31).
- Fix: Restore exact fallback and timestamp formatting.

## G2-14-029-013  [P2] GAP  facet F05  effort M
- Legacy: Students tab count uses full batch.students (batches/[batchId].js:425-426).
- vNext now: Tabs passed summary.assessed which can be sample (batches/[batchId]/page.tsx:34,41).
- Fix: Use full active student count, distinguish assessed sample.

## G2-14-029-020  [P2] GAP  facet F09  effort M
- Legacy: Mark finished confirms removal from working set; reopen confirmation explicit (batches/[batchId].js:181-201).
- vNext now: Lifecycle control collapsed Disclosure (batches/[batchId]/page.tsx:97-102).
- Fix: Restore exact confirmation title/detail and direct button.

## G2-14-029-021  [P2] GAP  facet F09  effort M
- Legacy: Remind modal confirms N eligible unregistered and deadline (batches/[batchId].js:239-259).
- vNext now: Nudge separate page/flow (batches/[batchId]/page.tsx:65-67).
- Fix: Restore explicit recipients count and consent wording.

## G2-14-029-028  [P2] GAP  facet F13  effort M
- Legacy: Roster remains on refresh error, not mistaken for empty (batches/[batchId].js:95-101).
- vNext now: SSR paged result with no last-good in client (batches/[batchId]/students/page.tsx:42-54).
- Fix: Preserve safe last-good warning and retry.

## G2-14-029-030  [P2] GAP  facet F14  effort M
- Legacy: EligibilityGrid exports `${batch.name} eligibility`, persisted storageKey (batches/[batchId].js:430-434).
- vNext now: Current page filtered/unfiltered CSV in Disclosure (batches/[batchId]/students/page.tsx:126-136).
- Fix: Match full filtered export naming and column order.

## G2-14-029-032  [P2] GAP  facet F16  effort M
- Legacy: PageShell scroll-container, paired cards and tabs (batches/[batchId].js:367-440).
- vNext now: Single-column sections and separate roster pages, filters sm/xl (batches/[batchId]/page.tsx:40-126; students/page.tsx:57-58).
- Fix: Restore original outer grid at desktop and mobile.

## G2-14-029-033  [P2] GAP  facet F17  effort M
- Legacy: Shallow tab transitions scroll false (batches/[batchId].js:128).
- vNext now: Full route redirects/links (batches/[batchId]/page.tsx:29-31).
- Fix: Prevent scroll jumps and restore tab focus.

## G2-14-029-035  [P2] GAP  facet F18  effort M
- Legacy: Exact labels Placement eligibility, Undo last decision, Mark finished, Students(N) (batches/[batchId].js:367-440).
- vNext now: Back in header actions, lifecycle in disclosure, tabs separate (batches/[batchId]/page.tsx:40-41,97-102).
- Fix: Clone labels and placement.

## G2-14-029-036  [P2] GAP  facet F19  effort M
- Legacy: Loads all students in memory and merges enrichment by learnerId (batches/[batchId].js:74-126).
- vNext now: Paginates 25, evidence filters current page (batches/[batchId]/students/page.tsx:42-54,135-138).
- Fix: Server-filter full roster, keep performant pagination.

## G2-14-029-039  [P2] GAP  facet F22  effort M
- Legacy: Batch state FINISHED, invitedAt, registrationDeadline, decision history (batches/[batchId].js:68-69,345-365).
- vNext now: Normalized lifecycle.finishedAt/invitedAt/registrationDeadline, history (batches/[batchId]/page.tsx:32-39,131-136).
- Fix: Map state null/default and version to controls.

## G2-14-029-034  [P3] GAP  facet F17  effort S
- Legacy: Data-testid batch.act, batch.suggest, batch.suggest-do (batches/[batchId].js:328-335).
- vNext now: Suggested ids present, no batch.act direct CTA (batches/[batchId]/page.tsx:58-67).
- Fix: Restore accessibility/test hook.
