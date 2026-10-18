# HR scroll and motion pass — chat-19 (2026-10-18)

Owner rule: global scrollbars remain invisible, but overflowing content must advertise more with a truthful edge cue. No one-off animation durations introduced. Source review only; touch, keyboard and screen-reader acceptance must run on a browser.

| Surface | Overflow direction | Change | Test |
|---|---|---|---|
| `/hr/conversations`, general placement-cell thread | Vertical | Wrap max-height message list in `ScrollCue axis="y"`; its named viewport gains focus only when actually scrollable, fades when more entries exist | `HR-XA-05` |
| `/hr/conversations/[threadId]`, drive change requests | Vertical | Preserve ordered list; named ScrollCue and 56-height maximum provide more-content fade | `HR-XA-05` |
| `/hr/placements/jobs/[jobId]`, discussion history | Vertical | Preserve ordered message list, add scroll cue and max-height viewport; actions remain outside scroller | `HR-XA-05` |
| `/hr/calendar`, month day cell events | Vertical | Replace unconveyed overflow with a named day-specific ScrollCue, preserving 52-height viewport | `HR-XA-06` |
| `/hr/placements/jobs/[jobId]`, offer and selection tables | Former horizontal | Shared DataTable renders phone cards with secondary fields in disclosure; desktop horizontal scroll cue from shared primitive | `HR-XA-01` |
| `/hr/drives` and drive detail slow loads | State rather than scroller | Shared bounded `GracefulPageLoading` and recovery rather than unbounded skeleton | `HR-XA-02` |

Related regression assertions: `tests/unit/chat19-hr-page-contracts.test.ts`, `HR-XA-01`, `HR-XA-05`, `HR-XA-06`. Shared `ScrollCue` uses `ResizeObserver`, passive scroll listener, edge fades and `overscroll-contain` with no independent motion duration. Existing CSS `prefers-reduced-motion` token settings remain unchanged.

**Pending:** Real 320/360/390px verification; test keyboard Page Up/Down and wheel/touch scrolling, focus/selection, virtual keyboard in reply forms, and reduced-motion. Only these changed containers are claimed; other authored HR nested widgets require a separate exhaustive visit.

## Shared shell notification drawer, added to chat-19 scroll pass

| Surface | Scrolling | Visible affordance and keyboard semantics | Regression |
|---|---|---|---|
| `HrRecruiterBell` (active recruiter shell) | Vertical notice list up to 80 sizing units | Replaced invisible bare `overflow-auto` with named `ScrollCue axis="y"`; focusable/edge fade when scrollable; 44px links; Escape closes and restores trigger focus | `HR-BREAK-ACTIVE-BELL-34` and `HR-BREAK-BELL-PAYLOAD-35` |

Opening remains a read-only action. Browser wheel, touch and screen-reader validation are pending.
