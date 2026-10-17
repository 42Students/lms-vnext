# TPO inbox, Team, announcements and bell — builder chat-2 verification

**Protocol:** `docs/orchestrator/briefs/gap-closure-lane.md`. Tests are authored but **not run** by chat-2. Independent execution and migration registration are the orchestrator's responsibility. A DONE below means source implementation plus a named acceptance test exists on this branch; not runtime-certified.

| ID | Status | Evidence (implementation; test file and test name) |
| --- | --- | --- |
| TPO-inbox-team-15 | DONE | Permanent Everyone channel `src/app/(authenticated)/tpo/team/everyone/page.tsx`, `src/modules/placements/tpo-team-everyone-service.ts`, `src/db/schema/tpo-internal.ts`, `docs/proposed-migrations/tpo-inbox-team-everyone.sql`; `tests/unit/tpo-team-everyone-model.test.ts` **TPO-inbox-team-15 exposes Everyone…**, **TPO-inbox-team-15 notifies…**; `tests/integration/db09-tpo-team-everyone.test.ts` **TPO-inbox-team-15 keeps Everyone accessible after mute…**. Integration requires the orchestrator to register migration and set `TPO_TEAM_EVERYONE_SCHEMA_READY=1`. |
| TPO-inbox-team-04 | DONE | `src/app/api/placements/tpo/messages/threads/[threadId]/read/route.ts` and `src/components/tpo/tpo-recruiter-message-reply.tsx` explicit read POST and Seen; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-04 opens as a read acknowledgement…**. |
| TPO-inbox-team-05 | DONE | `src/modules/placements/tpo-messages-model.ts` and `src/app/(authenticated)/tpo/messages/page.tsx` Reply/Unread segment, company/body preview, search; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-05 filters recruiter last-response…**. |
| TPO-inbox-team-06 | DONE | `src/modules/placements/tpo-inbox-date-model.ts` and `src/app/(authenticated)/tpo/messages/page.tsx` company, preview, waiting, access end, relative IST; `tests/unit/tpo-inbox-team-recruiter-inbox-closure.test.ts` **TPO-inbox-team-06 preserves company…**. |
| TPO-inbox-team-19 | DONE | `src/modules/placements/tpo-team-internal-read-service.ts` scoped topic/message search and excerpts; `src/components/tpo/tpo-team-search.tsx` 200ms debounce and slash shortcut; `src/app/(authenticated)/tpo/team/page.tsx` URL query; `tests/unit/tpo-team-search-verification.test.ts` **TPO-inbox-team-19 searches only the caller's authorized Team threads…** and **TPO-inbox-team-19 keeps search in the URL…**. Database acceptance remains with orchestrator. |
| TPO-inbox-team-08 | BLOCKED | Email relay needs verified provider credentials and inbound reply webhook; `docs/orchestrator/queues/gap-closure-chat-2.md` blocker. No production access or emails attempted. |
| TPO-inbox-team-10 | DONE | `src/app/(authenticated)/tpo/messages/page.tsx` exact legacy subtitle and no internal migration jargon; `tests/unit/tpo-inbox-team-copy.test.ts` **TPO-inbox-team-10 uses the exact legacy Messages subtitle…**. |

| TPO-inbox-team-09 | DONE | Messages 4-second + focus refresh; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-09**. |
| TPO-inbox-team-11 | DONE | no notification-as-message fallback; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-11**. |
| TPO-inbox-team-13 | DONE | mobile recruiter cards and back control; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-13**. |
| TPO-inbox-team-14 | DONE | canonical notifications redirect; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-14**. |
| TPO-inbox-team-27 | DONE | Team 30-second + focus refresh; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-27**. |
| TPO-inbox-team-39 | DONE | safe inline Team create and reply errors; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-39**. |
| TPO-inbox-team-40 | DONE | exact Team subtitle; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-40**. |
| TPO-inbox-team-56 | DONE | exact announcement tabs/subtitles; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-56**. |
| TPO-inbox-team-58 | DONE | 200/8000 create and edit limits; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-58**. |
| TPO-inbox-team-65 | DONE | exact Notifications subtitle; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-65**. |
| TPO-inbox-team-66 | DONE | mark-all no-confirm with zero guard; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-66**. |
| TPO-inbox-team-R01 | DONE | scoped recruiter message TPO bell notification; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-R01**. |
| TPO-inbox-team-R03 | DONE | legacy announcement tab aliases; `tests/unit/tpo-inbox-team-round2.test.ts` test **TPO-inbox-team-R03**. |

| TPO-inbox-team-41 | DONE | Last 500 messages, default scroll to newest or deep-linked message `src/modules/placements/tpo-team-conversation-service.ts`, `src/components/tpo/tpo-team-message-scroll.tsx`; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-41 loads the latest five hundred messages…**. |
| TPO-inbox-team-55 | DONE | `src/modules/announcements/tpo-notice-form-error-model.ts`, create/edit routes and UI exact HTTPS error, required title/message, IST schedule minima; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-55 returns a user-facing error…**. |
| TPO-inbox-team-R05 | DONE | `src/db/schema/tpo-internal.ts`, `src/modules/placements/tpo-team-internal-read-service.ts`, `src/modules/placements/tpo-team-internal-ack-service.ts`; proposed SQL `docs/proposed-migrations/tpo-inbox-team-read-receipts.sql`; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-R05 separates Team read positions…** and `tests/integration/db09-tpo-team-read-receipts.test.ts` **TPO-inbox-team-R05 separates unread message positions…**. PG test requires schema registration and `TPO_TEAM_READ_RECEIPTS_SCHEMA_READY=1`. |

Source-level follow-up still required for `TPO-inbox-team-30/48/49/50/51/52/53/64`: named tests capture implemented pieces, but full legacy acceptance has not yet been demonstrated. These remain queued.

| TPO-inbox-team-R07 | DONE | Loaded log semantics, native link keyboard navigation, All conversations back label and Team slash hint; `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx`, `src/app/(authenticated)/tpo/team/[threadId]/page.tsx`, `src/components/tpo/tpo-team-search.tsx`; `tests/unit/tpo-inbox-team-round2.test.ts` **TPO-inbox-team-R07 gives native keyboard links…**. |

Other queued gaps remain outstanding until individually inspected and recorded.

## Round 3 graceful-operation adoption

- `TPO-inbox-team-18`: **source partially improved, NOT closed** — counterpart display added but legacy filters and thread kinds still need implementation. `tests/unit/tpo-inbox-team-graceful-round3.test.ts` test name contains `TPO-inbox-team-18`.
- `TPO-inbox-team-21`: **source partially improved, NOT closed** — draft recovery, Enter/Shift+Enter and counter are implemented; `@` mentions and `#` object links remain open. `tests/unit/tpo-inbox-team-graceful-round3.test.ts` test name contains `TPO-inbox-team-21`.
- `TPO-inbox-team-39`: reinforced draft retention and inline error mapping; named test in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`.
- `TPO-inbox-team-52`: replaced the old native confirmation with an accessible keyboard dialog; named test in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`.
- `TPO-inbox-team-55`: announcement draft preservation added; named test in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`.
- GR-31, GR-35, GR-60, GR-61, GR-62, GR-90, GR-91: local page adoption verified by named source tests in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`, not a platform-wide GR closure.
- `TPO-inbox-team-50/51`: persisted HTTPS CTA validation uses the existing schema; same test file covers validation, but broader modal/edit acceptance is still open.

**Tests written, not run.**

## Round 3: independent Team preferences and graceful read actions
- `TPO-inbox-team-20`: **PARTIAL, not closed** — scoped Follow/Stop following and Mute/Unmute are persisted on `placement_tpo_internal_reads`; unread suppresses unfollowed/muted threads; `tests/unit/tpo-inbox-team-graceful-round3.test.ts` test **TPO-inbox-team-20 follows by default…**, `tests/integration/db09-tpo-team-read-receipts.test.ts` test **TPO-inbox-team-20 persists follow/mute…**. Owner-run PostgreSQL test requires `TPO_TEAM_READ_RECEIPTS_SCHEMA_READY=1` after migration proposal registration. Legacy mentions and advanced follow semantics remain open.
- `TPO-inbox-team-54`: **PARTIAL, not closed** — From 42 read action now catches invalid responses with plain text and guarded timeout, `tests/unit/tpo-inbox-team-graceful-round3.test.ts` test **TPO-inbox-team-54 and GR-90…**; unread badge/New-tag still open.
- `TPO-inbox-team-67`: **PARTIAL, not closed** — last-30-days unread cutoff exists; legacy older-unread navigation is still open; named unit test `TPO-inbox-team-67` in the round-3 suite.
- `TPO-inbox-team-68`: **PARTIAL, not closed** — loading skeleton and Retry boundary exist; stale-data display remains to implement; named unit test `TPO-inbox-team-68`.
- `TPO-inbox-team-R04`: **PARTIAL, not closed** — 100-row pagination and next cursor exists but author-only filtering needs review; named unit test `TPO-inbox-team-R04`.

No tests were executed by chat-2; orchestrator owns execution and migration registration.

### Round 3: verified-closure source additions
- `TPO-inbox-team-17`: PARTIAL — retried creation is idempotent via per-actor persisted audit key, but multiple participants, rename, visibility and leave remain open. Evidence `src/modules/placements/tpo-team-internal-create-service.ts`, `src/components/tpo/tpo-team-forms.tsx`; test **TPO-inbox-team-17 GR-34 prevents duplicate private conversation creation on retry** in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`.
- `TPO-inbox-team-19`: DONE source-level Team search and failure fallback — failed search retains query and exposes Retry without false empty. Test **TPO-inbox-team-19 GR-71/72/73/76 preserves Team search…** in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`.
- `TPO-inbox-team-45`: PARTIAL — live preview and zero-target send guard existed; now preview failures keep the notice list and the selected target with an explicit Retry. Test **TPO-inbox-team-45 GR-71/72/73 preserves audience preview filters…** in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`. Complete legacy reach wording and picker parity remains open.
- `TPO-inbox-team-54`: PARTIAL — college-scoped From 42 read receipts are now projected and genuinely unread cards display **New**, only when receipt storage is registered. Test **TPO-inbox-team-54 GR-90 marks From 42 announcements New only with verified college-scoped reads** in `tests/unit/tpo-inbox-team-graceful-round3.test.ts`. Tab/sidebar/bell unread parity remains open.
- `TPO-inbox-team-21`: PARTIAL — message send idempotency is backed by `activity_events.dedupe_key` and the author's session draft. `tests/unit/tpo-inbox-team-graceful-round3.test.ts` tests **TPO-inbox-team-21 GR-34…** and `tests/integration/db09-tpo-team-read-receipts.test.ts` **TPO-inbox-team-21 GR-34 PostgreSQL enforces…**. Mentions and object links remain open.
- `TPO-inbox-team-39`: DONE source-level friendly JSON create/reply success and failure preserving drafts, evidenced by **TPO-inbox-team-39 GR-32 treats login redirects…**.
- Sections GR-31/32/34/35/60/61/62/71/72/73/76/90/91 are **page-scoped adoptions only**, not platform-wide closures. Shared chat-14 helpers were not on `main` when this batch was authored.
- All mentioned tests are authored but **not run**; orchestrator owns verification and any migration registration.

## Round 4 — shared friendly errors, safe delivery and filtered Team inbox

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-15 | DONE (source; orchestration pending) | `src/components/tpo/tpo-everyone-controls.tsx`, `src/app/api/placements/tpo/team/everyone/{messages,mute}/route.ts`, `src/app/(authenticated)/tpo/team/everyone/page.tsx`: guarded JSON responses, preserved unsent text, timeout and in-page failed-history Retry. `tests/unit/tpo-inbox-team-round4-graceful.test.ts` **TPO-inbox-team-15**. Proposed Everyone migration still requires orchestrator registration. |
| TPO-inbox-team-04 | DONE (source; unrun) | `src/components/tpo/tpo-recruiter-message-reply.tsx` acknowledges by bounded POST; same round-4 test **TPO-inbox-team-04**. |
| TPO-inbox-team-09 | DONE (source; unrun) | Same recruiter composer retains text and bounds pending operations; round-4 test **TPO-inbox-team-09**. |
| TPO-inbox-team-18 | PARTIAL — remains OPEN | `src/modules/placements/tpo-team-conversation-filter-model.ts`, `src/app/(authenticated)/tpo/team/page.tsx` implement All/Following/Unread/Topics with counts. Named tests **TPO-inbox-team-18** in `tests/unit/tpo-team-filter-round4.test.ts`. Mentions, asks, decisions, drive/company/student threads remain to build. |
| TPO-inbox-team-20 | PARTIAL — remains OPEN | Same filter and `src/modules/placements/tpo-team-internal-read-service.ts` use persisted following/mute and member unread. Named test **TPO-inbox-team-20**. Mention indicators and computed object owner following remain open. |
| TPO-inbox-team-47 | PARTIAL — remains OPEN | `src/components/tpo/tpo-notice-read-progress.tsx` uses `apiFetch`, 15-second timeout, no data clearing on failure; named test **TPO-inbox-team-47**. Full roll/branch recipient parity pending. |
| TPO-inbox-team-60 | PARTIAL — remains OPEN | `src/components/tpo/tpo-bell-panel.tsx` now uses bounded `apiFetch` for read and mark-all, with safe errors. Named test **TPO-inbox-team-60**. Legacy event-producer coverage still missing. |
| TPO-inbox-team-64 | PARTIAL — remains OPEN | Bell acknowledges with friendly fetch and retains keyboard-visible row actions; named test **TPO-inbox-team-64**. Full notification-list parity pending. |

**Shared graceful-operation adoption:** `tests/unit/tpo-inbox-team-round4-graceful.test.ts` contains explicit `GR-30/31/35/60/61/62/70/71/72/73/75/90/91/92` test names. These are per-page source changes, **not platform-wide GR closure**. Tests were written but not run. 

## Round 4 — audience selection, confirmation and receipt fidelity

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-44 | PARTIAL — remains OPEN | `src/modules/announcements/tpo-notice-target-options-service.ts` queries college-scoped batches and branches plus published drives; `src/components/tpo/tpo-notice-audience-picker.tsx` presents labelled choices, legacy empty-state strings and a recoverable options-unavailable state; wired in `src/app/(authenticated)/tpo/announcements/page.tsx`. Unit test **TPO-inbox-team-44** in `tests/unit/tpo-notice-audience-round4.test.ts`; disposable PostgreSQL test **TPO-inbox-team-44** in `tests/integration/tpo-notice-target-options.test.ts`. Legacy multi-select batch/branch parity and full search remain open. |
| TPO-inbox-team-45 | PARTIAL — remains OPEN | Announcement preview now displays **Goes to n students** only for targeted student populations, and preserves college-member semantics for whole-college scope. Named tests **TPO-inbox-team-45** in `tests/unit/tpo-notice-audience-round4.test.ts` and `tests/unit/tpo-notice-round4-verification.test.ts`. Exact picker and notification counts still require acceptance. |
| TPO-inbox-team-46 | PARTIAL — remains OPEN | `src/modules/announcements/tpo-notice-read-receipts-service.ts` now flags a published but undelivered announcement as awaiting delivery rather than implying successful send. Named source test **TPO-inbox-team-46** in `tests/unit/tpo-notice-round4-verification.test.ts`. Missing durable send/outbox remains an implementation gap, **not a provider-credential blocker**. |
| TPO-inbox-team-47 | PARTIAL — remains OPEN | Read-receipt widget is guarded and preserves last successful data across bounded fetch failures; same round-4 named test **TPO-inbox-team-47**. Full recipient metadata and delivery pipeline still to build. |
| TPO-inbox-team-54 | PARTIAL — remains OPEN | From 42 tab shows accurately qualified per-page unread count on registered read state, not a falsely global number. `src/app/(authenticated)/tpo/announcements/page.tsx`; named source test **TPO-inbox-team-54** in `tests/unit/tpo-notice-round4-verification.test.ts`. Bell and sidebar count parity remain open (shell belongs to chat-9). |

The additional unit test `tests/unit/tpo-notice-round4-verification.test.ts` contains named cases for `TPO-inbox-team-48/49/50/51/52/53/55/56/58/R03/R04` to protect existing source behavior. Those cases are **not** independent verification of complete legacy parity. No tests were executed by chat-2; the orchestrator runs them and registers proposed migrations.

## Builder chat-2 continuation — college permission parity

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-17 | PARTIAL — OPEN | Create-topic limit now 200 in UI, Zod and Drizzle with proposed migration `docs/proposed-migrations/tpo-inbox-team-topic-limit.sql`. Named tests `tests/unit/tpo-team-topic-length-chat2.test.ts` (**TPO-inbox-team-17**). Multi-person/topic context, renaming, visibility and leave still missing. PostgreSQL registration and execution by orchestrator. |
| TPO-inbox-team-57 | DONE (source; integration pending) | Same-college, persisted `placements.manage` authority can edit, delete, undo or restore colleagues' TPO notices, still guarded by organization/college/sender type, row lock and version. UI includes colleague notices in To your students and Recently removed; named tests **TPO-inbox-team-57** in `tests/unit/tpo-team-notice-colleague-access-chat2.test.ts`. Database authorization test to be run by orchestrator. |

## Builder chat-2 continuation — notification acknowledgement

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-64 | DONE (source; unrun) | `src/components/activity/notification-list.tsx` now uses 12 s guarded `apiFetch` and shows friendly Retry-able toast without navigation on failed read acknowledgement; whole-row TPO cards, unread dot, New and arrow remain. Named **TPO-inbox-team-64** in `tests/unit/tpo-bell-notification-ack-chat2.test.ts`. |
| TPO-inbox-team-61 | DONE (source; unrun) | Reviewed existing `src/components/tpo/tpo-bell-panel.tsx`: 20-row drawer with click-then-read-then-route, errors and mark-all guard; named **TPO-inbox-team-61** in the same test. |

## Builder chat-2 continuation — visible announcement links and counters

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-49 | PARTIAL — OPEN | `src/modules/announcements/tpo-notice-safe-links.ts` and announcement cards linkify verified HTTPS URLs, preserve other text, and retain the existing author/date/audience/state/CTA. Named test **TPO-inbox-team-49** in `tests/unit/tpo-notice-safe-links-chat2.test.ts`. Full email-delivery labels depend on additional delivery work. |
| TPO-inbox-team-62 | DONE (source; unrun) | Reviewed `src/components/tpo/tpo-header-indicators.tsx` and `src/app/(authenticated)/tpo/layout.tsx`: 30-second + focus-visible refresh of scoped recruiter-message and TPO bell unread counts. Named test **TPO-inbox-team-62** in `tests/unit/tpo-notice-safe-links-chat2.test.ts`. |

## Builder chat-2 continuation — People roster labeling

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-37 | PARTIAL — OPEN | `src/app/(authenticated)/tpo/team/page.tsx` no longer advertises legacy faculty/student coordinator duties as standing Team roles and restores the exact TPO-admin membership note. Named test **TPO-inbox-team-37** in `tests/unit/tpo-team-legacy-people-chat2.test.ts`. College-admin inclusion and membership policy still require R02/38 work. |
| TPO-inbox-team-32 | PARTIAL — OPEN | People count now matches shown permanent members; existing Work and Name sort preserved. Named test **TPO-inbox-team-32** in the same suite. Overdue-first cannot be truthful until ask workload is persisted. |

### PostgreSQL evidence for TPO-inbox-team-57

`tests/integration/tpo-inbox-team-colleague-notices-chat2.test.ts` named test **TPO-inbox-team-57 permits a different authorized same-college TPO to edit then delete without losing optimistic concurrency** creates a notice under one actor, edits/deletes under a distinct persisted TPO actor and checks stale-version rejection and persisted state. It runs only on the orchestrator's approved disposable DB10 target. **Not executed by builder.**

## Builder chat-2 continuation — Notifications history and refresh

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-65 | DONE (source; unrun) | TPO-only optional `allLabel` in shared `NotificationToolbar`: Latest n/All (n), exact subtitle and empty strings on `src/app/(authenticated)/tpo/notifications/page.tsx`; named **TPO-inbox-team-65** in `tests/unit/tpo-notifications-history-chat2.test.ts`. |
| TPO-inbox-team-67 | DONE (source; unrun) | `tpo-notifications-service.ts` applies 30-day cutoff to unread count and view. First page now explains older unread items, with cursor history replacing legacy 200 ceiling as a documented enhancement. Named **TPO-inbox-team-67** same unit suite. |
| TPO-inbox-team-68 | DONE (source; unrun) | `src/components/tpo/tpo-notification-refresh.tsx` probes bounded same-origin data before refreshing cards, keeps stale cards on transient failure and exposes exact legacy stale and refresh messages with Retry; existing loading skeleton and route Retry remain. Named **TPO-inbox-team-68** same unit suite. |

## Builder chat-2 continuation — thread counterpart and mobile context

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-18 | PARTIAL — OPEN | `readTpoInternalConversation` projects counterpart name with a same-college user join and displays it in the detail header; existing Team list has preview, 100-row search and partial filters. Named **TPO-inbox-team-18** in `tests/unit/tpo-team-person-context-chat2.test.ts`. Object thread kinds, Asks/Decisions/@Me filters still absent. |
| TPO-inbox-team-31 | PARTIAL — OPEN | People now marks the current membership **You** in `tpo/team/page.tsx`; named **TPO-inbox-team-31** in the same test file. Five workload counts and away status require actual persisted data. |
| TPO-inbox-team-42 | PARTIAL — OPEN | Team detail provides native keyboard-operable **All conversations** back action for single-pane navigation; named **TPO-inbox-team-42** in same suite. Legacy split-master desktop layout and detail context not built. |

## Chat-2 continuation: first 25 originally OPEN gaps reviewed in severity/queue order

This is a **truthful disposition**, not a claim of 25 completed builds. Earlier source work predates this continuation; tests are written but not executed. Partial items remain OPEN until their complete legacy workflow and PostgreSQL acceptance exist.

| ID | Disposition | Evidence or remaining work |
| --- | --- | --- |
| TPO-inbox-team-15 | DONE | Everyone channel source and proposed persistence; named unit and DB09 tests; migration registration pending |
| TPO-inbox-team-07 | OPEN | Drive Discussion/Discuss handoff and request history need first-class route |
| TPO-inbox-team-10 | DONE | Legacy Messages subtitle; tpo-inbox-team-copy.test.ts |
| TPO-inbox-team-16 | OPEN | Typed object conversations for drives, companies and students absent |
| TPO-inbox-team-17 | PARTIAL — OPEN | 200-character topic schema/form and test; richer participant control absent |
| TPO-inbox-team-18 | PARTIAL — OPEN | Counterpart, preview, search and some filters; @Me/asks/decisions/object inbox absent |
| TPO-inbox-team-20 | PARTIAL — OPEN | Persistent follow/mute in proposed read receipts; object mention semantics absent |
| TPO-inbox-team-22 | OPEN | Assignable asks, lifecycle, due dates and Home integration absent |
| TPO-inbox-team-24 | OPEN | Edit-within-15-minutes and delete-message lifecycle absent |
| TPO-inbox-team-31 | PARTIAL — OPEN | You chip added; drives/companies/asks workload and away counts absent |
| TPO-inbox-team-33 | OPEN | Unowned assignments banner, safe reassign workflow and notification absent |
| TPO-inbox-team-36 | OPEN | Impact-aware teammate removal and work handover absent |
| TPO-inbox-team-39 | DONE | Preserved Team drafts, bounded friendly post, retry; named round2/round3 tests |
| TPO-inbox-team-44 | PARTIAL — OPEN | Scoped picker source and options test; batch/branch multi-select and searchable drive target missing |
| TPO-inbox-team-54 | PARTIAL — OPEN | From 42 scoped read state on page; cross-page unread badge/bell parity missing; shell note for chat-9 |
| TPO-inbox-team-60 | PARTIAL — OPEN | Bell read path improved but legacy informational event producers largely absent |
| TPO-inbox-team-09 | DONE | 4-second recruiter inbox focus refresh; named round2 test |
| TPO-inbox-team-13 | DONE | Phone cards and All conversations control; named round2 test |
| TPO-inbox-team-14 | DONE | Duplicate notifications screen canonical redirect; named round2 test |
| TPO-inbox-team-23 | OPEN | First-class decisions tagging, pin and filter absent |
| TPO-inbox-team-26 | OPEN | Object facts/asks/decisions context panel absent |
| TPO-inbox-team-27 | DONE | 30-second Team focus refresh; named round2 test |
| TPO-inbox-team-29 | OPEN | Rich targeted Team mentions/asks/assignments alert variants absent |
| TPO-inbox-team-30 | PARTIAL — OPEN | ?c/?m, ?filter, ?tab=members accepted; ?about and ?ask depend on unsupported object/ask records |
| TPO-inbox-team-34 | OPEN | Away interval and warnings missing |

Additional source-level closures this continuation: TPO-inbox-team-57, -62, -64, -65, -67, -68; partial improvements -32, -37, -42, -49; TPO-inbox-team-52 Delete confirmation and TPO-inbox-team-R04 paged listing reviewed but complete legacy acceptance still requires check.

## Chat-2 unit-failures-r1 repair (round 5)

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-R05 | DONE (source; tests unrun) | `tests/unit/tpo-inbox-team-round2.test.ts` now asserts per-member `read_through`, excluding own authored messages, and **followed and unmuted** unread count rather than the obsolete unqualified expression. `src/modules/placements/tpo-team-internal-read-service.ts` provides the actual behavior. |
| TPO-inbox-team-07 | PARTIAL — OPEN | `tests/unit/tpo-drive-tabs.test.ts` now asserts the actual seventh primary **Discussion** route; the Discussion feature remains scoped to the full conversation audit. |

## Chat-2 round 5 — Team read on open

| TPO-inbox-team-R05 | DONE (source; tests not run) | Explicit same-origin POST on Team detail open via `TpoTeamOpenRead`, JSON success support on acknowledgement route, and graceful manual Retry; named `TPO-inbox-team-R05` in `tests/unit/tpo-team-read-on-open-chat2.test.ts`. The read pointer remains separate from personal bell read state. |
| TPO-inbox-team-20 | PARTIAL — OPEN | Opening conversation clears per-thread unread through authorized POST (existing follow/mute survives), guarded failure shows manual retry. `tests/unit/tpo-team-read-on-open-chat2.test.ts` names `TPO-inbox-team-20`. Mentions/object subscription remains open. |

## Chat-2 round 5 — activity ordering and Team notices

| TPO-inbox-team-18 | PARTIAL — OPEN | Sorted limited Team inbox by latest actual message activity (college-scoped) and displayed IST timestamp, with existing search/preview; `tests/unit/tpo-team-activity-notices-chat2.test.ts` named `TPO-inbox-team-18`. Object/ask/decision filters remain. |
| TPO-inbox-team-29 | PARTIAL — OPEN | Private thread invitations and replies now include actor name and 120-character recipient-only preview; reply uses deep link to message; same named `TPO-inbox-team-29` test. Full TEAM_MENTION, TEAM_ASK, TEAM_ASK_DONE, TEAM_ASSIGNED require those first-class workflows. |
| TPO-inbox-team-R05 | DONE (source; tests unrun) | Old and `?m=` deep-linked Team alerts count and acknowledge with independently persisted read pointer. Named `TPO-inbox-team-R05` regression test in same suite. |

## Chat-2 round 5 — From 42 badge

| TPO-inbox-team-54 | PARTIAL — OPEN | `countUnreadTpo42Announcements` counts college-scoped visible unread notices beyond the first 100 and tabs show true global count only when read-receipt storage is registered; named `TPO-inbox-team-54` in `tests/unit/tpo-from42-unread-chat2.test.ts`. Shell sidebar and informational bell producer remain open (chat-9 shell owner). |
| TPO-inbox-team-R04 | PARTIAL — OPEN | Announcements continue paginated, and first-page unread badge now uses a separate authorized full count, not a per-page guess; same named test. Remaining author filtering and full-list acceptance pending. |

## Chat-2 round 5 — Team conversation rename

| TPO-inbox-team-17 | PARTIAL — OPEN | Existing 200-character create flow now supplemented by scoped, two-participant optimistic rename with guarded UI, explicit POST and named `TPO-inbox-team-17` tests in `tests/unit/tpo-team-rename-chat2.test.ts`. Multi-person participants, leave action and visibility policy remain open. |

## Chat-2 round 5 — Team inbox pagination

| TPO-inbox-team-18 | PARTIAL — OPEN | Team list now paginates beyond the old 100-row cap, preserves search/filter URL, selects latest activity descending with stable ID tie-break, and labels page-scoped filter counts truthfully; `tests/unit/tpo-team-inbox-paging-chat2.test.ts` (two `TPO-inbox-team-18` named tests). Other legacy thread-kind filters not built. |

## Chat-2 round 5 — Team message corrections

| TPO-inbox-team-24 | PARTIAL — OPEN | Scoped optimistic private-message edit (author only, first 15 min), delete tombstone, guarded UI and event-backed edited/removed indicators with explicit same-origin POST, `tests/unit/tpo-team-message-corrections-chat2.test.ts` tests named `TPO-inbox-team-24`. Newly mentioned recipients and ask cancellation need ask/mention persistence. |
| TPO-inbox-team-25 | PARTIAL — OPEN | Actual event-backed “edited” tag and “Message removed” UI now render with existing author names/day separators/alignment; same suite names `TPO-inbox-team-25`. Rich system-event lines remain. |

## Chat-2 round 5 — pinned decisions

| TPO-inbox-team-23 | PARTIAL — OPEN | Same-college participants can optimistically mark/unmark a persisted Team message as decision with audited state changes; the thread displays decision tags and a last-five “Decided:” strip, and guards retry with friendly errors. `tests/unit/tpo-team-decision-chat2.test.ts` names `TPO-inbox-team-23`. Conversation-level Decisions filter and cross-message context panel still pending. |

## Chat-2 round 5 — Conversation details

| TPO-inbox-team-26 | PARTIAL — OPEN | `TpoTeamThreadDetails` provides optional context with authorized counterpart/topic/date and real last-page decision count; no unsupported company or drive claims. Named `TPO-inbox-team-26` in `tests/unit/tpo-team-details-chat2.test.ts`. Object facts, people workload and open asks pending. |
| TPO-inbox-team-42 | PARTIAL — OPEN | Detail disclosure persists per-thread browser preference and folds on phones using responsive width; named `TPO-inbox-team-42` same test. Full desktop list/detail split remains open. |

## Chat-2 round 5 — Drive Discussion handoff

| TPO-inbox-team-07 | PARTIAL — OPEN | Drive-specific Discussion now links as `Discuss` to the persisted recruiter conversation, shows the last message preview and supports `?tab=discussion` legacy alias without relaxing scoped read; `tests/unit/tpo-drive-discussion-chat2.test.ts` names `TPO-inbox-team-07`. Change request quote/event lines remain to build in drive workspace. |

## Chat-2 round 5 — away intervals

| TPO-inbox-team-34 | PARTIAL — OPEN | Author-scoped away-until/back-now stored in proposed `placement_tpo_team_away` table, one-year bounded date and stale write checks, plus form and clear action. Proposed migration `docs/proposed-migrations/tpo-inbox-team-away-until.sql`, named test `TPO-inbox-team-34` in `tests/unit/tpo-team-away-chat2.test.ts`. The table must be registered by orchestrator before UI is writable; ask warnings not implemented. |
| TPO-inbox-team-31 | PARTIAL — OPEN | People cards show persisted away interval only if enabled and allow current member to update their own absence, never inferred from activity; same test names `TPO-inbox-team-31`. Five workload aggregates remain open. |

## Chat-2 round 5 — sequential review of the next 27 OPEN queue entries

Status is deliberately **PARTIAL** or **OPEN**, not DONE, until the complete legacy behavior and database tests are established. These IDs are the next 27 OPEN rows after the earlier round's IN-BRANCH dispositions, kept in original queue order.

| ID | Status | Specific current evidence or remaining work |
| --- | --- | --- |
| TPO-inbox-team-07 | PARTIAL | Drive Discussion handoff and message preview; request quotes/events missing |
| TPO-inbox-team-16 | OPEN | No persisted drive/company/student-scoped Team object conversations |
| TPO-inbox-team-17 | PARTIAL | 200-character create and renamed private thread; multi-person/leave/visibility outstanding |
| TPO-inbox-team-18 | PARTIAL | Latest-activity paging/search and initial filters; object/asks/decisions chips outstanding |
| TPO-inbox-team-20 | PARTIAL | Independent following/mute/read acknowledgement; mention subscriptions missing |
| TPO-inbox-team-22 | OPEN | Assignable asks, due dates and completion lifecycle not persisted |
| TPO-inbox-team-24 | PARTIAL | Author-only optimistic edit in first 15 min, delete tombstone; mention/ask side effects outstanding |
| TPO-inbox-team-31 | PARTIAL | You and real away status; workload counts/actions missing |
| TPO-inbox-team-33 | OPEN | Unowned drives/companies assignment workflows absent |
| TPO-inbox-team-36 | OPEN | Member removal and safe work handover absent |
| TPO-inbox-team-44 | PARTIAL | Scoped audience options and empty states; multi-select/picker parity missing |
| TPO-inbox-team-54 | PARTIAL | College-wide unread From 42 count; shell/bell variants outstanding |
| TPO-inbox-team-60 | PARTIAL | Bell actions and selected producers exist; legacy event set incomplete |
| TPO-inbox-team-23 | PARTIAL | Scoped decision toggle and pinned strip; inbox Decisions filter missing |
| TPO-inbox-team-26 | PARTIAL | Collapsible verified private-thread facts; object facts/asks missing |
| TPO-inbox-team-29 | PARTIAL | Named actor, 120-char preview, message deep link; ask/mention alerts missing |
| TPO-inbox-team-30 | PARTIAL | c/m/legacy members links; object about/ask entrypoints missing |
| TPO-inbox-team-34 | PARTIAL | Persisted self-away date and Back now proposed migration; ask warnings missing |
| TPO-inbox-team-37 | PARTIAL | Correct TPO/admin note and hides obsolete coordinators; college-admin membership policy missing |
| TPO-inbox-team-38 | OPEN | Non-TPO team-admin and college-admin private conversation authorization missing |
| TPO-inbox-team-51 | PARTIAL | Versioned edits to CTA/schedule/expiry; Tell them it changed not delivered |
| TPO-inbox-team-52 | PARTIAL | Confirmation and success message; downstream notice retraction not certified |
| TPO-inbox-team-59 | OPEN | Student notice audience/action/unread parity owned by student-facing flows |
| TPO-inbox-team-R02 | OPEN | Centralized TPO admin roles across Messages/Team/Announcements/bell pending |
| TPO-inbox-team-42 | PARTIAL | Mobile back and collapsible Details; split-panel desktop view pending |
| TPO-inbox-team-R04 | PARTIAL | 100-row pagination and full From 42 unread count; own-author filtering needs revision |
| TPO-inbox-team-R06 | OPEN | Historical college-wide bell feed for newly joined teammates missing |

The existing queue blocker TPO-inbox-team-08 remains provider-credential dependent; no other technical gap is treated as a provider blocker. The named tests in `tests/unit/tpo-inbox-team-round5-parity-review.test.ts` protect seven specific partial workflows without claiming end-to-end parity. Tests were authored, not executed by this lane.

- Round 5 review tally: **19 PARTIAL / 8 OPEN** across the 27 reviewed queue rows. TPO-inbox-team-34 also treats expired away status as absent for optimistic replace, guarded by the new `tpoEffectiveAwayUntil` unit case.

## Chat-2 2026-10-17 unit-failures-r1 refresh

| ID | Status | Evidence |
| --- | --- | --- |
| TPO-inbox-team-62 / TPO-home-33 | DONE (source, not yet run) | `tests/unit/tpo-home-33-live-header.test.ts` checks displayed server-snapshot unread matching, and `src/components/tpo/tpo-bell-panel.tsx` clears the optimistic mark-all revision when a newer server snapshot arrives. |
| TPO-inbox-team-61 / TPO-home-35 | DONE (source, not yet run) | `tests/unit/tpo-home-35-bell-open.test.ts` verifies guarded 12-second `apiFetch`, read POST, and no navigation after failure rather than obsolete `response.ok` branching. |
| TPO-inbox-team-54 | DONE (college-wide count source; other legacy aspects remain OPEN) | `tests/unit/tpo-notice-round4-verification.test.ts` checks persisted college-scoped total unread From 42 rather than obsolete page-only count. |

## Round 6 — decision inbox

| TPO-inbox-team-23 | PARTIAL — OPEN | Real per-conversation decision event projection (ignores later unmark/delete) and Decisions-count chip added in `src/modules/placements/tpo-team-internal-read-service.ts`, `src/modules/placements/tpo-team-conversation-filter-model.ts`, and Team page. `tests/unit/tpo-team-filter-round4.test.ts` has a named **TPO-inbox-team-23** regression. Mark-on-send still outstanding. |
| TPO-inbox-team-18 | PARTIAL — OPEN | Decisions chip added alongside previous Following/Unread/Topics, preserving scoped SQL and pagination; object/asks filters still absent. |

## Round 6 — author-list correctness

| TPO-inbox-team-R04 | DONE (source, tests not run) | `listTpoPlacementAnnouncements` defaults to authored notices, while an explicit **All team notices** switch preserves college colleague access and pagination scope. Named `TPO-inbox-team-R04` test in `tests/unit/tpo-team-notice-colleague-access-chat2.test.ts`. |
| TPO-inbox-team-57 | DONE (source, tests not run) | Colleague-managed notices remain accessible by the separate scoped view, with server-side persisted permission and version checks retained. Named `TPO-inbox-team-57` tests. |
