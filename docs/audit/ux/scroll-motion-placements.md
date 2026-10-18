# Placements scroll and motion source audit — chat-5

**Scope:** TPO drive selection modal and associated offers, waitlist, joining, evidence and round-results paths. **Surface pass:** source only; no mobile screenshot or assistive-technology run was possible via the GitHub connector.

| Surface | Previous risk | Change and evidence | Test |
|---|---|---|---|
| `src/components/placements/tpo-drive-selection-manager.tsx` > Students checkbox list | Globally invisible scrollbar hid the remaining candidates; scrolling propagated into the parent dialog | Preserve actual vertical scroll; add bottom-edge CSS mask, `overscroll-contain`, `min-h-0`, select labels retain 44px row height | `UX-placements-scroll-motion-01` |
| Same component > Selection release results | Overflow with no cue, not keyboard-addressable by focus | Bottom-edge gradient mask, `tabIndex={0}`, explicit `aria-label`, `overscroll-contain`, flex-safe min-height | `UX-placements-scroll-motion-01` |
| Same component > bulk selection actions | Text-only tiny hitboxes | 44px high `min-h-11` focusable Select matching / Clear selection actions | `UX-placements-selection-targets-01` |
| TPO offer register / joining / waitlist / selections / offer evidence / round results | Short back links were below mobile touch target height | Apply `inline-flex min-h-11 items-center` without changing navigation or legacy copy | `UX-tpo-placements-jobs-jobid-*-02` tests |

| TPO bulk round-results recorder > Select first 25 unmarked | Undersized text-only selection shortcut | `min-h-11` full action hitbox, no changed stage/apply semantics | `UX-placements-bulk-round-targets-01` |

The selection dialog is rendered using the shared `Dialog` and nested `ConfirmDialog`; no custom animation or one-off duration was introduced. The shared dialogs own focus containment, backdrop/body lock, and reduced-motion behaviour. Do not call this a browser accessibility pass without testing 320/360/390px, native keyboard focus, wheel/touch, reduced-motion and saved draft behaviour under network failure.

**Open follow-up:** Inventory remaining scrolling/overlay elements in `src/components/placements` against `docs/audit/ui-surfaces/UI-SURFACES.md` and verify each at mobile breakpoints. Only the containers above were modified and source-checked in this round.
