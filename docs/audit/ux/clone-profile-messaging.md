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

## Turn 4 — all-portal profile/settings/message/notification value pass (2026-10-19)

**Branch baseline:** fast-forwarded `chatgpt/chat-11-b` from 0 ahead / 267 behind to `main` at `3a77aebd651756d5a16b9fea375ffc276fa4404b` **before editing**. Added 39 source commits tagged `[chat-11]` in this bounded turn, plus this one audit commit. Before this audit commit the branch comparison was **39 ahead, 0 behind**, covering **35 distinct source files**. No edits in `src/components/ui/**`, no manual re-migration of codemod-controlled raw button/select/input/textarea elements, and no CI, typecheck, app execution or browser screenshots.

### Value-by-value source comparison

| Visual property and state | Exact legacy reference | Source in lane after edit | Current verdict |
| --- | --- | --- | --- |
| Filter pill geometry | `docs/design/legacy-styles/components___learn-notifications.scss:90-105`: 44px height, 8px radius, 14px font, weight 500, 8px vertical/16px horizontal padding, nowrap, 0.15s color transition | `src/components/activity/notification-toolbar.tsx:52-68` = `min-h-11 rounded-[8px] px-4 text-sm font-medium whitespace-nowrap duration-150`; `src/components/activity/learner-notifications-inbox.tsx:122-133` category controls; `learn/profile/completeness/page.tsx:47-58` filter links | Geometry/transition matched in source; all hover/focus colors not pixel-verified |
| Solid checked, outlined unchecked | `components___learn-notifications.scss:107-127` uses opaque brand fill + white text for active and transparent neutral with brand hover for inactive; owner shell CTA override takes precedence on exact brand hue | `notification-toolbar.tsx:57,64`, `learner-notifications-inbox.tsx:125-150`, TPO my-preference editor :45, optional-emails editor :50, sign-in radio editor :56 | State mapping matched by shared variant/tokens; downstream style override unresolved |
| Mobile horizontal pill filters | `components___learn-notifications.scss:67-84`: overflow-x scroll, nowrap through **767px**, wrap from **768px**, 8px gap | `notification-toolbar.tsx:52-64`, `learner-notifications-inbox.tsx:122`, `learn/notifications/history/page.tsx:54-63`, `tpo/messages/page.tsx:252-262`, `learn/profile/completeness/page.tsx:47-55` use `min-[768px]` boundaries | Source breakpoint matched; no rendered phone/tablet proof |
| Notification item | `docs/design/legacy-styles/components___notification-drawer.scss:192-220`: 8px radius, 12x16px padding, neutral hover, 0.2s transition; `components___learn-notifications.scss:209-222`: full record inner area 16px phone /24px desktop | `src/components/activity/notification-list.tsx:107-119,131-147,159-180` preserves desktop vs phone padding, labels, hover, and 44px phone open/read actions; `hr/conversations/[threadId]/page.tsx:116-130` shows semantic hairline rows | Sampled rows geometrically close; differing record/card/list structures remain open |
| Notification preferences and form choices | `components___notification-drawer.scss:17-25`: 12px panel, 8px compact radius, minimum target 44px; `components___learn-notifications.scss:90-127` checked/hover patterns | `src/components/tpo/tpo-my-notification-preferences-editor.tsx:44-52`, `tpo-optional-emails-editor.tsx:50-57` now dynamically fill selected rows `bg-primary-subtle`, unchecked `hover:bg-surface-subtle`; `src/components/admin/college-signin-method-form.tsx:54-64` disables hover when locked | Visual state distinctions inspected; not a complete checkbox or radio focus/disabled pixel proof |
| Page canvas and headings | `docs/design/old-lms-pages.md:5-6`: 12px single white canvas with 1px #e5e9f0 border, 24px padding; page head title 30px/600 #172033 with inline subtitle/actions, **no eyebrow** | Existing shared `PageHeader` retained on G2/G3 routes; profile/settings shell unchanged. `admin/tenants/page.tsx` remains on the upstream fixed JSX; semantic link and radius values improved | Source contract aligned where touched, but full all-route audit still open |
| Touch min across messages | `components___notification-drawer.scss:22,31-33`: 44px minimum; `components___learn-notifications.scss:11,95` 44px and 767px boundary | `src/components/tpo/tpo-team-follow-controls.tsx:29-36`, `tpo-team-forms.tsx:79-169`, `tpo-team-message-actions.tsx:28-47`, `teacher/notifications/page.tsx:97-111`, `mentor/notifications/page.tsx:116-185`: `min-h-11 min-[768px]:min-h-9` on changed controls | Matched cited notification mobile sizing in source; standalone TPO chat legacy spec missing |
| Legacy neutral hover and keyboard focus | `components___notification-drawer.scss:204-222`: neutral hover + visible outline; `old-lms-pages.md:5` neutral 1px card border | `tpo/settings/notifications/page.tsx:75,201,283,296` link controls use semantic primary border/fill/focus; `admin/tenants/page.tsx:54-93` canonical radius; Super Admin branding/sign-in setup back links now show focus and hover | Matched affordance intent but exact computed CSS not audited |
| High-impact indicator | `old-lms-pages.md:6`: status shown as compact colored pills | `src/components/admin/tenant-settings-editor.tsx:2,54-56` renders conditional `StatusBadge tone="warning"` rather than suffix text. Label and field identity preserved | Shared component used; exact tag size awaits runtime proof |
| Dynamic class/selected pressed states | `learn-notifications.scss:118-127` checked pill color; shell/notification SCSS active states | `tpo-team-decision-toggle.tsx:26-27`, `tpo-team-follow-controls.tsx:28-35`, `tpo-team-thread-details.tsx:25-27`, `college-signin-method-form.tsx:56-58` tie active state to data/ARIA; no mutation logic touched | Source-checked; all active/disabled/focus combinations not exhaustively tested |

### Readback and strict-tick blockers

Every source update in this turn was followed by a GitHub fetch from `chatgpt/chat-11-b` and an **exact full-content equality check** against the intended updated text. The source edit loop checked unchanged component opening/closing tag sequences and rejected the malformed `" className` pattern. A targeted re-read of the previously broken `src/app/(authenticated)/admin/tenants/page.tsx` confirmed the upstream repair, no stray double quote, and the page's unchanged opening/closing JSX tag names. This is a **static write/readback verification only**, not a compiler or runtime proof. The latest branch compare immediately before this audit commit was 39 ahead / 0 behind `main`.

- [ ] **G2 remains OPEN**: profile/settings/preference pages across all roles still need complete exhaustive computed value/state comparison, all owned imported-component and dynamic-class screens, full greps, actual phone/tablet pixel checks.
- [ ] **G3 remains OPEN**: thread bubble sender colors and spacing still lack a matching legacy chat source; unread/disabled/failure/focus/read-state variants, notification item and modal geometry, full greps and responsive browser measurements remain incomplete.
- [ ] **No runtime claim**: no CI, typecheck, app run, screenshot, screenshot-diff, or browser accessibility verification was performed. Do **not** tick these categories until the `docs/design/ui-clone-checklist.md` STRICT TICK RULE gates are met.

**Exact next source:** `src/app/(authenticated)/hr/conversations/page.tsx` — recruiter general-thread/detail/notification-preview parity, then `src/app/(authenticated)/hr/notifications/page.tsx` and `src/components/admin/tenant-settings-editor.tsx` focus/disabled/spacing state proof.

## File-by-file Work queue — completed static source packages (2026-10-19)

**Meaning of [x] in this subsection:** source-layer migration and scoped static readback complete — shared page head where rendered, shared controls for visible inputs, semantic palette, pill/selected-state judgement, card-in-card review, and shared state or explicit route-error fallback. These ticks **DO NOT** certify the four-part STRICT TICK RULE: no rendered screenshot, pixel diff, complete repo grep, or full responsive browser audit was performed. Therefore the original category-level G2/G3 items above remain **[ ]**. This split avoids presenting inspected JSX as verified visual parity. The source scan tested raw visible controls, literal UI hex, standalone h1, duplicate PageHeader eyebrows, rounded-full/border-b-2/aria-pressed judgment cases. Hidden POST form inputs, redirects and domain-owned brand color values are justified exceptions.

### G2/G3 routes — static source-pass complete (52)

- [x] `src/app/(authenticated)/account/security/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/profile/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/season/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/rules/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/branding/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/recruiters/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/team/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/trusted/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/after-college/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/job-types/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/notices/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/public-link/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/public-page/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/see/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/settings/templates/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/messages/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/tpo/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/hr/profile/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/hr/conversations/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/hr/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/profile/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/profile/academic-record/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/profile/completeness/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/profile/verification/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/profile/data-access/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/notifications/history/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/college/profile/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/college/college-profile/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/college/branding/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/teacher/profile/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/teacher/profile/details/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/teacher/profile/contacts/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/teacher/profile/teaching/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/teacher/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/mentor/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/notifications/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/settings/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/settings/auth/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/tenants/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/tenants/create/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/tenants/setup/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` — source header/control/token/state scan; imported editor separately checked where owned

### Alias and redirect routes — no independent page UI (6)

- [x] `src/app/(authenticated)/tpo/settings/page.tsx` — redirect/re-export; real rendered target audited separately
- [x] `src/app/(authenticated)/tpo/messages/notifications/page.tsx` — redirect/re-export; real rendered target audited separately
- [x] `src/app/(authenticated)/hr/messages/page.tsx` — redirect/re-export; real rendered target audited separately
- [x] `src/app/(authenticated)/recruiter/profile/page.tsx` — redirect/re-export; real rendered target audited separately
- [x] `src/app/(authenticated)/recruiter/messages/page.tsx` — redirect/re-export; real rendered target audited separately
- [x] `src/app/(authenticated)/mentor/profile/page.tsx` — redirect/re-export; real rendered target audited separately

### Imported editors, notification lists, composers and controls — source-pass complete (49)

- [x] `src/components/tpo/tpo-after-college-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-blocked-dates-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-builtin-job-types-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-job-types-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-prep-readiness-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-company-visibility-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-inbox-search.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-rename.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-ask-panel.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-away-form.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-follow-controls.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-message-actions.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-open-read.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-search.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-assign-unowned.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-handover.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-company-team-composer.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-company-team-conversation.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-my-notification-preferences-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-optional-emails-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-communication-settings-editors.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-custom-job-type-placed.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-decision-toggle.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-thread-details.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-team-forms.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/tpo/tpo-recruiter-message-reply.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/recruiter-conversation-reply-form.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/recruiter-conversation-read-control.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/hr-notification-read-button.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/recruiter-display-name-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/recruiter-designation-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/recruiter-profile-details-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/hr/recruiter-profile-access.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/admin/college-signin-method-form.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/admin/tenant-settings-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/admin/tenant-settings-other-keys.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/admin/college-branding-form.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/admin/college-logo-uploader.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/people/faculty-profile-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/people/faculty-profile-text-section.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/people/faculty-profile-skills.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/people/faculty-profile-metadata.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/people/faculty-profile-repeatable.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/placements/learner-placement-notification-settings.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/placements/tpo-settings-nav.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/activity/notification-list.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/activity/notification-toolbar.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/activity/learner-notifications-inbox.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry
- [x] `src/components/college/college-admin-profile-editor.tsx` — inspected shared controls, state-dependent styles, semantic colors, and source geometry

### Remaining category-level checks (not falsely ticked)

- [ ] Full G2 browser proof: 320/360/390px phone, 768px tablet, 1280px desktop, complete focus/hover/disabled/saved/empty/error/loading states; full-property values across all owned and shared controls.
- [ ] Full G3 browser proof: real legacy chat bubble reference, sender alignment/color/spacing, read marker and composer states, notification overlay and menu focus, receipt handling and responsive interaction.
- [ ] Complete repository grep for all portals and generated CSS with documented exemptions (scoped GitHub source-regex scans are not terminal grep or compiled class inspection).
- [ ] Exact screenshot/pixel comparison against the legacy local stack; shared UI component runtime not changed or tested.

**Exceptions:** `hr/conversations/page.tsx` (6 raw hidden form inputs) and `hr/notifications/page.tsx` (2 hidden fields) use hidden request parameters, not user-visible raw controls. `tpo/settings/branding/page.tsx` renders persisted brand colors as data (not invented CSS literals). `src/components/admin/college-branding-form.tsx` retains literal default sample swatch values (`#26BAC7` and placeholder `#1A95A1`) because those are actual editable branding data, not styling tokens. `src/components/hr/recruiter-notification-bell.tsx` has a circular count bubble, which is not a hand-rolled tab/filter control. Link-based nav (e.g. faculty profile anchor jumps) is not semantically a Tabs widget; selected persistent Boolean settings instead use shared checked controls and semantic active tints. Core `src/components/ui/**` is outside lane ownership.

## Full-tree route discovery addendum (2026-10-19)

Unlike the initial route-name inventory, this pass read the individual authenticated portal Git trees recursively (account, admin, college, HR, learner, mentor, recruiter, teacher, TPO, activity, teach and superadmin). The matched paths included the following additional *settings* and alias surfaces, omitted from the initial Work queue. File source migrations/readbacks are checked separately from the still-open browser STRICT TICK RULE.

- [x] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx` — removed extra PageHeader eyebrow; shared StatusBadge and one-canvas sections already present.
- [x] `src/app/(authenticated)/college/attendance/settings/page.tsx` — PageHeader and shared control path, semantic link color/radius, mobile target.
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx` — PageHeader and shared placement controls, mobile action size.
- [x] `src/app/(authenticated)/admin/placements/job-settings/page.tsx` — delegated read-list route; imported `AdminScopedReadPage` owns UI.
- [x] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx` — delegated detail route; imported `SuperAdminPlacementDetailView` owns UI.
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx` — zero-UI re-export of audited HR drive-messages route.
- [x] `src/components/attendance/college-attendance-policy-form.tsx` — removed nested card wrapper; maintained shared form inputs, validation and explicit audit actions.
- [x] `src/components/placements/super-admin-published-drive-edit.tsx` — shared Input/Textarea/Button with 44px phone /36px desktop controls.
- [x] `src/components/placements/college-legacy-drive-settings.tsx` — inspected delegated college drive settings source; shared controls, no raw visible fields or literal UI hex.

The recursively listed `college/contacts/**`, `teacher/contacts/**`, and `mentor/contacts/**` directories are **people directories/legacy mentor redirects**, not personal profile, notification preferences or message/chat screens; their appearance belongs to the appropriate contacts/people lane, so this G2/G3 checklist does not silently certify them. `admin/placements/job-settings/page.tsx` and detail delegate rendering to shared admin components; source-level route pass does not independently certify those imported components.

### Additional exact property lines and source readback

| Legacy evidence | Current source value | Static result |
| --- | --- | --- |
| `docs/design/old-lms-pages.md:5` — one white 12px canvas with hairline dividers; no card-in-card | `src/components/attendance/college-attendance-policy-form.tsx:89-94` now `space-y-6 border-b border-border pb-5` rather than nested white bordered card; `src/components/people/faculty-profile-text-section.tsx:38`, `faculty-profile-skills.tsx:31`, `faculty-profile-metadata.tsx:33` use section divider instead of nested white cards | Matched page-level source structure; independent records retain their own borders |
| `docs/design/legacy-styles/components___learn-notifications.scss:11,90-100` and `components___notification-drawer.scss:22,31-33`: mobile tap minimum 44px; 8px compact corner | `src/components/placements/super-admin-published-drive-edit.tsx:49-59` shared controls via `min-h-11 w-full min-[768px]:min-h-9`; `src/components/tpo/tpo-inbox-search.tsx:27` uses the same height while inherited shared radius remains intact | Static property matched |
| `docs/design/old-lms-pages.md:6`: one PageHeader title/subtitle/actions, no eyebrow | `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:22`, `src/app/(authenticated)/college/attendance/settings/page.tsx:31-39` | Static heading source aligned |

**Expanded inventory status:** 52 original rendered route entries + 6 aliases + 49 imported component source-pass checkboxes + 9 cross-portal route/component additions above. Exactly checked source reads/editing do **not** satisfy complete portal greps, a real browser, phone/tablet screenshots, or strict G2/G3 pixel acceptance. The original G2 and G3 source-value checklists remain unchecked pending those gates.

**Next files after this inventory:** `src/components/placements/college-legacy-drive-settings.tsx` imported settings interaction detail, `src/components/admin/admin-scoped-read-page.tsx` delegated settings list, and `src/components/admin/super-admin-placement-detail-view.tsx` delegated detail state/readiness. Do not mark these imports visually certified without crosschecking their parent route source and actual rendered output.

## Final judgement-case source checkpoint (2026-10-19)

The most recent source sweep covered previously omitted controls and resolved the one concurrent merge conflict without force-pushing. `main` independently updated `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx` to remove the older shared tabs integration; the **newer main file was restored verbatim** on the lane branch before internal PR #194 merged main into `chatgpt/chat-11-b`. The lane was subsequently verified **0 commits behind main**. No source content was pushed to main in that merge; the PR base was the lane branch.

### Final imported-control source-pass ticks

- [x] `src/components/auth/device-list.tsx` — shared Button/StatusBadge, flat neutral separators, two device sign-out controls with 44px mobile /36px desktop target; no raw visible controls or UI hex.
- [x] `src/components/hr/recruiter-notification-bell.tsx` — 44px bell trigger and notifications links; unread-count circle is a badge, not a fake tab. Shared buttons, list action links and existing accessibility semantics preserved.
- [x] `src/components/tpo/tpo-company-team-composer.tsx` — shared Textarea/Button, semantic `text-error`, 44px mobile submit, existing save/error states unchanged.
- [x] `src/components/tpo/tpo-company-team-conversation.tsx` — corrected primary “Save edit” control that previously forced link styles, normalized message row radius to canvas token; retained sender/date/read actions and real message record boundaries.
- [x] `src/components/admin/super-admin-placement-detail-view.tsx` — shared PageHeader without duplicate eyebrow, shared StatusBadge, 44px mobile detail links and flat fact rows.

**Static value proof:** `docs/design/legacy-styles/components___notification-drawer.scss:22,31-38,192-220` defines 44px tap target, 8px compact radius, 12px/16px list padding and 0.2s neutral hover. `src/components/hr/recruiter-notification-bell.tsx:46-81`, `src/components/auth/device-list.tsx:60-107`, `src/components/tpo/tpo-company-team-composer.tsx:53-65` and `src/components/tpo/tpo-company-team-conversation.tsx:167-210` contain updated semantic colors and responsive target styling. Persistent message action state, consent, draft and permission logic were not changed. User-entered branding color strings remain data values, never repainted by the global UI tokens.

**Verification:** each edited file was fetched after writing and compared byte-for-byte with the intended source; JSX tag-name sequences were unchanged except explicit opening+closing refactors (college profile `main→div`, faculty Card→section, learner data-access `main→div`, author role span→shared Badge). All scoped edits were checked against the previous stray `" className` typo pattern. These facts **do not** imply a successful compiler, CI, live source grep, runtime responsive check, or pixel diff.

**Outstanding prerequisites for a truthful total-area DONE:** (1) measure actual computed values and screenshots at multiple screen sizes for each G2/G3 portal, (2) compare against a genuine legacy messaging/chat-bubble reference and record missing source, (3) execute all remaining raw-control/overlay/hex repo-wide greps and review exemptions, and (4) inspect action focus/hover/disabled/loading/success/error states with live data. Original G2/G3 category acceptance remains [ ] until those checks can actually be performed, despite the individually checked static source packages.

## Replacement lane checkpoint — 2026-10-19, G2/G3 mobile interaction boundary

**Branch synchronization:** on resuming this oversized lane, GitHub compare returned `main...chatgpt/chat-11-b` **0 ahead / 638 behind**. The existing lane head was an ancestor of current main; the lane branch was **fast-forwarded non-forcibly** to `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0`. No changes were made to `main`. After the source edits, a fresh comparison returned **31 ahead / 0 behind**, with **29 net changed source files**. All commits were written only to `chatgpt/chat-11-b` and prefixed `[chat-11]`. No tests, app execution, typecheck or CI were run.

**Defect:** multiple G2/G3 pages/editors used `min-h-11 sm:min-h-9`. At the Tailwind `sm` breakpoint (640px), their targets became 36px even though the old LMS notification/mobile rules remain in effect through 767px. Other links used `min-h-9 min-[768px]:min-h-9`, never reaching the 44px minimum on phones.

| Property | Old LMS proof | Current vNext source contract | Status |
| --- | --- | --- | --- |
| Mobile minimum action height | `docs/design/legacy-styles/components___notification-drawer.scss:21-24,31-33`: `$nd-touch-min: 44px`; `components___learn-notifications.scss:90-100`: 44px filters | `min-h-11` = 44px on touch-sized screens in changed routes/editors | Source geometry corrected; runtime not verified |
| Legacy mobile/desktop transition | `components___notification-drawer.scss:23,87-92,355-360`: mobile through 767px; `docs/design/old-lms-shell-spec.md:23-26`: desktop control 36px | `min-[768px]:min-h-9` = 36px starting at 768px. Replaced the conflicting `sm:min-h-9` selectors only in owned G2/G3 sources | Correct breakpoint in authored source; computed CSS still open |
| Full-page learner notification row (not the dropdown) | `docs/design/legacy-styles/components___learn-notifications.scss:28-29,209-222`: 12px radius, 16px mobile padding and 24px desktop padding | `src/components/activity/notification-list.tsx:107-119`: pre-existing canvas-radius token and `p-4 min-[768px]:p-6` retained | A temporary overgeneralization from the *dropdown* 8px row rule was reverted in a separate commit; resulting source was read back |
| Notification management action | `notification-drawer.scss:21-24`: 44px minimum mobile tap | `src/components/activity/learner-notifications-inbox.tsx:163,181`: mark-all and retry actions now `min-h-11 min-[768px]:min-h-9`; `learn/notifications/history/page.tsx:47,91`: back/return links use same pattern | Static readback passed; modal buttons/shared kit and keyboard states still need runtime proof |

**Completed source-only edits (29 net files; 87 breakpoint/height occurrences).** This is a list of reviewed source patches, **not** a claim that G2/G3 pass STRICT TICK RULE. All edited files were reread from the lane branch with intended text equality (for the seven-route batch, fresh-source pattern readback confirmed zero old selectors and the expected new selectors). JSX opening/closing tag names and control logic were not changed.

- Learner notifications/profile: `src/app/(authenticated)/learn/notifications/history/page.tsx`; `src/components/activity/learner-notifications-inbox.tsx`; `src/app/(authenticated)/learn/profile/page.tsx`; `learn/profile/academic-record/page.tsx`; `learn/profile/completeness/page.tsx`; `learn/my-placements/notification-preferences/page.tsx`.
- TPO settings routes: `src/app/(authenticated)/tpo/settings/{rules,notifications,recruiters,team,trusted,notices,templates}/page.tsx`.
- TPO settings/messaging editors: `src/components/tpo/{tpo-my-notification-preferences-editor,tpo-optional-emails-editor,tpo-communication-settings-editors,tpo-team-search,tpo-team-handover,tpo-team-away-form,tpo-team-assign-unowned}.tsx`.
- HR messaging/notification controls: `src/components/hr/{recruiter-conversation-reply-form,hr-notification-read-button}.tsx`; `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`.
- Super Admin: `src/app/(authenticated)/admin/settings/page.tsx`; `admin/tenants/page.tsx`; `admin/tenants/create/page.tsx`; `src/components/admin/college-signin-method-form.tsx`.
- Shared notification route and faculty profile editor: `src/app/(authenticated)/notifications/page.tsx`; `src/components/people/faculty-profile-skills.tsx`.

**Verification scope:** source reads were carried out through the GitHub connector. A GitHub code-search sample for `sm:min-h-9` returned its first 80 matches, many outside this lane; that is **not** an exhaustive grep of `src` or a count of remaining violations. No browser breakpoint measurements, focus/hover/loading screenshots, compiled CSS inspection, full-repository greps or TypeScript compilation occurred. No changes were made to `src/components/ui/**`.

- [ ] **G2 strict acceptance** — still missing exhaustive property/state tables for every page and imported editor, exact full-repository grep+exemptions, phone/tablet visual/runtime proof.
- [ ] **G3 strict acceptance** — still missing authentic legacy message-bubble source/visual comparison and all focus/disabled/read/sent/empty/loading states, full grep+exemptions, real phone/tablet/pixel proof.
- [ ] **Next targeted source scan:** `src/components/people/faculty-profile-metadata.tsx`, then `src/components/people/faculty-profile-repeatable.tsx`, `src/components/profile/learner-skill-catalog-input.tsx`, and `src/components/profile/learner-verification-submit.tsx`. Complete the rest of the G2/G3 imported-profile list before claiming category coverage.

## Replacement lane continuation — profile/settings source files (2026-10-19)

**18 source files closed for this focused source-level batch** (not category-level STRICT TICK RULE). GitHub readback verified every resulting source write on `chatgpt/chat-11-b`. All edited JSX component tag names, form state, request payloads, validation, submit/read/confirm handlers, permissions, message chronology, and screen copy were retained. No `src/components/ui/**` files were edited. Tests, typecheck, CI, browser and legacy live screenshots were not run.

### Measured legacy values used in this batch

| Source property | Exact legacy source | Local vNext source result |
| --- | --- | --- |
| Mobile action target | `docs/design/legacy-styles/components___notification-drawer.scss:21-24,31-33`: `$nd-touch-min: 44px`; `components___learn-notifications.scss:10-12,90-102`: 44px and 14px/500 filter action | Owned interactive actions and inputs now use `min-h-11` (44px in Tailwind spacing) when on narrow screens. The metadata Clear search button uses `rounded-[8px]`, `text-sm font-medium` and a minimum 44px touch target. |
| Responsive switch | `docs/design/legacy-styles/components___notification-drawer.scss:23,89-92,355-360` and `components___learn-notifications.scss:10,64-84`: mobile rules through 767px; desktop starts at 768px | Changed responsive action height classes now use `min-[768px]:min-h-9` (36px). Faculty metadata, repeatable records, faculty text sections and recruiter details switch to two-column layouts at 768px rather than 640px. |
| Desktop action size | `docs/design/old-lms-shell-spec.md:24-27`: button and search/control height 36px; 9px outer radius; primary 14px/650 | Shared `Button`/`Input`/`Select` inherit global tokens at desktop. Explicit `min-[768px]` overrides are added only to avoid prematurely shrinking at 640px. |
| Hover/active/focus/disabled | `docs/design/legacy-styles/components___form.scss:14-23` and `components___learn-notifications.scss:101-127`: mouse focus suppression vs keyboard-visible focus; selected, hover and disabled treatments | Existing shared `Button`, `Input`, `Select`, `Textarea` classes and state props are retained, not hand-rolled. Static source matches the shared API; actual computed hover, active, focus-visible, disabled, invalid, pending and empty states still await rendered verification. |
| Existing page composition | `docs/design/old-lms-pages.md:5-6`: one main white canvas, no duplicate outer card, page-specific sections preserved | These changes target inner form controls, not the authenticated canvas or page header. No new nested page canvases, custom modals, or page content changes. |

### Per-file source-value / scoped responsive evidence

All file:line references below are for `chatgpt/chat-11-b` after this batch. "Completed" means a source migration and readback only.

| Completed source file | Control / layout source lines and inspected value | Source-level mobile/tablet proof |
| --- | --- | --- |
| `src/components/people/faculty-profile-metadata.tsx` | :38,42,47,51,54,63,71-72 — search, clear, fields, remove, add, discard/save all 44px mobile; :42 clear action 8px pill radius | :45 stays one-column through 767px; `min-[768px]:grid-cols-[1fr_2fr_auto]` on tablet/desktop |
| `src/components/people/faculty-profile-repeatable.tsx` | :72,76,84,105,115-131,144-150 — search, collapse, field input, reorder, duplicate/remove, add, save, discard now mobile touch-safe | :82-89 fieldset padding and 2-column form begin at 768px; phone has a single column |
| `src/components/profile/learner-skill-catalog-input.tsx` | :48 input and :60 suggestion action both 44px mobile | 36px min beginning at 768px; real suggestion keyboard semantics preserved |
| `src/components/profile/learner-verification-submit.tsx` | :39 submit and :44 refresh 44px on mobile | Same controls 36px min at 768px; pending and stale flags unchanged |
| `src/components/profile/learner-verification-withdraw.tsx` | :40,46,50,57 — withdraw, confirm, cancel and refresh buttons | All 44px mobile/36px tablet+ min; confirmation flow untouched |
| `src/components/people/faculty-profile-text-section.tsx` | :50 Input and :58-59 discard/save controls; shared Textarea remains multiline | :43 two-column form only `min-[768px]`; Input now 44px phone |
| `src/components/hr/recruiter-profile-details-editor.tsx` | :81 four shared Input fields and :87 save action | :75 one-column phone / two columns 768px+, actions 44px phone |
| `src/components/people/faculty-profile-editor.tsx` | :78 reload button, :88 navigation link | Profile section nav horizontally scrolls through 767px; button/link 44px phone, shared desktop height from 768px |
| `src/components/tpo/tpo-notification-refresh.tsx` | :36 retry action 44px mobile | Uses legacy breakpoint at 768px, no changes to failed/refreshing states |
| `src/components/admin/tenant-directory-csv-control.tsx` | :20 export action 44px mobile | Desktop 36px; export request and pending gating retained |
| `src/components/admin/tenant-settings-other-keys.tsx` | :55 remove, :65 Input, :69 Textarea, :73 add setting | Minimum 44px phone and desktop override at 768px; confirmation semantics unchanged |
| `src/components/admin/tenant-settings-editor.tsx` | :60 Textarea, :66 Input, :74 save settings action | All phone form targets minimum 44px; existing `md:grid-cols-2` remains tablet+ |
| `src/components/tpo/tpo-notice-acknowledge.tsx` | :9 shared acknowledgement button | Minimum 44px through 767px; disabled/read logic unchanged |
| `src/components/tpo/tpo-notice-undo-toast.tsx` | :23 shared undo-send submit | 44px through 767px; :21-22 are **hidden** form payload inputs, not visible controls |
| `src/components/tpo/tpo-notice-read-progress.tsx` | :41,47 show more / unread read actions | 44px phone/36px tablet+; read status retained |
| `src/components/tpo/tpo-trusted-domain-editor.tsx` | :38,41,45 domain entry, add/remove actions | 44px phone/36px tablet+; permission/confirmation logic unchanged |
| `src/components/tpo/tpo-notice-audience-picker.tsx` | :30,41,60,65 shared audience, search, drive inputs/selects | 44px phone/36px tablet+; :50 raw input is **hidden** selected-target payload (exempt). Multiselect semantics preserved |
| `src/components/tpo/tpo-notice-schedule-controls.tsx` | :23 datetime input, :26 schedule action | 44px through 767px; required/minimum schedule values remain unchanged |

### Scoped grep-equivalent results, exact batch files

Every one of the **18** fully retrieved lane-branch files listed in the table above was scanned against these regular expressions after its update, equivalent to `grep -nE` within only that explicit file set (not a full repository or generated CSS scan):

| Scan pattern | Matches across the 18 source files | Findings / exemptions |
| --- | ---: | --- |
| `<(button\|input\|select\|textarea)\\b` | 3 | Two `type="hidden"` fields in `tpo-notice-undo-toast.tsx:21-22`; one `type="hidden"` in `tpo-notice-audience-picker.tsx:50`. **0 visible raw controls** |
| `#[[:xdigit:]]{3,8}\\b` | 0 | No literal hex styling values in the batch |
| `fixed inset-0\|role="dialog"` | 0 | No hand-rolled overlays found in the batch; shared confirmation/dialog components retained |
| `sm:min-h-9` | 0 | No premature 640px switch remains among these 18 files |
| `sm:grid-cols` | 0 | Fields migrated to `min-[768px]` or already at a tablet breakpoint |
| `min-h-11` and `min-[768px]` | See per-file rows above | Source proof of 44px phone and 36px tablet/desktop action minima, without claiming browser-rendered sizes |

**Proof boundary:** These are actual source regex counts obtained from retrieved GitHub file contents, not executed terminal `grep` against all `src`, not computed-style browser measurements and not pixel diffs. The JSX source was re-fetched after each write; no opening/closing tag renames were made. These files retain existing success/error/empty/loading affordances where present, but they were not executed. The terminal repository-wide raw-control/hex/overlay scan and live responsive comparison are still required by STRICT TICK RULE; therefore **G2 and G3 category-level checkboxes remain [ ]**.

**Exact next file for continuation:** `src/components/tpo/tpo-notice-composer-dialog.tsx`, then remaining imported TPO notification authoring/receipt components and cross-portal profile/notification error/loading routes. Scan the whole owned scope once repository checkout / compiled-style proof is available.

### Concurrent-main synchronization after this source batch

The lane was **32 ahead / 0 behind main** when this turn began. While the 18 source files were being completed, main advanced repeatedly as other lanes and the orchestrator integrated changes. A branch-only synchronization PR was opened as **#195** (`head=main`, `base=chatgpt/chat-11-b`), never the reverse. It was reported **not mergeable** by GitHub, and a safe GitHub merge attempt returned HTTP 405 (conflicts). The only overlapping HR files visible in the initial compare, `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx` and `src/components/hr/recruiter-conversation-reply-form.tsx`, were replaced on the lane with their newer main versions **verbatim**, because those versions already retained the 44px/768px fixes and brought in newer shared `Alert`/`InlineNotice` usage. No file under `src/components/ui/**` was changed and main was never written to by this lane.

A subsequent compare showed **15 ahead / 657 behind**, with merge-base advancement indicating that several lane commits had already been incorporated into main by the concurrent orchestrator. Because main continued changing and the sync PR was conflicted, **the branch was NOT force-reset or falsely marked rebased/current**. This is a branch-sync handoff, not a blocker to the verified 18-file static source work; the orchestrator or next bounded turn must reconcile the moving main with a conflict-aware update. No automated browser/CI checks were claimed.

## Replacement lane G2/G3 notices, team and campaign source checkpoint
  
Source-only batch: 21 files, all written and read back on chatgpt/chat-11-b; commits prefixed [chat-11]. No src/components/ui edits, app run, tests, typecheck or CI.

### Legacy source value table

| Property/state | Old LMS exact reference | Updated vNext source value |
| --- | --- | --- |
| Mobile minimum tap | docs/design/legacy-styles/components___notification-drawer.scss:21-24,31-33 — 44px | min-h-11 gives 44px at widths at most 767px in changed controls |
| Desktop button geometry | docs/design/old-lms-shell-spec.md:24-27 — 36px high, radius 9px, type 14px/650 | min-[768px]:min-h-9 starts at 768px; shared Button tokens own radius, typography and variants |
| Notification mobile cutoff | docs/design/legacy-styles/components___notification-drawer.scss:23,355-360 — 767px | changed source uses 768px transition, removing premature sm:min-h-9 |
| Filter pill spacing, state and overflow | docs/design/legacy-styles/components___learn-notifications.scss:60-84,90-127 — gap 8px, scrolling through 767px, 8px radius, active/focus/hover styles | TPO announcement and email history navigation horizontally scroll through 767px; shared stateful controls retained |
| Single page header | docs/design/old-lms-pages.md:5-6 — 30px/600 title with subtitle/actions, no eyebrow | shared PageHeader without eyebrow in TPO team, announcement and campaign routes, and learner profile workspace |
| Form focus/disabled states | docs/design/legacy-styles/components___form.scss:14-23 — keyboard focus-visible; existing shared disabled/selected styles | retained Button, Input, Select, Textarea, Dialog component contracts without modifying props/logic; actual browser computed states unverified |

### File-by-file source and responsive proof

| Source file (under src/) | Source lines | Checked presentation |
| --- | --- | --- |

| src/components/tpo/tpo-notice-composer-dialog.tsx | 11 | shared Dialog opener; 44px mobile / 36px tablet+ |
| src/app/(authenticated)/tpo/announcements/page.tsx | 79,148 | PageHeader without eyebrow; horizontal pill navigation through 767px |
| src/components/tpo/tpo-notice-delete-confirm.tsx | 18,29,32 | shared Dialog; opener/confirm/cancel 44px mobile |
| src/components/tpo/tpo-placement-cell-read-action.tsx | 32 | read receipt action; semantic error color; mobile target 44px |
| src/components/tpo/tpo-public-join-link-card.tsx | 146,147,160,177,190 | join link controls 44px through 767px |
| src/components/tpo/tpo-outcome-labels-editor.tsx | 57,63,69,75,80,85,89 | label inputs/select/save controls 44px through 767px |
| src/components/tpo/tpo-prep-percentage-editor.tsx | 43,47 | numeric input/save 44px through 767px |
| src/components/tpo/tpo-custom-job-type-placed.tsx | 28,30 | Yes/No pressed controls 44px through 767px |
| src/components/tpo/tpo-custom-job-type-rename.tsx | 31,34 | rename input/submit 44px through 767px |
| src/components/tpo/tpo-after-college-bulk-editor.tsx | 116,124,128 | bulk selection, apply and undo 44px through 767px |
| src/components/tpo/tpo-team-ask-panel.tsx | 47,50,93,98 | ask controls 44px through 767px |
| src/components/profile/learner-profile-workspace.tsx | 540-1040 | 21 Buttons / 18 Inputs / 5 Selects source-swept; no eyebrow; 768px grids |
| src/components/tpo/tpo-new-recruiter-conversation.tsx | 76,94,117,120,122 | composer, quick replies and actions 44px through 767px |
| src/components/tpo/tpo-campaign-compose.tsx | 15,88,132,135,139 | campaign fields/actions/links 44px through 767px |
| src/app/(authenticated)/tpo/team/[threadId]/page.tsx | 38,56,58,126,131 | no eyebrow; back/pager touch-safe |
| src/app/(authenticated)/tpo/team/page.tsx | 79,184,188,191,195 | no eyebrow; team pager 44px; 768px grids |
| src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx | 17 | no redundant eyebrow |
| src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx | 22,27,45-103 | no eyebrow; email/history controls 44px; scrollable pill nav |
| src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx | 23,30 | shared heading without eyebrow |
| src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx | 16,18 | shared heading/back link; tablet grid |
| src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx | 18,37 | shared heading and responsive preview |

### Scoped source pattern results

After the edits, the 21 listed files were fetched and scanned individually using expressions equivalent to grep -nE within those files only:

| Pattern | Match count | Exemptions |
| --- | ---: | --- |
| Raw button/input/select/textarea opening elements | 11 | All 11 are hidden POST form inputs: 9 announcement page and 2 delete confirmation; 0 visible raw controls |
| Hex literal colors | 0 | None |
| fixed inset-0 or role=dialog | 0 | Shared Dialog provides overlays |
| sm:min-h-9 | 0 | The 640px height transition is absent |
| eyebrow= | 0 | No duplicate PageHeader eyebrow |

These are source-only checks, not a repo-wide terminal grep, browser-computed responsive measurements, or pixel diff. No opening/closing JSX tags were renamed and existing form submit, validation, permission, reply, notification, draft and receipt behavior was retained. G2/G3 strict category items must stay UNCHECKED until repo-wide coverage and phone/tablet/desktop runtime proof at 320/360/390/768/1280, actual old LMS chat-bubble comparison, and hover/focus/disabled/loading/empty/error states are verified.

Next file: src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx (confirm actual route path), then remaining G2/G3 profile and messaging components.

## Replacement lane follow-on G2/G3 imported-editor source checkpoint
  
13 more source files read back and aligned with old-LMS mobile/desktop controls. In addition, the earlier listed custom-job-type Placed/Rename controls now use the same shared useConfirmFlow rather than window.confirm; previously authored 44px action sizes remain intact.

| Property | Legacy value / source | Current vNext source |
| --- | --- | --- |
| Minimum mobile target | components___notification-drawer.scss:21-24,31-33 = 44px | min-h-11 through 767px |
| Tablet/desktop target | old-lms-shell-spec.md:24-27 = 36px default control | min-[768px]:min-h-9 from 768px |
| Mobile form layout | components___learn-notifications.scss:60-84 = mobile through 767px | min-[768px]:grid-cols for changed settings forms |
| Focus/confirmation | components___form.scss:14-23 = focus-visible keyboard ring; owner requires shared overlays | useConfirmFlow uses shared ConfirmDialog; keyboard behavior inherited from shared UI |
| Page head | old-lms-pages.md:5-6 = single header on canvas, no eyebrow | existing PageHeaders left in place; no extra eyebrow in scanned files |

### Follow-on individual source rows

| Source file (relative to src/) | Changed/verified lines | Source-level responsive or dialog proof |
| --- | --- | --- |

| app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx | 29,55 | Draft/back link 44px mobile; 36px from 768px |
| components/tpo/tpo-campaign-send-control.tsx | 45 | Send confirmation opener touch-safe; status gating unchanged |
| components/hr/recruiter-conversation-read-control.tsx | 61 | Read receipt action 44px through 767px |
| app/(authenticated)/tpo/messages/[threadId]/page.tsx | 30 | Back-to-messages link 44px mobile; thread bubble copy/sender untouched |
| components/placements/learner-placement-notification-settings.tsx | 82,85,93-94 | Preference review/reload/confirm/cancel 44px mobile |
| components/admin/college-branding-form.tsx | 169,195,209 | Hex input and branding URI fields 44px mobile; user color data preserved |
| components/tpo/tpo-after-college-editor.tsx | 68,78,81,90-91 | Confirmation buttons 44px mobile |
| components/tpo/tpo-blocked-dates-editor.tsx | 41,59,74,83,88 | 767px one-column grids; shared confirmation for range/day deletion |
| components/tpo/tpo-job-types-editor.tsx | 46,53,57,60,65,80 | 767px form grids; shared field/action tokens |
| components/tpo/tpo-company-visibility-editor.tsx | 42,48,55 | Shared confirmation replaces native window.confirm; Save 44px mobile |
| components/tpo/tpo-team-handover.tsx | 40,47 | Shared confirmation; select/send 44px mobile |
| components/admin/descendant-feature-rule-editor.tsx | 45,54,59,61,64-65 | Shared confirmation and scope selects/buttons 44px mobile |
| components/tpo/tpo-batch-decision-control.tsx | 43,53 | Shared confirmation; select/save 44px mobile |

### Re-fetched scoped pattern counts, these 13 files only

| Pattern | Count | Exemption |
| --- | ---: | --- |
| Raw visible button/input/select/textarea | 0 | All visible controls use shared src/components/ui |
| Hidden raw input | 0 | None in this follow-on subset |
| Literal hex colours | 0 | Branding colour values are data, not CSS literals |
| Native window.confirm, fixed inset-0, role=dialog | 0 | useConfirmFlow/ConfirmDialog handles confirmation |
| sm:min-h-9 and PageHeader eyebrow= | 0 | Responsive switch at 768px; no duplicate eyebrow |

Each modified file was reread after its GitHub write and exact intended source text matched. JSX tag names were retained; no run of the app, TypeScript, CI, compiled CSS or browser simulation was done. The STRICT TICK RULE for complete G2/G3 remains open: a repository-wide grep, legacy chat bubble comparison, browser-computed focus/disabled/loading/error state table, and phone/tablet/pixel proofs are still needed.

Exact next file: src/components/tpo/tpo-audit-saved-views.tsx only if queue ownership includes saved personal views; otherwise resume source sweep at src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx.

## Replacement lane tenant and TPO settings responsive confirmation checkpoint

Readback-confirmed authored source updates for 13 additional G2/settings files. Shared components and page content are unchanged; native JavaScript confirmation prompts in seven settings editors were replaced by the preexisting promise-backed shared useConfirmFlow/ConfirmDialog, preserving every caution message and mutation guard. Current main was merged into the lane branch through branch-only PR #197; no lane pushes to main were made.

| Property | Legacy source/value | vNext outcome |
| --- | --- | --- |
| Phone and narrow-tablet minimum | components___notification-drawer.scss:21-24,31-33 = 44px through 767px | Shared Button/Input/Select classes use min-h-11 through 767px |
| Desktop/default control | old-lms-shell-spec.md:24-27 = 36px button, radius 9px, 14px weight 650 | min-[768px]:min-h-9 starts at 768px; shared controls inherit color/typography/radius |
| Responsive card/form grid | components___learn-notifications.scss:60-84 = mobile through 767px | min-[768px]:grid-cols replaces premature 640px two/three-column layouts |
| Focus and confirmation states | components___form.scss:14-23 = focus-visible ring and owner requires shared dialog | useConfirmFlow returns ConfirmDialog with focus and escape from src/components/ui; actual runtime focus needs browser test |
| Page title/canvas | old-lms-pages.md:5-6 = white single canvas, title without eyebrow | existing PageHeader preserved, no new card-in-card or eyebrow |

### Source-level file table

| File under src/ | Inspected source lines | Authored mobile/tablet contract |
| --- | --- | --- |

| components/tpo/tpo-company-visibility-editor.tsx | 42,48,55 | shared confirmation and Save button 44px mobile |
| components/tpo/tpo-blocked-dates-editor.tsx | 41,47,51,54,56,59,62,67,72,74,83,88 | single-column phone filters; shared day/range confirmation |
| components/tpo/tpo-custom-job-type-placed.tsx | 30,32 | selected Yes/No state retained; shared confirmation |
| components/tpo/tpo-custom-job-type-rename.tsx | 33,36 | name and rename controls; shared confirmation |
| components/tpo/tpo-team-handover.tsx | 40,47 | member selection and handover; shared confirmation |
| components/admin/descendant-feature-rule-editor.tsx | 45,54,59,61,64,65 | module/scope controls 44px mobile; shared confirmation |
| components/tpo/tpo-batch-decision-control.tsx | 43,53 | batch default Select/Save; shared confirmation |
| app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx | 158,217,222,225,293 | source mobile filter controls and 768px readiness grids |
| app/(authenticated)/admin/settings/auth/page.tsx | 30,45 | single-column phone settings tiles |
| app/(authenticated)/admin/settings/page.tsx | 87,93,134,140,143,147,159 | 44px search/filter/link controls, 768px grid |
| app/(authenticated)/admin/tenants/page.tsx | 56,60,62,64,67,71,77,81,92 | tenant directory search/filter/CTA 44px phone, 768px grid |
| app/(authenticated)/tpo/settings/branding/page.tsx | 210 | branding layout begins 2 columns at 768px |
| app/(authenticated)/tpo/settings/public-page/page.tsx | 57 | public placement settings layout begins 2 columns at 768px |

### Scoped source pattern results: 13 files

- Raw visible button/input/select/textarea: 0.
- Raw hidden fields: 0.
- Literal hex CSS colors: 0.
- window.confirm, fixed inset-0, role=dialog: 0.
- Old sm:min-h-9 or sm:grid-cols breakpoint classes: 0.
- PageHeader eyebrow props: 0.

All results above were obtained by retrieving and searching the 13 changed source files on chatgpt/chat-11-b; they are NOT a full repository terminal grep or computed CSS/screenshot proof. Changes were reread after writing. No app execution, CI, typecheck or local browser run occurred. G2/G3 category strict acceptance remains UNCHECKED pending full source coverage, 320/360/390/768/1280 responsive render proof, chat bubble legacy baseline and runtime states.

Next exact file: src/components/tpo/tpo-audit-saved-views.tsx (personal saved views) or, if audit view ownership belongs elsewhere, src/components/activity/notification-toolbar.tsx for source review and strict-tick evidence.


## 2026-10-20 replacement lane: 15 completed source edits (G2/G3, static proof only)

**Ownership and main synchronization:** The lane was fast-forwarded to `main` SHA `96efdcc5dcf3b3f7bc54a85ff033923e6ca06c84` before editing. Only `chatgpt/chat-11-b` was changed. Previous lane history was examined and the next untouched source classes were selected, without changing any shared `src/components/ui/**` file. These are **15 whole-file source sweeps** of the old-LMS mobile boundary, controls, focus style and status/view routing. Changes are class-token substitutions only, with no JSX tag changes or restructured content. No executable application code, compiler, CI or browser was run.

### Work queue — additional source-complete files (not category-acceptance checkboxes)
- Source review complete: `src/app/(authenticated)/tpo/settings/team/loading.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/app/(authenticated)/tpo/settings/branding/loading.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/hr/recruiter-designation-editor.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/profile/learner-skill-catalog-input.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/profile/learner-profile-workspace.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/activity/activity-center.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/activity/notification-list.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/admin/super-admin-placement-detail-view.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/app/(authenticated)/learn/profile/completeness/error.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/app/(authenticated)/learn/notifications/history/error.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/app/(authenticated)/tpo/team/everyone/page.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/app/(authenticated)/tpo/messages/page.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/profile/learner-profile-academic-retry.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/hr/recruiter-profile-details-editor.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).
- Source review complete: `src/components/hr/recruiter-notification-bell.tsx` (source readback and scoped grep proof below; **runtime/visual proof outstanding**).

### Exact legacy → authored vNext property table

Legacy `components___learn-notifications.scss:9` and `components___notification-drawer.scss:24` define mobile max `767px`, switching to desktop from `768px`. `components___learn-notifications.scss:11` and `components___notification-drawer.scss:22,31-32` define touch minimum **44px**; `old-lms-shell-spec.md:23-24` defines **36px**, radius **9px** at desktop. The source assertions below check **the touched properties** at 320/360/390/767 and 768/1280 viewport width via class breakpoint semantics, **not** by rendering those screens. For desktop shadows, visual typography, all UI component states, and real message bubble parity, comparison remains OPEN.

| File | Legacy property / exact source line | vNext source value / exact line | Source-level phone / tablet contract | Grep equivalent (raw / hex / overlay / 640px sm) |
| --- | --- | --- | --- | --- |
| `src/app/(authenticated)/tpo/settings/team/loading.tsx` | `notification-drawer.scss:24,105; learn-notifications.scss:9,44` | 7: `min-[768px]:grid-cols-2` | Skeleton columns remain one until 767px, two at 768px | 0 / 0 / 0 / 0 |
| `src/app/(authenticated)/tpo/settings/branding/loading.tsx` | `learn-notifications.scss:9,44` | 9: `min-[768px]:grid-cols-2` | Branding skeleton does not split at 640px | 0 / 0 / 0 / 0 |
| `src/components/hr/recruiter-designation-editor.tsx` | `learn-notifications.scss:9,11; old-lms-shell-spec.md:23-24` | 31: `min-[768px]:col-span-2`; 37: `min-h-11 min-[768px]:min-h-9` | Designation editor spans desktop grid only from 768px; mobile submit 44px | 0 / 0 / 0 / 0 |
| `src/components/profile/learner-skill-catalog-input.tsx` | `learn-notifications.scss:9,11,103-111; old-lms-shell-spec.md:23-24` | 44: `min-[768px]:col-span-2`; 70: `min-h-11 min-[768px]:min-h-9`; 82: `hover:!bg-[var(--lms-primary-subtle)]` | Skill picker stays single-column to 767px; hover color uses token | 0 / 0 / 0 / 0 |
| `src/components/profile/learner-profile-workspace.tsx` | `learn-notifications.scss:9,44,67; notification-drawer.scss:22` | 534: `min-[768px]:hidden`; 553: `min-[768px]:flex-row`; 581: `min-[768px]:p-5`; 759: `min-[768px]:w-auto` | Quick navigation and stacked editing layout survive phone 320–767px | 0 / 0 / 0 / 0 |
| `src/components/activity/activity-center.tsx` | `learn-notifications.scss:9,44; old-lms-shell-spec.md:23-24` | 123: `min-[768px]:flex-row`; 179: `min-[768px]:items-end`; 192: `min-[768px]:grid-cols-2`; 108: `rounded-[var(--lms-control-radius)]` | Activity rows stack on phone; linked actions use shared control radius | 0 / 0 / 0 / 0 |
| `src/components/activity/notification-list.tsx` | `learn-notifications.scss:9,11,151-152,218-220` | 122: `min-[768px]:flex-row`; 122: `min-[768px]:items-start`; 122: `min-[768px]:justify-between`; 136: `min-h-11 min-[768px]:min-h-9` | Notification actions stay stacked through 767px; mobile actions 44px | 0 / 0 / 0 / 0 |
| `src/components/admin/super-admin-placement-detail-view.tsx` | `learn-notifications.scss:9,11; old-lms-shell-spec.md:23-24` | 13: `min-[768px]:grid-cols-2`; 10: `min-h-11 min-[768px]:min-h-9` | Single-column phone details and 44px links, 36px at 768px | 0 / 0 / 0 / 0 |
| `src/app/(authenticated)/learn/profile/completeness/error.tsx` | `notification-drawer.scss:22,24; old-lms-shell-spec.md:24` | 13: `min-[768px]:min-h-9` | Profile recovery link remains 44px on 640–767px phones | 0 / 0 / 0 / 0 |
| `src/app/(authenticated)/learn/notifications/history/error.tsx` | `notification-drawer.scss:22,24; old-lms-shell-spec.md:24` | 19: `min-[768px]:min-h-9` | Notifications-history recovery link remains 44px through 767px | 0 / 0 / 0 / 0 |
| `src/app/(authenticated)/tpo/team/everyone/page.tsx` | `notification-drawer.scss:22,24,479-490; old-lms-shell-spec.md:24` | 28: `min-h-11 min-[768px]:min-h-9` | Retry and two message pager links hit 44px on phone | 0 / 0 / 0 / 0 |
| `src/app/(authenticated)/tpo/messages/page.tsx` | `learn-notifications.scss:9,44,67; notification-drawer.scss:24` | 222: `min-[768px]:grid-cols-2`; 267: `min-[768px]:pt-5`; 343: `min-[768px]:col-span-2` | Message search and summary grids stay stacked on 320–767px | 0 / 0 / 0 / 0 |
| `src/components/profile/learner-profile-academic-retry.tsx` | `notification-drawer.scss:22,24; old-lms-shell-spec.md:24` | 7: `min-h-11 min-[768px]:min-h-9` | Retry action 44px on phone and 36px at desktop breakpoint | 0 / 0 / 0 / 0 |
| `src/components/hr/recruiter-profile-details-editor.tsx` | `learn-notifications.scss:9,11,44; old-lms-shell-spec.md:24` | 74: `min-[768px]:col-span-2`; 75: `min-[768px]:grid-cols-2`; 81: `min-h-11 min-[768px]:min-h-9` | Edit form stays one column through 767px; shared fields retain touch targets | 0 / 0 / 0 / 0 |
| `src/components/hr/recruiter-notification-bell.tsx` | `notification-drawer.scss:10-12,21-24,221-223` | 77: `focus-visible:outline-[var(--lms-neutral-500)]` | Notification row focus outline inherits legacy neutral focus token | 0 / 0 / 0 / 0 |

**Scoped grep proof (source readbacks on branch):** For all fifteen whole files, patterns equivalent to `grep -nE '<(button|select|input|textarea)([ >])'`, `grep -nE '#[[:xdigit:]]{3,8}'`, `grep -nE 'fixed inset-0|role="(alert)?dialog"'`, and `grep -nE 'sm:'` returned aggregate respective counts **0 / 0 / 0 / 0**. The `sm:` result is specifically the 640px responsive prefix; `size="sm"` props are not breakpoint prefixes. Every edited file was re-fetched after its final write for this table. JSX opening/closing tag spellings and control props were not changed. No raw visible controls, user-facing hex color literals, or hand-built dialog overlays appear in the fifteen-file slice. The previous learner skill dropdown literal hover hex was replaced with `var(--lms-primary-subtle)` (source `src/components/profile/learner-skill-catalog-input.tsx:82`).

**Responsive proof boundary:** Source semantics show all listed mobile layouts remain in effect at 320/360/390/640/767px and transition at 768px; where actions have `min-h-11`, phone minimum is 44px, reverting to `min-h-9` (36px) only at 768px. Real-world viewport geometry, keyboard navigation, focus/hover/disabled/loading/empty/error/sent/read presentation, `PageCanvas` dimensions, and 1280px visual pixel comparisons **were not verified**, because no dev server/browser or executed tests are permitted here. Therefore, **G2 and G3 strict acceptance remain [ ]** under the STRICT TICK RULE; these static source improvements must not be mistaken for the category's exhaustive runtime completion.

**Exact next file:** `src/components/hr/hr-recruiter-bell.tsx` (inspect current dropdown notification row text/hover/active/focus against `components___notification-drawer.scss:185-224`), followed by `src/components/tpo/tpo-company-team-conversation.tsx` for G3 sender bubble geometry. Re-run full-repository grep with the real checkout and browser-width side-by-side before ticking G2/G3.
