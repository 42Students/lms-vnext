# Chat-15 — North Star old-LMS visual parity sweep (HR / Recruiter)

Status: IN PROGRESS · 2026-10-19 · owner: chat-15 · branch `chatgpt/chat-15-b`

## Binding reference and non-goals

Source of truth: `docs/orchestrator/queues/master-queue.md` NORTH STAR, `docs/design/old-lms-shell-spec.md`, `docs/design/old-lms-shell.css`, `docs/design/old-lms-pages.md`, `docs/design/vnext-vs-old-lms-gap.md`, `docs/design/legacy-styles/components___common.scss`, `components___button.scss`, `components___form.scss`, `components___dropdown.scss`, `components___header.scss`. The shared skin (chat-17), sidebar (chat-19), topbar (chat-13) and authenticated layout's `PageCanvas` own their respective files; this lane **must not** override them.

Legacy page target: a **single** `PageCanvas` with white `#fff`, 1px `#e5e9f0` border, radius 12px, padding 24px on `#f1f4f9` app shell; Inter typography; page h1 30px / weight 600 / `#172033`; primary action #0a7c88 with white text, radius 9px, 36px high; secondary white with hairline border; compact 13px active underline tabs; inputs/tables/dropdowns/empty/error states inherit global/shared tokens. Preserve mobile layout and accessible focus. **Do not restructure contents, rename tabs, remove forms/tables, rewrite workflows, or flatten genuinely distinct repeating item cards.** Do not run CI.

## Inventory: all owned authenticated HR/recruiter page trees

There are 143 enumerated files across `src/app/(authenticated)/hr/**`, `src/app/(authenticated)/recruiter/**` and `src/components/hr/**` at start of sweep. The `recruiter/**` route aliases normally re-export their `hr/**` equivalent; update the implementation at its source rather than copying CSS into every alias. All loading/error/not-found pages already reuse shared fallbacks and should not receive competing per-page skins.

| Route or component family | Source file(s) / visual-risk focus | Intended treatment |
|---|---|---|
| HR Today | `hr/home/page.tsx` | Inline custom pill/call-to-action, legacy heading, stacked ordinary section borders, pale warning banners |
| HR Drives directory | `hr/drives/page.tsx`; `hr/placements/page.tsx` | Filter tabs, toolbar, per-section wrapper vs one white page, CTA/link tokens |
| New/repair drive | `hr/drives/new/page.tsx`, `hr-drive-draft-form.tsx` | Form controls, action and preview borders, button/input height 36, field focus/tokens |
| Drive requests/proposals | `hr/drives/proposals/page.tsx`, `hr/drives/recorded-outside/page.tsx` | Subheads, list/table density, no extra page canvas/card shell |
| Drive detail and candidate panels | `hr/placements/jobs/[jobId]/page.tsx`, `recruiter/drives/[jobId]/page.tsx`, `recruiter-applicant-review-drawer.tsx`, `recruiter-private-rating-editor.tsx` | Tabs, row hairlines, applicant drawer controls, form treatment |
| Rounds & interview slots | `hr/drives/[jobId]/rounds/editor/page.tsx`, `.../remove/[roundId]/page.tsx`, `hr/drives/[jobId]/interview-slots/page.tsx`, `recruiter-round-inline-editor.tsx` | Buttons, fields, action confirmations, separate modal vs ordinary content |
| Results | `hr/round-results/page.tsx` | Outcome tabs, tables, header, result status pills |
| Messaging | `hr/conversations/page.tsx`, `hr/conversations/[threadId]/page.tsx`, `hr/messages/page.tsx`, `hr/drives/[jobId]/messages/page.tsx` | Thread headers, messages, input/reply, unread indicators, focus/CTA |
| Recruiter notifications | `hr/notifications/page.tsx`, `hr/activity/page.tsx` | Search/filter bar, compact event rows, selected tabs, export actions |
| Calendar | `hr/calendar/page.tsx` | Toolbar, day cells, status chips, captions, responsive density |
| Company/colleges | `hr/company/page.tsx`, `hr/company/reports/page.tsx`, `hr/colleges/page.tsx` | Shared page head, tabs, filter buttons, separate report-option tiles only |
| Recruiter profile | `hr/profile/page.tsx`, `recruiter-display-name-editor.tsx`, `recruiter-designation-editor.tsx`, `recruiter-profile-details-editor.tsx`, `recruiter-profile-access.tsx` | Form treatment, contrast, surface nesting, edit actions |
| Shared HR UI | `hr-notification-read-button.tsx`, `hr-recruiter-bell.tsx`, `hr-unsent-drive-alert.tsx`, `recruiter-conversation-live-refresh.tsx`, `recruiter-conversation-read-control.tsx`, `recruiter-conversation-reply-form.tsx`, `recruiter-decision-read-button.tsx`, `recruiter-drive-focus-refresh.tsx`, `recruiter-notification-bell.tsx`, `recruiter-request-cancel-button.tsx`, `recruiter-request-feedback.tsx` | Replace raw hardcoded styles with CSS token classes; preserve client behaviour |

All `recruiter/{home,drives,calendar,colleges,company,messages,profile}` aliases, subroutes, `hr/**/loading.tsx`, `recruiter/**/loading.tsx`, `**/error.tsx`, and `**/not-found.tsx` are included in coverage and need no duplicate page-component implementation when they delegate to their HR/shared source.

## Exact deviation checklist, to update as edits land

- [ ] Remove local hardcoded hex/rgb/hsl/text-color/font families, inline shadows and redundant foreground backgrounds; use the shared semantic tokens/classes.
- [ ] Replace non-legacy `rounded-full` **on controls/tabs only** (do not change avatar or genuinely rounded status pills) with legacy button/input 9px or token.
- [ ] Normalize raw `min-h-11` (44px) CTA/input controls to old-LMS 36px `h-9` / `min-h-9`, while retaining touch target adaptations where required on small screens.
- [ ] Remove redundant `bg-surface`, border, radius and padding on ordinary **section wrappers**, but keep separate objects/modals/cards and table grid hairlines.
- [ ] Page h1 headings inherit shared PageHeader 30/600/#172033, remove custom competing title treatments; keep h2 hierarchy and all wording.
- [ ] Use global link/button/input/select/textarea/table tokens and shared components where doing so preserves existing client interfaces and form behavior.
- [ ] Recheck every source file in above inventory and update this audit with file-by-file status plus any remaining exceptions.

## Coordination and verification

`src/app/(authenticated)/layout.tsx` already wraps every HR/recruiter page in `PageCanvas`. Avoid adding a second `PageCanvas` inside HR pages. chat-17 owns `src/components/ui/**`, chat-13 and chat-19 own the shell. This lane edits only `src/app/(authenticated)/hr/**`, `src/app/(authenticated)/recruiter/**`, `src/components/hr/**` and this audit. No screenshots or CI are available to this lane; any visual parity claim beyond inspected source must remain pending orchestrator screenshots.

## Execution log

- [x] Synced branch to `origin/main`, read NORTH STAR and measured old-LMS reference.
- [x] Enumerated 143 implementation, alias and fallback files, identified single canvas inheritance.
- [ ] HR page implementation sweep.
- [ ] Recruiter source/alias and HR component sweep.
- [ ] Final textual class/token audit and page list update.
