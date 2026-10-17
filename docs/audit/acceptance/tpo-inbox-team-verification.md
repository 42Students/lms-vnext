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
