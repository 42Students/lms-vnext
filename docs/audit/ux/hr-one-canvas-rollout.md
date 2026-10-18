# HR one-canvas rollout — chat-19 (owner design directive, 2026-10-19)

The old LMS uses a continuous page, not a pile of bordered section cards. **chat-17 owns the shared canvas/section primitive**; this lane replaces only HR page-level section cards after that primitive lands, without changing wording, data access, state guards or phone responsiveness. Repeating candidates, specific offers, event-day tiles and distinct destructive confirmations may remain individual cards.

## Implementation constraints

- Every page has one main visible surface. Preserve PageHeader and existing authorization, pending/error/empty states, forms, selection links, ScrollCue and nested real entity item cards. Use one shared outer canvas and plain shared sections with spacing, headings and thin dividers. Avoid applying a second shell or tinted background inside the shared canvas.
- No hand-written substitute while the chat-17 primitive is not published on `main` or `chatgpt/chat-17-b`; import the exact shared component signature when available. Do not edit `src/components/ui` (chat-17 owns it).
- 44px focusable targets, horizontal phone layout, legacy copy and actor/tenant boundaries must not regress. Page-level tests must inspect *rendered* sections where feasible, not just a class string. Invalid/no-access states belong on the same canvas.

## Route-by-route card-to-section map

| HR route | Page wrappers / plan | Repeating items kept distinct | Acceptance |
|---|---|---|---|
| `/hr/activity` | One bordered no-access notice (line ~27); migrate status section inside canvas | Individual events remain rows | Activity, invalid filters and no-access messages |
| `/hr/calendar` | Three major bordered sections for scopes/month/list (~328,389,404) and smaller extras (~528); convert page-level shells to shared sections | Individual day tiles (~570), timeline entries (~154,737) remain visually distinct | Month/list/agenda views; IST labels, mobile ScrollCue |
| `/hr/colleges` | Redirect alias; do not create a second canvas | n/a | Existing redirect unchanged |
| `/hr/company` | No-access, company summary and team roster sections (~69,160,211) lose card framing; heading/divider define sections | Distinct hiring KPI item tiles (~195) may become inline metrics | Grant chooser, company/team tabs, 44px switcher |
| `/hr/company/reports` | Remove report summary/filter/data-section cards (~106,267,283,349); DataTable directly in section | Distinct report metrics (~357) retain data hierarchy without nested surface | Pagination, statuses, export/empty/no grant |
| `/hr/conversations` | No-access, filter/compose and discussion list wrappers (~70,98) become canvas sections | Rows/message snippets remain distinct | College selection, unread, pagination |
| `/hr/conversations/[threadId]` | Drive-change-request wrapper (~90) becomes a section | Message proposal detail panel (~119) remains nested semantic content | Recipient isolation, composer discard, ScrollCue |
| `/hr/drives` | Replace any special bordered no-access/loading chunks (~202,207) with in-canvas states; list/search/tabs belong on same surface | Drive rows/individual request cards may remain item tiles | Grant filters and phone/mobile list |
| `/hr/drives/[jobId]/interview-slots` | Parent slot summary (~42) becomes section | Slot proposals (~56) are separate appointments and remain individual items | No-access/slots and actions |
| `/hr/drives/[jobId]/messages` | Drive discussion parent (~26) becomes section | Thread item messages retain separation | Send/new thread and unauthorized view |
| `/hr/drives/[jobId]/rounds/editor` | Add-round form (~31) becomes one section; list headed by thin divider | Each individual round edit item (~59) remains separate | Native mutation contract, undo/retry and mobile inputs |
| `/hr/drives/[jobId]/rounds/editor/remove/[roundId]` | One giant rounded confirmation wrapper (~24) goes inside shared section | Destructive confirmation remains prominent but not a fake independent page | Version guard, safe postback |
| `/hr/drives/new` | Root already composed mainly by child `HrDriveDraftForm`, audit child steps/section cards before refactor; do not strip fieldset boundaries | Distinct editable repeated round entries may remain item tiles | Draft/save/resume, multi-step, phone |
| `/hr/drives/proposals` | Choose-college section (~30) and filter form border (~36) convert to clean canvas sections | Proposal items remain list rows | Sent receipt and pagination |
| `/hr/drives/recorded-outside` | Root page is already lightweight; inspect nested record form only if stacked cards are present | Separate outside event row is legitimate | Route, college selector, no false publish |
| `/hr/home` | Main worst offender: next actions, this week, live drives and four+ follow-up sections (~154,194,212,237,245,253,287) become one canvas with section headings/dividers | Standalone action/KPI or individual grant choice (~59,175) can remain an item | Today dashboard hierarchy and phone |
| `/hr/messages` | Re-export alias; canonical page is Conversations | n/a | Alias remains unchanged |
| `/hr/notifications` | No-access state (~34) and notification list/filter must read as one canvas | Each notification row preserves unread state | Status, unread and retry |
| `/hr/placements` | Lightweight recruiter portfolio delegation; inspect child `RecruiterPlacementPortfolio` rather than add an artificial section | Individual jobs/cards are discrete items | Existing portfolio filters |
| `/hr/placements/jobs/[jobId]` | Large worst offender: overview (~281,340), discussion (~472), requests (~505), applicants (~513), offers (~639), rounds (~775,834) convert from bordered cards to sections with dividers. Smaller tinted semantic subpanels (~349,408,477,661,682) flatten if merely page subsection | Individual applicants (~539), rounds (~809), candidates (~868) retain item distinction and disclosure | Tab-specific mount, eligibility, privacy, responsive tables |
| `/hr/profile` | Your details and Account (~25,46), access table (~90) and status: merge into one profile canvas, separated by headings and thin dividers | Contact editor is a form, not a card; access rows remain table | Owner identity, revocation receipt, active grants |
| `/hr/round-results` | Filters and results (~62,70) become sections inside same canvas | Each submitted round result (~83) stays a distinct entry | Role/state guard, 44px filters and empty |

## Rollout order

1. Prepare this inventory while waiting for chat-17's shared primitive. Check `chatgpt/chat-17-b` and `main` before modifying pages.
2. Start straightforward pages (Activity, Notifications, Round Results, Profile, Proposals, Rounds Editor, Interview Slots and Messages) and add page-structure assertions.
3. Then Company, Company Reports, Calendar, Drives, Conversations, Home and complex Hiring Drive detail (check tabs individually).
4. Finally inspect delegated child surfaces (`HrDriveDraftForm`, `RecruiterPlacementPortfolio`) and alias redirects. Compare all 22 route variants, invalid/no-access and 320px states.
5. Browser/CI layout acceptance occurs in orchestrator's final pass; nothing in this document claims a browser run.

Initial audit: **20 actual HR page routes + 2 aliases**, approximately 49 top-level `section` occurrences and many child entity cards; numbers are review annotations, not DOM assertions. `docs/audit/coverage/hr-pages-ledger.md` tracks behavioral test coverage.
