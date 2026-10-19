# Chat-15 — North Star old-LMS visual parity sweep (HR / Recruiter)

Status: SOURCE RE-AUDIT COMPLETE — screenshot verification pending · 2026-10-19 · owner: chat-15 · branch `chatgpt/chat-15-b`

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

- [x] Remove local hardcoded hex/rgb/hsl/text-color/font families, inline shadows and redundant foreground backgrounds; use the shared semantic tokens/classes.
- [x] Replace non-legacy `rounded-full` **on controls/tabs only** (do not change avatar or genuinely rounded status pills) with legacy button/input 9px or token.
- [x] Normalize raw `min-h-11` (44px) CTA/input controls to old-LMS 36px `h-9` / `min-h-9`, while retaining touch target adaptations where required on small screens.
- [x] Remove redundant `bg-surface`, border, radius and padding on ordinary **section wrappers**, but keep separate objects/modals/cards and table grid hairlines.
- [x] Page h1 headings inherit shared PageHeader 30/600/#172033, remove custom competing title treatments; keep h2 hierarchy and all wording.
- [x] Use global link/button/input/select/textarea/table tokens and shared components where doing so preserves existing client interfaces and form behavior.
- [x] Recheck every source file in above inventory and update this audit with file-by-file status plus any remaining exceptions.

## Coordination and verification

`src/app/(authenticated)/layout.tsx` already wraps every HR/recruiter page in `PageCanvas`. Avoid adding a second `PageCanvas` inside HR pages. chat-17 owns `src/components/ui/**`, chat-13 and chat-19 own the shell. This lane edits only `src/app/(authenticated)/hr/**`, `src/app/(authenticated)/recruiter/**`, `src/components/hr/**` and this audit. No screenshots or CI are available to this lane; any visual parity claim beyond inspected source must remain pending orchestrator screenshots.

## Execution log

- [x] Synced branch to `origin/main`, read NORTH STAR and measured old-LMS reference.
- [x] Enumerated 143 implementation, alias and fallback files, identified single canvas inheritance.
- [x] HR page implementation sweep.
- [x] Recruiter source/alias and HR component sweep.
- [x] Final textual class/token audit and page list update.


## File-by-file disposition (source audit complete)

**Implemented and modified:** all substantive HR display pages that carried non-legacy hardcoded link/control classes: `hr/{home,drives,calendar,activity,company,company/reports,conversations,conversations/[threadId],notifications,profile,round-results}`; `hr/placements/jobs/[jobId]`; `hr/drives/{new,proposals,recorded-outside,[jobId]/messages,[jobId]/interview-slots,[jobId]/rounds/editor,[jobId]/rounds/editor/remove/[roundId]}`. Other implementation files including `hr/{colleges,messages,placements}` already delegate to shared/canonical pages and required no override. The independently implemented `recruiter/drives/[jobId]/change-requests/page.tsx` was restyled.

**Client HR components modified as applicable:** `hr-drive-draft-form`, `hr-notification-read-button`, `hr-recruiter-bell`, `hr-unsent-drive-alert`, `recruiter-conversation-read-control`, `recruiter-decision-read-button`, `recruiter-designation-editor`, `recruiter-display-name-editor`, `recruiter-drive-focus-refresh`, `recruiter-notification-bell`, `recruiter-private-rating-editor`, `recruiter-profile-access`, `recruiter-profile-details-editor`, `recruiter-request-cancel-button`, `recruiter-round-inline-editor`. `recruiter-applicant-review-drawer`, `recruiter-conversation-live-refresh`, `recruiter-conversation-reply-form`, `recruiter-request-feedback` already use shared styles or have no hardcoded styling outside the old spec; leave their functionality and state alone.

**Recruiter-owned placement components:** `placement-recruiter-access`, `recruiter-interview-slot-form`, `recruiter-placement-portfolio`, `recruiter-result-controls`, `recruiter-resume-download` updated where hardcoded radius/control classes existed; `recruiter-focused-review-shortcuts` had no conflicting classes and was left intact. Shared TPO controls, global `src/components/ui`, shell and auth/login sources deliberately excluded to respect lane ownership.

**Recruiter aliases:** inspected all 17 `recruiter/**/page.tsx` files. Sixteen are canonical HR imports or redirects (including the nested messages/interview-slots/rounds paths); the distinct change-requests page was changed here. `hr/**/loading.tsx`, `hr/**/error.tsx`, `hr/**/not-found.tsx` and the recruiter counterparts delegate to shared loading/error/not-found primitives, already skinned by their respective owner.

### Exact changes by visual surface

1. **Buttons and inputs:** changed native `min-h-11` (44px) overrides to shared control minimum `min-h-9` (36px), and `rounded-md` (6px) overrides to exactly `rounded-[9px]`, consistent with the currently installed `ui/button.tsx` / `ui/input.tsx` skins. Draft form inputs explicitly use 36px height, 14px and 9px radius. Retained wider wrapping as needed.
2. **Palette:** removed raw variable-specific link-text overrides in favor of `text-primary-text` (mapped in `globals.css` to `--lms-link-text: #0e7c87`). Existing `bg-primary`/ `text-on-primary` resolve to old-LMS CTA teal `#0a7c88` and pure white. Replaced local outline color overrides with the same primary-text focus color used by shared buttons, rather than faint translucent rings.
3. **One continuous canvas:** flattened *ordinary* `<section>` card treatments in the job details, calendar, company/reports, profile, conversations and round-results pages to hairline bottom dividers and whitespace; the four substantive HR draft form sections also sit directly on the inherited white canvas. No added outer canvas and no changes to section order or markup structure.
4. **Legacy tabs:** recruiter job offer-state and round-result tab navigation now uses the slim 3px teal underline for selected items and transparent border for other items rather than full teal pill-buttons.
5. **Preserved separate objects:** Today “Next up”, per-drive attention, individual applicant/recruiter tiles, report option articles, dropdown popovers with deliberate shadow, status/count pills, avatars, warning banners, modal dialogs, and horizontally scrollable tables retained their object separation and responsive behavior.
6. **Typography:** all substantive HR page-level titles use the shared `PageHeader` h1 (30px/600/#172033 on the measured desktop breakpoint). No nested page h1/custom font families, raw hex colors, non-semantic Tailwind color palette overrides, or large local shadows remain in the examined HR page files; icon/number size semantics are intentionally preserved.

### Visual verification remaining

The source audit and commits are complete. Exact pixel parity **cannot be certified without side-by-side authenticated browser screenshots**, especially at desktop 1280×800 and phone widths, for Home, Drives, Job detail, Calendar, Messages, Company, and Profile. No CI, typecheck, snapshots or browser tests were run, as ordered. This audit is a source-completion record, not a claim that the final browser pixels have been independently verified.

## 2026-10-19 follow-up: value-level HR/recruiter parity pass

The original source sweep was rechecked after chat-17 shared skin and canvas changes. The earlier "source complete" status did not mean all native controls, tab states and nested page surfaces were pixel-aligned. This follow-up made **30 additional file-level commits** tagged `[chat-15]` across **27 distinct implementation files** (five commits have already been integrated into `main` by the orchestrator). After these edits, `origin/main` was merged into `chatgpt/chat-15-b` with a separate tagged merge commit, without pushing to `main`. The merge preserved unrelated changes from 156 incoming paths and retained this lane's 23 then-unmerged edited paths. No CI, TypeScript execution or browser tests were run.

| File (path relative to `src/`) | Follow-up source treatment |
|---|---|
| `app/(authenticated)/hr/activity/page.tsx` | Event-type active underline, 36px export/college links, divide-y activity rows |
| `app/(authenticated)/hr/home/page.tsx` | Ordinary Today sections become whitespace and hairline separators; keep distinct Next up panel and action tiles |
| `app/(authenticated)/hr/drives/page.tsx` | Legacy 13px/3px lifecycle underline tabs; remove redundant empty-state card frames |
| `app/(authenticated)/hr/drives/proposals/page.tsx` | Single-canvas search region, 14px native inputs, hairline proposal list and empty state |
| `app/(authenticated)/hr/drives/[jobId]/messages/page.tsx` | Flatten ordinary drive discussion wrapper and repeated message-row cards |
| `app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx` | Compact 14px native controls, 650/white primary buttons, flat empty state |
| `app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx` | 14px/650 primary removal action |
| `app/(authenticated)/hr/calendar/page.tsx` | Calendar grid border integrated with white page instead of a second full card |
| `app/(authenticated)/hr/company/page.tsx` | Consistent 13px/3px Company/Team active underline |
| `app/(authenticated)/hr/company/reports/page.tsx` | Flat funnel section; 13px/3px selected and unselected Reports cross-tabs |
| `app/(authenticated)/hr/notifications/page.tsx` | Empty state uses hairline rows, no nested panel |
| `app/(authenticated)/hr/profile/page.tsx` | Account and access table sections stop creating a duplicate page canvas |
| `app/(authenticated)/hr/round-results/page.tsx` | Hiring round and outcome tabs match the old underline rather than pills |
| `app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` | Overview/Applicants/Rounds/Offers/Requests/Discussion tabs use active underline; discussion loses full-page inner card |
| `components/hr/hr-drive-draft-form.tsx` | 36px confirmation actions; preserve multiline job description height despite 36px single-line controls |
| `components/hr/recruiter-round-inline-editor.tsx` | 14px secondary actions and 14px/650 primary |
| `components/hr/recruiter-profile-details-editor.tsx` | Remove native `rounded` 4px styles; use control-radius token, 14px text, visible focus and white primary |
| `components/hr/recruiter-display-name-editor.tsx` | Cancel is 36px; 650 CTA weight and focus-visible fields |
| `components/hr/recruiter-designation-editor.tsx` | Field focus and 650-weight primary |
| `components/hr/recruiter-drive-focus-refresh.tsx` | Refresh CTA now 36px and 14px text |
| `components/hr/recruiter-private-rating-editor.tsx` | Select and note use 14px shared focus/radius; primary review action 650/white |
| `components/hr/recruiter-notification-bell.tsx` | Compact dropdown close, retry, see-all controls |
| `components/placements/placement-recruiter-access.tsx` | Explicit 9px hardcoded/44px form controls replaced by shared radius/36px fields |
| `components/placements/recruiter-result-controls.tsx` | 36px/14px bulk outcome actions, 650/white primary and flat no-rounds state |
| `components/placements/recruiter-resume-download.tsx` | Resume link action 36px instead of 40px |
| `components/placements/recruiter-interview-slot-form.tsx` | Slot form shared Select/Input use 14px text |
| `components/placements/recruiter-placement-portfolio.tsx` | Recruiter card secondary actions 36px instead of 40px |

**Intentionally unchanged:** per-job portfolio objects, per-candidate editor/offer cards, avatars, status pills, warning banners, notification dropdown overlays, and modal layers retain distinct contained surfaces. Recruiter route aliases still delegate to canonical HR pages. Shared UI, shell, and global CSS remain with their owning lanes. Page content, labels, form behavior, and route handlers were not deliberately changed.

**Verification boundary:** textual source checks and specific follow-up inspections only. Actual 1280×800 desktop and narrow/mobile screenshot comparison is still outstanding; no successful typecheck, visual diff, CI, or runtime certification is claimed.

## 2026-10-19 follow-up: tracker portal and component parity

The lane assignment includes tracker pages, which are a separate authenticated `/tracker` route tree and were omitted from the earlier HR/recruiter-only inventory. They have now received **25 additional `[chat-15]` file commits across 23 distinct tracker implementation files**. The edits use inherited `PageCanvas` rather than nested page cards, 36px/9px controls, 14px input/button text, `text-primary-text` links, white text on teal actions, and 13px/3px active underline navigation. Status pills, genuine recurring issue and attachment objects, logs, modal dialogs and behavior are preserved.

| Surface | Paths updated |
|---|---|
| Landing and report history | `src/app/(authenticated)/tracker/page.tsx`, `mine/page.tsx`, `mine/[publicId]/page.tsx` |
| Admin issue directory and detail | `src/app/(authenticated)/tracker/issues/page.tsx`, `issues/[publicId]/page.tsx` |
| Logs | `src/app/(authenticated)/tracker/logs/page.tsx` |
| Independent audit list and detail | `src/app/(authenticated)/tracker/audit-findings/page.tsx`, `audit-findings/[publicId]/page.tsx` |
| Tracker shell nav, page theme and quick report | `src/components/tracker/tracker-admin-nav.tsx`, `tracker-theme-toggle.tsx`, `tracker-quick-report-launcher.tsx` |
| User report and issue actions | `src/components/tracker/tracker-report-form.tsx`, `tracker-issue-bulk-actions.tsx`, `tracker-issue-saved-views.tsx`, `tracker-issue-copy-actions.tsx`, `tracker-issue-logs-panel.tsx`, `tracker-workflow-panel.tsx` |
| Logs, Known Errors and alerts | `src/components/tracker/tracker-live-logs-explorer.tsx`, `known-errors-workspace.tsx`, `tracker-telegram-manual-panel.tsx` |
| Independent finding controls | `src/components/tracker/independent-finding-actions.tsx`, `audit-finding-status-action.tsx`, `independent-finding-copy-action.tsx` |

The filter-memory and persistence helpers contain no competing visual styling and remain unchanged. Source-only verification; browser screenshots, runtime/typecheck and CI are intentionally not run. Any remaining pixel deviations must be resolved against authenticated desktop/mobile screenshots by the later visual verification owner.

## Final textual cleanup (no runtime execution)

Ten additional `[chat-15]` file edits followed the tracker inventory (nine tracker file edits and one recruiter activity tab fix), bringing this pass to **65 file-edit commits** in total: **31 HR/recruiter edits** and **34 tracker edits**. The follow-up corrected the tracker Logs active environment tab, native report-form control radii, bulk status select typography, live-log input radius, issue screenshots/empty sections, independent finding import status, tracker quick-report control height, similar-issue radius, and recruiter Activity tab sizing. All route delegates and operational behavior were retained.

A source-only pass verified that explicit `min-h-10`/`min-h-11` control classes, `rounded-md` control overrides, and raw deep-teal link colors in the inspected tracker TSX paths were replaced, excluding intentionally independent cards, badges and alerts. `src/components/tracker/audit-finding-filter-memory.tsx` and `audit-finding-filter-persistence.tsx` are nonvisual helpers. The scope still needs authenticated screenshot comparison and independent TypeScript verification; **no tests, typecheck, CI or dev server were run**.
