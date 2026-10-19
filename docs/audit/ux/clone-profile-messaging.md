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
