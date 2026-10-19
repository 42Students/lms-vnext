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
