# G2/G3 profile, settings and messaging clone audit — chat-11

Branch: `chatgpt/chat-11-b` · Owner: chat-11 · Started: 2026-10-19.

## Baseline and constraints

`chatgpt/chat-11-b` was fast-forwarded to `main` at `fa87ca9ad870d63fafab0200e8b6f4d16b568c58` before this work; the comparison was 0 commits ahead and 2,333 behind. Follow `docs/design/ui-clone-checklist.md` WORK STYLE and STRICT TICK RULE. This file records source inspection, **not** browser, typecheck, CI, or responsive runtime verification. Do not alter `src/components/ui/**`, the app shell, global tokens, page copy, business logic, API routes, or permissions.

Legacy sources read: `docs/design/legacy-styles/components___variables.scss`, `components___common.scss`, `components___button.scss`, `components___form.scss`, `components___notification-drawer.scss`, `components___learn-notifications.scss`; `docs/design/old-lms-pages.md`; `docs/design/old-lms-shell-spec.md`. Existing page inventory: `docs/orchestrator/ui-ux/pages-{admin,tpo,hr,learn,notifications}.md`. The legacy shell overrides the older asymmetric CTA in SCSS: primary buttons are #0a7c88/white, 36px high, 9px radius.

## Work queue

Items are in workflow order; `[ ]` means full STRICT TICK RULE evidence is **not** complete. The list is an initial path/name inventory from the repo's route inventories and initial source regex searches, with imported components added as inspected. This is **not** yet a repository-wide terminal grep.

- [ ] G2 / TPO profile: `src/app/(authenticated)/tpo/profile/page.tsx`.
- [ ] G2 / TPO settings: `src/app/(authenticated)/tpo/settings/page.tsx`, `after-college/page.tsx`, `blocked-dates/page.tsx`, `branding/page.tsx`, `job-types/page.tsx`, `notices/page.tsx`, `notifications/page.tsx`, `prep-readiness/page.tsx`, `public-link/page.tsx`, `public-page/page.tsx`, `recruiters/page.tsx`, `rules/page.tsx`, `season/page.tsx`, `see/page.tsx`, `team/page.tsx`, `templates/page.tsx`, `trusted/page.tsx`, plus error/loading/layout files as present.
- [ ] G2 / TPO editors: `src/components/tpo/tpo-my-notification-preferences-editor.tsx`, `tpo-optional-emails-editor.tsx`, `tpo-communication-settings-editors.tsx`, `tpo-team-forms.tsx`; `src/components/placements/tpo-settings-nav.tsx` and dependent setting editors from `docs/audit/ux/north-star-sweep-chat-11.md`.
- [ ] G2 / Super Admin: `src/app/(authenticated)/admin/settings/page.tsx`, `settings/auth/page.tsx`, `tenants/page.tsx`, `tenants/create/page.tsx`, `tenants/setup/page.tsx`, `colleges/[collegeId]/branding/page.tsx`, `colleges/[collegeId]/signin/page.tsx`, `colleges/[collegeId]/readiness/page.tsx`; imported tenant/branding/verification editors only.
- [ ] G2 / other profiles: `src/app/(authenticated)/hr/profile/page.tsx`, `college/college-profile/page.tsx`, `learn/profile/page.tsx`, `learn/profile/academic-record/page.tsx`, `learn/profile/completeness/page.tsx`, `learn/profile/verification/page.tsx`, `learn/my-placements/notification-preferences/page.tsx`, `teacher/profile/page.tsx`, `mentor/profile/page.tsx`.
- [ ] G3 / recruiter conversation list, detail and composer: `src/app/(authenticated)/hr/conversations/page.tsx`, `hr/conversations/[threadId]/page.tsx`, `hr/messages/page.tsx`, `hr/drives/[jobId]/messages/page.tsx`, `src/components/hr/recruiter-conversation-reply-form.tsx`, other imported messaging components.
- [ ] G3 / TPO communication: `src/app/(authenticated)/tpo/messages/page.tsx`, `tpo/messages/[threadId]/page.tsx`, `tpo/messages/notifications/page.tsx`, `tpo/notifications/page.tsx`, `src/components/tpo/tpo-inbox-search.tsx`, `tpo-team-message-actions.tsx`, `tpo-team-thread-details.tsx`.
- [ ] G3 / notification lists: `src/app/(authenticated)/notifications/page.tsx`, `hr/notifications/page.tsx`, `learn/notifications/page.tsx`, `learn/notifications/history/page.tsx`, `mentor/notifications/page.tsx`, `teacher/notifications/page.tsx`, `tpo/settings/notifications/page.tsx`, and `src/components/activity/learner-notifications-inbox.tsx`.

## Source-value checklist (pending exhaustive property-by-property proof)

| Item | Legacy value and location | vNext required location | Status |
| --- | --- | --- | --- |
| Outer canvas | 1 white canvas, #e5e9f0 border, 12px radius, 24px padding; `docs/design/old-lms-pages.md:5-11` | authenticated `PageCanvas`, not per-page nested cards | [ ] inspect every owned page |
| Page head | one row: 30px/600 #172033 title with inline grey subtitle and right actions, **no eyebrow**; `docs/design/old-lms-pages.md:6` | `PageHeader` on G2/G3 routes | [ ] inspect all routes/states |
| Text/link palette | $neutral-900 #1a1d21; $neutral-700 #54505d; $neutral-500 #6b7280; $teal-text #1a95a1; `components___variables.scss:12-38` | semantic shared text/link classes | [ ] inspect hover/focus/disabled |
| Separators | $neutral-200 #e5e9f0; `components___variables.scss:28-31` | semantic `border-border`, not per-row cards | [ ] row and list states |
| Notification hover/geometry | neutral card/list, $nd-radius 12px, $nd-radius-sm 8px, min target 44px, mobile breakpoint 767px; `components___notification-drawer.scss:8-28` | each notifications page and inbox item | [ ] exact SCSS rows, empty/read/unread/mobile |
| Controls | shared tokens inherit legacy focus, disabled and loading; old-LMS shell button 36px/9px/14px-650; `old-lms-shell-spec.md:23-29` | `Button`, `Input`, `Select`, `Textarea` and shared variants | [ ] per state/component, no raw visible controls |
| Responsive | `common.scss` mobile media max-width 767px; notification drawer same breakpoint, min tap 44px | phone and tablet for each owned screen | [ ] no browser measurements |

## G2/G3 STRICT TICK RULE

- [ ] G2 profile/settings/preferences (missing: exhaustive value rows with exact line references and all states, whole-repo raw-control/hex/overlay greps, phone/tablet proof, and readback per edit).
- [ ] G3 messaging/conversation/notifications (missing: exhaustive conversation-list/bubble/composer/notification detail rows and coverage greps, responsive proof, visual comparison).
- [ ] Source coverage: run `grep -rnE '<(button|select|input|textarea)([ >])' src/app/'(authenticated)' src/components --include='*.tsx'`, excluding hidden form inputs and authorized shared components; record full paths/counts for this owned inventory, plus `grep -rnE '#[[:xdigit:]]{3,8}|fixed inset-0|role="(alert)?dialog"' ...` and exemption reasons. GitHub source-regex sampling is not equivalent to a completed repository grep.

## Source-edit log

- Initial audit queue created before UI edits. Keep every item unticked until all four STRICT TICK RULE gates are met.

## Turn 1 source-edit checkpoint (2026-10-19)

**Commits before this checkpoint: 35** (= 1 initial inventory + 34 page edits). Every commit was created directly on `chatgpt/chat-11-b`, with a `[chat-11]` prefix. The page edits removed *only* the extra `PageHeader eyebrow="..."` presentation prop, except `hr/drives/[jobId]/messages/page.tsx`, which also removed a redundant duplicate `Button` import. Preserved each existing page's title, inline description, actions, forms, authorization, data, routes, and section order. Nothing under `src/components/ui/**` changed.

**Page-head value proof, limited to the one changed detail:**

| Property | Old LMS reference | vNext reference and checked result |
| --- | --- | --- |
| Head layout | `docs/design/old-lms-pages.md:6`: title + inline subtitle + right actions, no separate eyebrow | `src/components/ui/page-header.tsx:20-48`: one head row; `src/app/(authenticated)/hr/conversations/page.tsx:70-73` renders title + description without eyebrow |
| Canvas | `docs/design/old-lms-pages.md:5`: white, 12px radius, 1px #e5e9f0, 24px padding on #f1f4f9 | `src/components/ui/page-canvas.tsx:14-28`: shared canvas inherits tokens; remains owned by chat-17 and is not locally duplicated by these edits |
| Example settings head | `docs/design/old-lms-pages.md:6` | `src/app/(authenticated)/admin/settings/page.tsx:76-85`: `PageHeader` title, inline description, right action; eyebrow removed |
| Notification item geometry **not yet proven** | `docs/design/legacy-styles/components___notification-drawer.scss:8-27`: 12px panel, 8px small radius, 44px tap min, 767px breakpoint | **Pending** full list-item/hover/unread/read/mobile comparison across pages; cannot tick G3 |

**Readback/source-pattern check:** all **34 edited TSX files** fetched from the lane branch after their writes (17 + 17 files). Scoped regex equivalents of `grep -r` reported **0** remaining `eyebrow=`, **0** raw `<button>`, **0** raw `<select>`, **0** raw `<textarea>`, **0** literal CSS hex values, and **10** raw `<input>` elements (all hidden form fields in recruiter conversations/drive/notifications, not styled controls). Shared component opening/closing tag counts were unchanged during edits. The recruiter drive-messages page now has one import of `Button`. These results cover only the *34 changed sources*, **not** every G2/G3 page/component, nor full repo greps or full compile validation.

**Still open:** complete exact SCSS property/state tables for settings, profile, message bubbles, composer, row, unread, empty, error, focus, disabled; remaining imported-component sweeps; full repository grep with exemptions; phone/tablet/browser visual comparisons. Neither G2 nor G3 is eligible for a STRICT TICK RULE checkmark.

**Exact next source to inspect:** `src/app/(authenticated)/mentor/notifications/page.tsx` (then `src/components/activity/learner-notifications-inbox.tsx` and recruiter conversation composer).

### Concurrent-main synchronization and end-of-turn handoff

While this turn was editing, `main` advanced by 47 commits after the initial fast-forward. A path-level comparison showed three overlaps: `tpo/messages/page.tsx`, `tpo/settings/notifications/page.tsx`, and `tpo/settings/season/page.tsx`. Reconciled each to the latest main version, merged `main` **into the lane branch only** using PR #189 (merge commit `b149197988dd24832539c4cd5a16454ce7059b4c`), then removed legacy-incompatible eyebrow props again on the merged versions. Concurrent main edits were retained. No change was pushed to `main`, and no force update was used.

Final pre-handoff branch compare: **43 commits ahead, 0 behind** current `main` at `d915bd67b20838f496d2a5b25b4365e748a35dd5`; this ledger-update commit follows. Counting this audit update: **44 commits added to the lane branch this turn** (including synchronization commits). **34 distinct TSX pages changed** and one audit document; no shared-UI files edited. The full 34-page readback counted zero raw buttons/selects/textareas/eyebrow props/hex literals; 10 hidden form inputs are written exemptions. This remains a static sample, not whole-category coverage.

**Status:** G2 OPEN; G3 OPEN. Remaining high-priority work is to compare list/bubble/composer and settings state values with legacy SCSS, migrate leftover hand-rolled page controls, then run complete coverage/responsive proof. Resume **`src/app/(authenticated)/mentor/notifications/page.tsx`**.

## Turn 2 — G2/G3 pills, tabs, notification rows and preference toggles (2026-10-19)

Started from `main` at `b275ca07455d8eafa3650ce6eb3f352a481edafb` after fast-forwarding the lane branch (0 commits ahead, 903 behind before that fast-forward). **39 source commits** were written to `chatgpt/chat-11-b` before this audit checkpoint, all tagged `[chat-11]`. Codemod-migrated raw text inputs/selects/buttons/textareas were **not** manually migrated again. `src/components/ui/**` remains untouched.

### Value comparison: legacy notification filters and cards

This table is **per-property source evidence**, not whole-category certification. `docs/design/old-lms-pages.md` supplies the newer owner shell contract (notably the primary-button shade), while `components___learn-notifications.scss` defines legacy notification-specific geometry. Matching one row never ticks G2 or G3 by itself.

| Property or state | Exact legacy reference | Current vNext source reference | Source result |
| --- | --- | --- | --- |
| Notification pill min height | `docs/design/legacy-styles/components___learn-notifications.scss:90-100` = 44px | `src/components/activity/learner-notifications-inbox.tsx:124-131` = `min-h-11` (44px) | Matched |
| Notification pill radius | `components___learn-notifications.scss:28,90-99` = 8px | `learner-notifications-inbox.tsx:130`; `src/components/activity/notification-toolbar.tsx:57,64` = 8px | Matched |
| Notification pill font | `components___learn-notifications.scss:97-100` = 14px / 500 / no wrapping | `learner-notifications-inbox.tsx:130`; `notification-toolbar.tsx:57,64` = `text-sm font-medium whitespace-nowrap` (learner) | Matched for learner; toolbar links do not wrap under short labels |
| Selected notification pill text | `components___learn-notifications.scss:118-127` = white on solid primary | `learner-notifications-inbox.tsx:125-130` and `notification-toolbar.tsx:57,64` = shared `primary`/`text-on-primary` | Matched selected-state contract; owner uses #0a7c88 instead of original SCSS #26bac7 |
| Inactive notification pill | `components___learn-notifications.scss:90-114` = transparent / muted border and text, teal on hover | `notification-toolbar.tsx:57,64` = outlined, semantic `text-body`, teal hover | Pending exact hover opacity, initial fill and focus-ring values |
| Narrow-screen category overflow | `components___learn-notifications.scss:67-84` = nowrap, horizontally scrollable through 767px | `learner-notifications-inbox.tsx:122` = `overflow-x-auto`, wraps only from 768px | Matched source breakpoint/overflow; browser scroll behaviour not tested |
| Category gap | `components___learn-notifications.scss:59-64`, `$s1=8px` | `learner-notifications-inbox.tsx:122` = `gap-2` (8px) | Matched |
| Notification row radius | `components___learn-notifications.scss:28-29,183-194` = 12px | `src/components/activity/notification-list.tsx:118` = `var(--lms-canvas-radius)` (12px owner token) | Matched by token mapping; other variant row shares the same radius |
| Notification row content padding | `components___learn-notifications.scss:209-222` = 24px desktop / 16px at <=767px | `notification-list.tsx:107,118` = `p-4 min-[768px]:p-6` | Matched at both breakpoint classes |
| Notification row title responsive size | `components___learn-notifications.scss:247-261` = 16px desktop / 14px at <=767px; weight 600, line-height 1.35 | `notification-list.tsx:131` = `text-sm min-[768px]:text-base font-semibold leading-[1.35]` | Matched for titled rows; action-label intrinsic style still needs state review |
| Notification row snippet font and line height | `components___learn-notifications.scss:263-271` = 14px / 1.5 | `notification-list.tsx:144` = `text-sm leading-[1.5]` | Matched text geometry; legacy two-line clamping differs because vNext retains full message bodies |
| Notification row timestamp | `components___learn-notifications.scss:288-307` = 12px / 1.4 muted | `notification-list.tsx:145-147` = `text-xs leading-[1.4] text-muted-foreground` | Matched size/line-height; source grouping/metadata positions remain to compare |
| Notification dropdown list-item baseline | `docs/design/legacy-styles/components___notification-drawer.scss:192-220` = padding 12px 16px, radius 8px, neutral hover with 0.2s transition | `src/app/(authenticated)/hr/notifications/page.tsx:82` and `hr/conversations/page.tsx` recruiter rows = `px-4 py-3 rounded-[8px] duration-200 hover:bg-[var(--lms-neutral-50)]` | Matched geometry/timing; dropdown shadow, active/focus states remain open |
| Tenant setup tab underline | `docs/design/old-lms-pages.md:8` = teal underline | `src/app/(authenticated)/admin/tenants/setup/page.tsx:95-101` = 3px active underline, horizontally scrollable, focus outline; 44px phone / 36px desktop | Matched owner tab treatment at source level; original SCSS focus/hover proof pending |
| Checkbox/toggle persistence | Legacy form and notification preference intent; `components___notification-drawer.scss:16-25` references 44px tap targets | `src/components/tpo/tpo-my-notification-preferences-editor.tsx:44-52`; `tpo-optional-emails-editor.tsx`; `tpo-team-follow-controls.tsx` | Visual pressed/checked/disabled indicators updated; full exact state/property and responsive proof still open |

### Source changes and safe invariants

- Learner inbox filter buttons, notification-toolbar all/unread links, learner notification history filters, learner profile completeness pills and TPO recruiter inbox filter pills now use the same active/inactive visual grammar. Preserved existing URL filtering, query parsing, unread counts and click handlers.
- TPO navigation remains a grouped sidebar on desktop and is horizontally scrollable within each group on mobile. Its active item uses an existing 3px brand edge.
- TPO optional email/preference rows and mark-as-decision checkbox gained hover/focus and checked-state affordances; follow/mute/decision/counts-as-placed toggles now use the shared `primary` visual variant when selected and retain their `aria-pressed` or checked state. No mutation or permission logic changed.
- Notification list row typography/padding, recruiter conversation list rows and notification items, mentor error/empty presentation, Super Admin settings/tenant tabs, sign-in radio selected state and mobile minimum touch targets were adjusted without altering text or actions.
- Replaced hand-built “Waiting for you”, “Access ended”, recruiter change-request state and privileged high-impact policy chips with `StatusBadge` instances; shared UI component source was not changed.
- The recruiter message composer retained its unsent-draft protection, send validation and receipt check; only its action-button minimum phone height changed.

### Coverage, risk and continuation

The original audit file's STRICT TICK RULE remains binding. **Neither G2 nor G3 is ticked.** The samples above provide precise source values, but no complete per-state table for every owned page, no verified repository-wide grep count, no pixel diff/phone/tablet browser proof, and no TypeScript compiler/CI. GitHub source reads were used for target inspection and exact changed-token readback; they must **not** be represented as a complete terminal `grep` output.

- [ ] G2 profile/settings/preferences (missing: remaining controls/pills/tabs/overlays, complete state and mobile tables, whole-category grep output, live responsive proof).
- [ ] G3 conversation/inbox/composer/notifications (missing: message bubble and sender alignment source truth, accessible focus/hover/empty/loading proof across all portals, complete grep and responsive proof).

**Next file:** `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx` — examine message bubbles, sender alignment, timestamps and read markers against the legacy chat/message SCSS if present; avoid inventing unverified colours.

## Turn 3 — TPO/HR threads, profiles, tenant settings (2026-10-19)

### Execution and strict status

Fast-forwarded `chatgpt/chat-11-b` to `main` at `8b8c39571765204015de301807770b40f8387cd5` **before** source edits (0 ahead, 99 behind). Made **38 individually committed source edits** in this bounded turn and read back each edited file from the lane branch after its write. Original JSX open/close component tag sequences were compared before and after; no tag names were changed. A quote-pattern guard was applied to each edit. In particular, `src/app/(authenticated)/admin/tenants/page.tsx` was inspected with the upstream stray-quote repair present, changed only in `PageHeader` presentation and canvas-radius token usage, then reread: no stray quote before `className`.

**Do not tick G2 or G3 yet.** Source-value checks below do not constitute exhaustive portal coverage or browser pixel proof. No TypeScript build, app execution, CI, visual breakpoint screenshots, or runtime accessibility audit (owner direction). The codemod-converted shared form controls were left intact. No `src/components/ui/**`, authentication, business logic, permissions, or API files were modified.

### Targeted old-LMS value table (source level)

| Property | Legacy source value and file:line | Authored vNext file:line and outcome |
| --- | --- | --- |
| Page heading/secondary line | `docs/design/old-lms-pages.md:6`: one title, inline grey description, right actions, **no eyebrow** | `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:20,33`; `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx:36,71`; `src/app/(authenticated)/admin/tenants/page.tsx:23,31,42,51` now use a `PageHeader` without extra eyebrow; original descriptions/actions remain |
| Surface border and neutral rhythm | `docs/design/old-lms-pages.md:5,10`: white continuous canvas, 12px radius and 1px #e5e9f0 border; hairline rows | `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:44` uses `rounded-[var(--lms-canvas-radius)] border-border bg-surface`; `hr/conversations/[threadId]/page.tsx:116-118` uses `divide-border border-border` with semantic link/text classes |
| Notification/mobile message-card padding reference | `docs/design/legacy-styles/components___learn-notifications.scss:209-222`: 16px through 767px, 24px from 768px | `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:44` uses `p-4 min-[768px]:p-6`; text preserves whitespace, line breaks and wrapping at :50. **Conversation bubble-specific legacy counterpart was not established**; do not claim pixel match from the notifications reference alone |
| Message sender/read state | Old LMS reference unavailable in collected SCSS; avoid inventing a message-color token | `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:37-51` preserves sender-dependent `ml-auto`/`mr-auto`, relative chronology headings, timestamp in IST and conditional `Seen`; visuals beyond token/radius remain open |
| Notification-like row geometry | `docs/design/legacy-styles/components___notification-drawer.scss:192-220`: 12x16px padding, 8px corner, neutral hover and 0.2s transition | `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx:116-119` = `px-4 py-3`, semantic divider, `duration-200`; structurally a flat row rather than an invented chat color block |
| Small quick-reply controls | `docs/design/legacy-styles/components___learn-notifications.scss:90-100`: 8px radius, 14px/500, minimum 44px target | `src/components/tpo/tpo-recruiter-message-reply.tsx:68-71`: `rounded-[8px] text-sm font-medium min-h-11 min-[768px]:min-h-9`; action controls :83-91 keep 44px phone sizing |
| Link typography vs color | `docs/design/legacy-styles/components___variables.scss:11-38`: contextual teal and neutral semantic palette; old shell primary uses the owner override | `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:24,30` and `src/app/(authenticated)/tpo/messages/page.tsx` replace page-local `--lms-teal-deep` text overrides with `text-primary-text`. Eight such overrides were replaced in the TPO inbox page; no hard-coded hex was introduced |
| Shared button height | `docs/design/old-lms-shell-spec.md:23-26`: desktop 36px, radius 9px; legacy mobile touch rules 44px | `src/components/tpo/tpo-team-message-actions.tsx:39,45` uses `min-h-11 sm:min-h-9` for Save/Delete confirmation; existing shared Button variants preserved. The 640px `sm` breakpoint is **not identical** to the notifications 767px rule; remaining discrepancy is open |
| Readiness/profile card radius | `docs/design/old-lms-pages.md:5,11`: 12px separate cards only for independent objects | `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx:187,258,267` and `src/app/(authenticated)/learn/profile/page.tsx` replace local 12px fallback radius duplication with the canonical `--lms-canvas-radius` semantic token |
| Pages with no eyebrow | `docs/design/old-lms-pages.md:6` | TPO settings (season, prep-readiness, branding, notifications, recruiters, rules, etc.), Super Admin tenant directory/create/setup/settings/auth/readiness/signin/branding, recruiter profile/notifications, college profile and learner notification history were source-aligned in this pass |

### Verification and caveats

- All 38 source writes returned commit IDs and were followed by exact fetch/readback equality checks. Tag-name sequence guard stayed equal across each edit. No raw form-control conversions were attempted; no new manual modal/table markup was introduced.
- Rechecked `src/app/(authenticated)/admin/tenants/page.tsx:50-98`, `tpo/messages/[threadId]/page.tsx:19-55`, `hr/conversations/[threadId]/page.tsx:36-130` and other core surfaces: no literal hex in sampled source, no remaining `eyebrow=` on sampled modified page heads, and no stray quote preceding `className`. These are **scoped source inspections**, not a full repository grep.
- Existing route guards, database requests, permission checks, sender identities, message chronology, read-state logic, 4,000-character validation, reply receipts, unsent draft warnings, notification filters and form submissions remain unchanged.
- **Open:** actual old LMS message/chat bubble SCSS or browser reference, exhaustive per-state typography/spacing for all G2/G3 screens, focus/hover/disabled loading comparisons, matching mobile breakpoints on all controls, whole-repo grep with exceptions, responsive screenshots at 320/360/390/768/1280px and pixel checks. Neither category qualifies for a strict checkbox.
- **Next source:** `src/app/(authenticated)/tpo/settings/notifications/page.tsx` — remaining notice/preference rows and filter/pagination value comparison to `components___notification-drawer.scss:192-245`; then related imported TPO notification controls.
