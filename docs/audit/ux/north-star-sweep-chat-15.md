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

## 2026-10-19 continuation: HR/recruiter value-level cleanup

Synced `origin/main` into `chatgpt/chat-15-b` after the preceding 20-file HR/recruiter batch. Both upstream and lane edited several HR routes. For identical upstream fixes the main version was retained; where the same JSX line changed differently, newer main content was preserved instead of overwriting it. Unique lane changes to calendar filters, offer tabs, result tabs, notification filters and recruiter controls were replayed as a merge commit. Main was not updated by this lane.

A subsequent **17 individually pushed `[chat-15]` file commits** tightened visual consistency across:

- Employer recorded-outside drive form: 36px inputs, 14px text, 9px token radius and white-on-teal confirmation.
- Recruiter result-editor input sizing, resume download, decision mark-read button and college-access links.
- Both recruiter notification-bell variants, including secondary read-all action states.
- Recruiter Messages college selection, active indicator limited to the READY branch, and conversation-history pagination.
- Drive request college choices, portfolio shortcuts and private review clearing.
- Drive-conversation launch CTA, external-drive back navigation and interview-slot navigation.
- Recruiter Notifications empty state and filter hover state.

The updates touch visual classes and focus/hover states; existing data queries, visibility constraints, submit logic, redirects, and content remain intact. Shared shell/global CSS continues to be owned by the designated shell lanes. Status badges and meaningful contained interview/portfolio cards remain enclosed, avoiding flattening objects that have a genuine card role.

**Source verification:** examined the touched markup and closing tags after edits; none of the inspected files contained a dangling standalone `</Select`/`</Button` or other truncated closing tag. **Not run:** application, TypeScript compiler, lint, tests, CI or browser screenshots. Full old-versus-vNext pixel verification remains pending.


## 2026-10-19 further source-only HR/recruiter sweep: remaining controls and states

The requested `docs/audit/ux/north-star-sweep-15.md` is not present in the repository; this `north-star-sweep-chat-15.md` remains the actual lane checklist and file disposition record.

Read all substantive authenticated HR page implementations, the independent recruiter change-request route and recruiter-owned UI components. The other recruiter routes delegate to HR source implementations, and their error/loading/not-found pages use shared fallback primitives owned by other lanes. Do not add duplicate skins or change those shared files.

**20 new `[chat-15]` file-edit commits** in this pass, pushed to `chatgpt/chat-15-b` only. The changes address source residuals rather than previously completed shell work:

| Group | Residual styling corrected |
|---|---|
| Drive request receipt, stale-drive warning and round editing | White hairline secondary action surfaces, 36px height, 14px text, visible focus, hover-fill; round list empty state no longer creates a redundant inner card |
| Recruiter profile editors | Designation save, name cancel, profile status text and private review save match semantic legacy typography, focus and primary hover |
| Recruiter bell and activity | Notification retry and preview hover/focus, active company picker compact control and Today data-limit pale warning strip |
| Round results and hiring portfolio | Result bulk action focus/hover and white-on-teal submit; hiring portfolio requests show slim amber strip and focused secondary actions |
| Sent proposals and recruiter inbox | 36px legacy college picker, export and pagination controls, pale interview-slot alert, compact notification pager |
| Recruiter pages | Round-removal confirmation, round review drive tile hover, Company/Reports underline tab vertical spacing, Calendar underline tabs keyboard-focus rings |

Upstream main changed several of the same files while this lane was working. Merged upstream with a true two-parent commit; the upstream `<Button>` migration in the round-removal confirmation was deliberately retained instead of resurrecting this lane's native `<button>`. Distinct lane changes were reapplied without overwriting other branches. All commits are on `chatgpt/chat-15-b` only.

Markup and JSX tag-name sequences before/after each change were compared for the ten-file second batch; the first batch also made only class/text styling changes without opening/closing JSX elements. Explicit incomplete `</Select`, `</Button`, `</Link` and native closing lines were checked. Source review cannot certify runtime pixel parity: screenshots and TypeScript verification remain outstanding, and **no CI, test, typecheck or application execution occurred**.

## 2026-10-19 follow-up: shared control migration after prior source sweep

This follow-up added **28 further [chat-15] file commits** on `chatgpt/chat-15-b` (17 HR/recruiter implementation files and 11 tracker files). The earlier checklist's "source complete" meant values had been normalized; these edits close a separate gap where native HTML controls still overrode the shared control kit through long local utility strings. `main` was checked before and after the batch and the branch was 0 commits behind; pushes target this lane branch only.

- **HR/recruiter actions:** `hr-notification-read-button`, `recruiter-decision-read-button`, `recruiter-drive-focus-refresh`, `recruiter-request-cancel-button`, `recruiter-conversation-read-control`, `hr-unsent-drive-alert`, `recruiter-profile-access`, `hr-recruiter-bell`, `recruiter-notification-bell`, and `recruiter-resume-download` now use shared `Button` variants, retaining the existing callbacks, aria labels, loading/disabled guards and conditional displays.
- **Recruiter forms:** `recruiter-display-name-editor`, `recruiter-designation-editor`, `recruiter-profile-details-editor`, `recruiter-private-rating-editor`, `recruiter-round-inline-editor`, `hr-drive-draft-form`, and `recruiter-result-controls` now use shared `Input`, `Select`, `Textarea`, `Button`, and `Checkbox` where applicable. The drive-request form alone replaced 28 native controls and removed the unused local input class; round-result selection retains native checkbox semantics through shared `Checkbox`.
- **Tracker pages/components:** `tracker/issues/page.tsx`, `tracker-quick-report-launcher`, `tracker-issue-saved-views`, `tracker-issue-copy-actions`, `tracker-issue-logs-panel`, `audit-finding-status-action`, `independent-finding-copy-action`, `tracker-workflow-panel`, `tracker-issue-bulk-actions`, `tracker-live-logs-explorer`, and `tracker-telegram-manual-panel` now inherit shared control styles. Positioning is preserved for the floating quick-report launcher and the modal/report workflows are unchanged.

The conversions preserved handler bodies, server endpoints, authorization/visibility guards, control values, keyboard labels, selection state, and the ordering of page contents. Intentionally leave `<input type="hidden">` as native: hidden form fields must not acquire visible input chrome, even though they are not interactive controls. Existing shared widgets remain the responsibility of the shared UI owner.

**Verification:** each edited file received a source-text check for complete JSX opening/closing tag names (including self-closing `Input`, `Textarea`, and `Checkbox`), missing stale local style variables, and unchanged source handlers. No code, TypeScript, runtime, browser, screenshot or CI execution was performed. Exact visual parity and strict typecheck remain unverified until the orchestrator's integration pass.

### Additional HR page controls and upstream integration

Three further [chat-15] source commits completed the remaining visible native form buttons in `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` and `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx` with shared `<Button type="submit">...</Button>` tags, and removed three duplicate shared `Button`/`Input`/`Select` imports from `hr/conversations/page.tsx`. The native `type="hidden"` inputs in these and other HR pages remain intentional unstyled form fields.

During the sweep, `main` advanced by 250 commits. The lane compared both trees against their common ancestor and confirmed that the 44 lane-modified paths and 130 upstream-modified paths were **disjoint**, then built a true two-parent merge based on the upstream tree with the 44 lane blobs overlaid. Merge commit `223cbaa4f8a16278ce61b1991dcf4d0225857614` was pushed to **`chatgpt/chat-15-b` only**. GitHub comparison then reported **56 ahead / 0 behind main**, and representative file SHA reads verified retention of the updated shared `page-canvas.tsx` from main and of this lane's HR/recruiter/tracker files.

This source-only follow-up totals **31 implementation-file commits plus audit changes and the upstream merge**. No application execution, tests, TypeScript compilation, CI or browser screenshots were run. Structural JSX opening/closing checks and duplicate-import checks were performed by reading source text only. Final runtime parity remains for integration verification.