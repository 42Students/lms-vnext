# Screen 01 — Companies > Today (Focus): prototype × legacy dev × vNext
Date: 2026-10-26
Status: **NOT ACCEPTED — implementation gaps remain**
Reference: screen 01 PNG, `Companies › Today.png` in `42LMS pages prototype-png-tpo(1).zip` (1493×992 screenshot). Prototype is newest, user-authorized visual target.

## Source triangulation

1. **Prototype**: primary Companies tab strip (Today / Recruiters / Companies / Emails / Messages), two-pane Today workflow with roughly one-third-width daily queue, about two-thirds selected contact detail. Example content, dates, names and counts are *fixture data*, never live values to copy.
2. **Old frontend**: `42Students/lms2-fe@lms-dev-2026`, `src/components/tpo/today/TodayQueue.jsx`, `src/components/tpo/recruiterNextStep.js`, `src/components/tpo/today/RepliesWaiting.jsx`, `src/pages/tpo/companies.js`. Legacy implementation combines email replies, dated follow-ups and stage-specific next steps in one queue; special actions include trust/verify new company, follow-up, invite/remind, team/company context, and drive/request actions. Old UI appearance is **not** the target.
3. **Old backend**: `42Students/lms@lms-dev-2026`, CRM follow-up, lead and invitation services. Use for semantic cross-checks, not a reason to bypass vNext authorization.
4. **vNext**: `src/app/(authenticated)/tpo/companies/today/page.tsx`, `src/components/tpo/tpo-companies-today.tsx`, `tpo-companies-today.module.css`, and `tpo-companies-today-model.ts`. Real college-scoped data, validated follow-up deep link, atomic completion/reschedule and explicit source failure states are already better than a mock screenshot and must be preserved.

## Gap ledger (source-level assessment only)

| Priority | Prototype requirement | Current vNext status | Needed implementation / verification |
|---|---|---|---|
| P0 | Single left queue: recruiter email replies first, late/today actions afterwards; J/K moves through them | Reply messages currently render in a separate card above the queue; queue only contains persisted follow-ups | Compose authorized reply + CRM action items into one ordered focus queue; do **not** mislabel recruiter thread responses as replies to marketing campaigns |
| P0 | Stage-aware selected-detail pane; example is *new company not verified* with factual signals and **Verify** action | Selected detail is generic follow-up outcomes, regardless of lead's stage | Read verified company/trust facts using real authorized services and render stage-specific panel/actions. Never display screenshot's fictional email/domain/website/other-college/hiring stats |
| P0 | Queue includes invite/remind, drive-plan/request, access-expiry and no-drive next steps, not only explicit follow-up records | vNext Today's source is `getTpoDueFollowupQueue` plus a separate recruiter-message preview | Compare old `nextStepOf` priority policy with vNext stages and fetch/build all permitted action types; deep-link to safely persisted workflows where native mutation not yet supported |
| P1 | Left header: IST day, combined actionable count, approximate work time and My Work/Everyone scope | vNext count is only visible CRM follow-ups and reply header separate; no grounded work-time estimate | Derive total from authorized source categories and honest estimate, or omit estimate rather than show 30 min fixture |
| P1 | Seven-day strip shows weekday, calendar date, and task count | vNext prints combined short date and count without the screenshot's distinct hierarchy | Match date/day/count visual structure; preserve IST grouping and page-limited preview notice |
| P1 | Bottom queue: not contacted, no-date and later-this-week counts, each navigable | Only verified `NEW` leads and a general replan link | Derive accurate source-backed queues and links, explicitly label partial/unavailable totals |
| P1 | Selected detail: prior interaction, company context, trust/verification facts, latest team update | Generic follow-up note and no reliable last activity/company context on focus pane | Fetch selected person's scoped facts separately; retain unavailable states instead of inventing activity |
| P1 | Actions: Call, Email, Open page; next-day, later-and-next; shortcut hints | Current focus has Call and Open page, with outcome form; no selected Email shortcut; possible guessed `+` dialing prefix | Add appropriately authorized actions and safe phone number handling, preserve existing confirmed atomic completion |
| P2 | Screenshot's exact layout spacing, border, typography and use of real estate | Existing CSS has a two-pane grid but extra title/ownership/reply sections and generic task area | Do a same-viewport screenshot diff and mobile accessibility review after functional stage actions land |
| P2 | Empty, partial and error views must not imply all items complete | vNext already shows missing CRM/messaging/preview failures | Retain and test these safeguards |

## Verified-safe strengths to retain

- TPO membership and tenant scoping before data reads.
- Concurrency-safe follow-up mutation with expected due time and receipt checks.
- Message/reply preview failure is explicit rather than represented as zero.
- No stale follow-up UUID silently opens another recruiter.
- `NEW` stage is the source of truth for not-contacted leads.
- No company/offer/drive totals may be copied from prototype fixtures.

## Required page acceptance before marking 01 complete

- [ ] Confirm stage-specific priorities against old dev code and live vNext services, including joined/unverified, drive request, email reply, invite expiration and normal follow-up.
- [ ] Implement unified queue, selected context/actions and navigation.
- [ ] Add unit and backend-negative tests for scope, ordering, missing data, stale detail, opting out and after-action queue advancement.
- [ ] Run dedicated TPO source acceptance and TypeScript/build/lint; record commit SHA.
- [ ] Run authenticated desktop browser acceptance for representative seeded contact stage variants; no invented provider receipts.
- [ ] Match 1493×992 screenshot and responsive behavior; audit keyboard shortcuts.
- [ ] Record actual browser evidence before changing status to accepted.

**Next page only after code/functional closure of #01.** Final fine-grained visual acceptance can remain explicitly separate if browser access is not available.
