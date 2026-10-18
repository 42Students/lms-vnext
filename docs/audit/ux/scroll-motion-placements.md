# Placements scroll and motion source audit — chat-5

**Scope:** TPO drive selection modal and associated offers, waitlist, joining, evidence and round-results paths. **Surface pass:** source only; no mobile screenshot or assistive-technology run was possible via the GitHub connector.

| Surface | Previous risk | Change and evidence | Test |
|---|---|---|---|
| `src/components/placements/tpo-drive-selection-manager.tsx` > Students checkbox list | Globally invisible scrollbar hid the remaining candidates; scrolling propagated into the parent dialog | Preserve actual vertical scroll; add bottom-edge CSS mask, `overscroll-contain`, `min-h-0`, select labels retain 44px row height | `UX-placements-scroll-motion-01` |
| Same component > Selection release results | Overflow with no cue, not keyboard-addressable by focus | Bottom-edge gradient mask, `tabIndex={0}`, explicit `aria-label`, `overscroll-contain`, flex-safe min-height | `UX-placements-scroll-motion-01` |
| Same component > bulk selection actions | Text-only tiny hitboxes | 44px high `min-h-11` focusable Select matching / Clear selection actions | `UX-placements-selection-targets-01` |
| TPO offer register / joining / waitlist / selections / offer evidence / round results | Short back links were below mobile touch target height | Apply `inline-flex min-h-11 items-center` without changing navigation or legacy copy | `UX-tpo-placements-jobs-jobid-*-02` tests |
| TPO bulk round-results recorder > Select first 25 unmarked | Undersized text-only selection shortcut | `min-h-11` full action hitbox, no changed stage/apply semantics | `UX-placements-bulk-round-targets-01` |
| TPO bulk round-results recorder > Unmarked learners | Vertical list with no visible scrollbar | Named focusable region, contained scroll and bottom-edge mask | `UX-placements-scroll-motion-02` |
| TPO general requests panel > Student requests | Long scrolling request queue without overflow cue | Focusable list, bottom-edge mask, contained scroll; refresh/review buttons now >=44px | `UX-placements-scroll-motion-03` |
| TPO offer lifecycle panel > Eligible offers | Scroll-only offer selection with no remaining-item cue | Named focusable list, contained scroll and bottom-edge mask; checkbox labels >=44px | `UX-placements-scroll-motion-04` |
| TPO bulk request decision > Waiting + confirmation lists | Two vertically capped regions with invisible scrollbar | Two keyboard-addressable labeled regions and bottom-edge masks, keep dialog footer outside scroll | `UX-placements-scroll-motion-05` |
| TPO round drive-day > Roster table | Wide table conceals columns beyond phone viewport | Named keyboard-focusable horizontal scroller with right-edge mask and `overscroll-x-contain` | `UX-placements-scroll-motion-06` |
| TPO week/hour calendar > Week grid | Seven days overflow phone screen without horizontal cue | Named horizontal scroll region + right-edge mask; retain existing sticky IST time gutter | `UX-placements-scroll-motion-07` |
| TPO round result import > Preview, missing-file roster, outcomes | Three vertically capped regions no visible cue | Named/focusable regions with masks and contained vertical scrolling | `UX-placements-scroll-motion-08` |
| TPO selection import > Matched + unmatched preview | Scroll capped and scrollbar hidden | Two named/focusable regions, contained scrolling and edge masks | `UX-placements-scroll-motion-09` |
| Placement bulk offer withdrawal > Eligible list | Narrow capped list concealed eligible rows | Named/focusable scroll with gradient cue and 44px checkbox labels | `UX-placements-scroll-motion-10` |
| Placement drive-day overview > Candidate results table | Horizontal columns hidden on phones | Named keyboard horizontal scroller, right-edge mask, sticky Candidate header/cells and min width | `UX-placements-scroll-motion-11` |

The selection dialog is rendered using the shared `Dialog` and nested `ConfirmDialog`; no custom animation or one-off duration was introduced. The shared dialogs own focus containment, backdrop/body lock, and reduced-motion behaviour. Do not call this a browser accessibility pass without testing 320/360/390px, native keyboard focus, wheel/touch, reduced-motion and saved draft behaviour under network failure.

**Open follow-up:** Reconcile all remaining `src/components/placements` surfaces with `docs/audit/ui-surfaces/UI-SURFACES.md` at mobile breakpoints. The calendar and drive workspace already had source-level masks/overscroll containment before this round; validate those and every listed surface in a browser before claiming production UX acceptance.


### Chat-5 report filter and column overlays (UX-PLACEMENTS-REPORT-SCROLL-27)

`src/components/placements/report-interactive-table.tsx`: the two mobile/desktop expandable report option pickers (Column filters and Columns) now expose named keyboard-reachable vertical scroll regions; the hidden scrollbar is complemented by a vertical bottom mask, `overscroll-contain`, small-screen viewport height capping, and safe-area inset padding. The native `details/summary` widgets still return focus to the disclosure on the Close action. Actual report rows remain in shared `DataTable` with horizontal `ScrollCue`; the data is not rendered twice on phones. Regression: `tests/unit/chat5-placements-ux-workflows.test.ts` `UX-PLACEMENTS-REPORT-SCROLL-27`. Cloud browser keyboard, reduced-motion and overflow-size acceptance is deferred until final CI.
