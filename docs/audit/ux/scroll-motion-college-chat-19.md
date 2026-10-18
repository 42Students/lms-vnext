# College UX cross-audit scroll/motion notes — chat-19 (2026-10-18)

Source-level fixes from `COL-XA-07`, `COL-XA-11`, `COL-XA-13`, `COL-XA-14`, `COL-XA-15` replace horizontal fixed-width tables with shared `DataTable` to expose **all fields** and per-row actions on small screens. DataTable uses a dedicated, focusable `ScrollCue axis="x"` for real desktop overflow and switch to phone cards below the desktop breakpoint.

Specific surfaces:
- `/college/batches/[cohortId]/students`: five columns including Class Move; DataTable explicit empty copy.
- `/college/electives/[slotId]/allocate`: data cards and named **vertical** `ScrollCue axis="y"` with `overscroll-contain`; checkboxes retain accessible learner names.
- `/college/electives/[slotId]/offerings/[offeringId]/roster`: roster state/source/join time plus Move/Remove forms in accessible cards, rather than 780px horizontal table.
- `/college/faculty-assignment`: teaching roster filters, per-row End/Reassign actions and 44px pagination.
- `/college/faculty/[membershipId]`: teaching history in responsive cards, no sideways phone scrolling.

Tests: `tests/unit/chat19-college-cross-audit.test.ts` with the matching `COL-XA` IDs, plus `src/components/ui/data-table.tsx` shared cue invariants. No ad-hoc transition duration/easing was introduced. Page and nested overlay animations continue to use global LMS motion tokens and the shared primitive's reduced-motion support.

**Not yet observed in real browser:** 320, 360 and 390px widths, 500-record scrolling, body scroll while dialogs open, virtual keyboard overlap, long faculty names/emails, and keyboard focus return after class actions. This note does not certify the remaining 80 /college page entry points' delegated scroll surfaces.
