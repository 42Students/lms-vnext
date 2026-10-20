# Lane chat-12 — A5–A7 icons, brand, links

Source: docs/design/legacy-styles, docs/design/old-lms-shell.css, and original SVGs at 42Students/lms2-fe (branch lms-dev-2026). Branch: chatgpt/chat-12-b.

## Work queue and strict tick status

- [ ] A5 Icons — missing global page inventory, all sizes/strokes/colours/states and proven zero raw-icon instances.
- [ ] A6 Avatars, logo, favicon, tab title — favicon changed to original; avatar, wordmark, title format, responsive proof still unverified.
- [ ] A7 Links — default, hover, focus, visited and external styles still need file-by-file comparison and instance audit.

## Value proof (partial; leave category unticked)

| Property | Legacy path:line and value | vNext path:line and value | Match? |
|---|---|---|---|
| Favicon geometry | lms2-fe/public/favicon.svg:1-4 — 596x519 viewBox; two original paths | src/app/icon.svg:1-4 — exact same SVG copied, trailing newline only | Yes |
| Favicon dark/light | lms2-fe/public/favicon.svg:2-3 — #266891 / #ADE2E7 | src/app/icon.svg:2-3 — #266891 / #ADE2E7 | Yes |
| Search image | lms2-fe/public/assets/images/common/search.svg:1 — width and height 19px | public/assets/images/common/search.svg:1 and src/components/tpo/grid/grid-workspace.tsx — exact vector, mounted in search button | Yes, one instance |
| File/document image | lms2-fe/public/assets/images/common/file-black.svg:1 — 16px | public/assets/images/common/file-black.svg and grid-workspace.tsx — exact original vector | Yes, one instance |
| Semantic icon colours | docs/design/legacy-styles/components___variables.scss:45-49 — teal #26bac7, amber #ed9c2c, purple #9c6bcc, green #059669 | src/app/globals.css:14,52-54 — same palette variables | Tokens yes; actual callers unknown |
| Header avatar sizes | docs/design/legacy-styles/components___header.scss:129-150 — wrap 52x52, icon 45x45 | src/components/shell/topbar and sidebar implementations have separate owners | Not compared |
| Link colour | legacy-styles/components___variables.scss:11-16 — #26bac7 primary, #1a95a1 text; components___common.scss:69-73 uses primary | src/app/globals.css:20 — link text #26bac7; some pages use text-link | Partial, link states unknown |
| Tab text | Legacy public/manifest.json:2-3 — app name 42 LMS, not proof of browser title | src/app/layout.tsx:11-13 — 42LMS, template %s · 42LMS | Not verified |

Restored original SVG assets to public/assets/images/common/: back.svg, bell.svg, chat.svg, dropdown-arrow.svg, file-black.svg, plus.svg, search-icon.svg, search.svg, star-yellow-icon.svg, upload.svg, right.svg, message-square.svg, new.svg, contact.svg, check-mark.svg, left-arrow.svg, power.svg, send-icon.svg, tooltip.svg, clock.svg. No shared UI component was edited.

## Coverage and responsive proof still missing

No local grep or runtime/browser checks were executed (dev-only, no code execution/CI). Therefore counts are UNKNOWN, not zero. Commands for later source audit:

- grep -rnE '(<svg|<img|lucide-react|@ant-design/icons)' src --include='*.tsx'
- grep -rnE '(text-link|lms-inline-link|hover:underline|visited:)' src --include='*.tsx'
- grep -rnE '(avatar|logo|favicon|metadata.*title)' src --include='*.tsx'

For each match, compare hover/active/focus/disabled, external indicator, phone/tablet collapse and exact icon size/stroke/fill. A5–A7 remain open until all greps and value rows match.

## Next ownership-safe sweep

- src/components/shell/topbar/icons.tsx: still custom SVG; chat-13 owns its edits.
- src/components/shell/sidebar-nav.tsx: sidebar icon family; chat-19 owns its edits.
- src/app/(authenticated)/tpo/companies/page.tsx: chat-12 next editable page to migrate actions, links and sheet toolbar.
- Do not modify src/components/ui/*, src/app/globals.css or src/app/layout.tsx (chat-17 ownership).


## Bounded continuation — 2026-10-19, source review

Branch was fast-forwarded to the then-current main before this sweep. Directory inventory was explicitly retrieved through the GitHub repository contents API, not a local shell grep:

| Asset coverage | Old LMS at lms2-fe/public/assets/images/common | vNext at public/assets/images/common | Result |
|---|---|---|---|
| SVG icon asset filenames | 46 SVGs, repo contents listing | 46 SVGs, repo contents listing | All 46 names present; 0 missing SVG names |
| Bitmap assets | error.png, recording.png | Both still absent | **Open**, not exact full asset clone |
| Original header avatar | legacy-styles/components___header.scss:129-159: 52x52 wrap and 45x45 inner, round cover | src/components/ui/avatar.tsx:16-22 has lg 52x52 border/padding and 45px image intrinsic sizing | Inexact/needs rendered comparison; shared component owned by chat-17 |
| Notification avatar | legacy-styles/components___dropdown.scss:59-70: 38x38 radius 10px | Shell topbar and notification drawer controlled by chat-13/chat-16 | Open |
| Link colour and hover underline | legacy-styles/components___common.scss:69-74: $clrThird teal and hover underline | src/components/tpo/tpo-companies-spreadsheet.tsx:44-56: text-link and underline; focus-visible outline for external URL | Visual style partly aligned, visited state and full inventory open |
| External company link security | Old external URL treatment not confirmed | src/modules/placements/tpo-safe-company-url.ts:1-11 only permits explicit http(s) URLs without credentials; company grid:50-58 opens target=_blank with rel=noopener noreferrer and disclosed new-tab label | Safety improvement, not claimed as pixel-level old-style match |

**14 additional legacy SVGs restored this turn:** Menu-Icon.svg, analytics.svg, arrow-radio-right .svg, chat-submit.svg, chat2.svg, check-ar-white.svg, dropdown-arrow-2.svg, existing-student.svg, help-support.svg, left-ar-green.svg, plusBlack.svg, question-yellow.svg, surveys.svg, x.svg. SVG shapes and fixed fills are preserved from lms2-fe/lms-dev-2026. Existing vNext assets untouched.

**Strict tick rule:** A5, A6, A7 remain **[ ]**. Only the asset filename inventory is complete. No repository-wide icon caller grep, legacy/vNext state-by-state stroke audit, no phone/tablet proof, no full avatar tab-title check and no side-by-side comparison were performed. The user specifically disallowed running code/CI; do not count the API directory listing as source grep coverage. Shell owner lanes remain chat-13/chat-19, shared UI owner remains chat-17.

**Exact next A5/A6/A7 source file:** src/components/tpo/tpo-company-memory-workspace.tsx (review its avatar/person links and activity timeline icons), then src/components/tpo/recruiter-leads-workspace.tsx. Keep untouched all shared UI components and topbar/sidebar owned by other lanes.

## Bounded continuation — icon, avatar and link source checks (2026-10-19)

| Property | Legacy source and literal value | Current vNext source and literal value | Status |
|---|---|---|---|
| Recruiter create icon | Original common/plus.svg:1-4, 16×16 white 2px strokes | public/assets/images/common/plus.svg:1-4 and src/components/tpo/recruiter-leads-workspace.tsx:643-647, Image 16×16 | SVG matched; button spacing is not browser-verified |
| Contact links | legacy-styles/components___common.scss:69-74, teal link and underline on hover | recruiter-leads-workspace.tsx:1032-1034, text-link, lms-inline-link, focus-visible outline | Partial; no visited/phone screenshots |
| Board links | Same SCSS:69-74 | recruiter-leads-workspace.tsx:1094-1096, text-link and hover underline, visible focus | Partial |
| Topbar avatar | legacy-styles/components___header.scss:129-159: 52×52 outer wrap and 45×45 circular inner | src/components/shell/topbar/topbar.module.css:53-58: desktop 42×42 outer, 38×38 inner; at :111-113 phone outer 40, inner 36 | **Mismatch identified**, owned by chat-13; do not silently tick A6 or overwrite shell |
| Notification avatars | legacy-styles/components___dropdown.scss:59-71, 38×38 radius 10 | Shared topbar/avatar system and notification content not fully compared | Open |

**Action and ownership:** A5/A6/A7 remain unticked. Full family and active/hover/disabled/focus states across every portal, font icon aliases, avatar fallbacks, favicon format and tab-title format require owner coordination. Icon and link source checks above are not responsive proof. The main browser/topbar shell is chat-13/chat-19 owned, so no edits were made to shell or src/components/ui.

**Exact next A5–A7 file:** src/components/tpo/tpo-company-memory-workspace.tsx, then corresponding company/recruiter activity avatar and outbound link states.


## chat-12 continuation — company and Team avatar/link pass (2026-10-19)

| Visual element | Legacy evidence | vNext source evidence | Result |
|---|---|---|---|
| Person avatar shape | docs/design/legacy-styles/components___dropdown.scss:59-71 — notification person image 38px × 38px, 10px radius | src/components/tpo/tpo-company-memory-workspace.tsx:294-314 uses shared Avatar at explicit 38×38px, 10px radius with name-only placeholder; src/app/(authenticated)/tpo/team/page.tsx:101-109 uses same sizing | Value aligned for *these rows*; old People-avatar source not proven |
| Profile avatar | docs/design/legacy-styles/components___header.scss:129-159 — ring wrap 52px, photo 45px, circular | src/components/shell/topbar/topbar.module.css:53-58 — 42px outer, 38px inner | Mismatch still open (chat-13 owns shared shell) |
| Company People links | components___common.scss:69-74 — teal (#26bac7) and underline on hover | tpo-company-memory-workspace.tsx:297-303 — text-link, lms-inline-link, focus-visible outline | Focus added, visited state unverified |
| Company Documents links | same SCSS | tpo-company-memory-workspace.tsx Documents section — text-link underline, keyboard focus | Partial, no visual screenshots |
| Company drive role links | same SCSS | src/components/tpo/tpo-company-memory-drive-grid.tsx:29-36 — teal with hover underline and keyboard outline | Source match on text state, browser proof open |
| Team workload links | same SCSS | src/app/(authenticated)/tpo/team/page.tsx People metric links — text-link, underline, lms-inline-link and focus outline | Partial |
| Team sort and conversation links | same SCSS | src/app/(authenticated)/tpo/team/page.tsx:90-95 and conversation link — visible keyboard focus | Partial |
| Student history and participation links | same SCSS | src/components/tpo/tpo-students-spreadsheet.tsx:237-242 — text-link, lms-inline-link, focus-visible | Partial |
| Company directory links, outbound URLs | same SCSS, old external-link treatment still incomplete | src/components/tpo/tpo-companies-spreadsheet.tsx:44-74 — teal, focus-visible; only verified safe http(s) websites open with rel=noopener noreferrer | Partial |

**Identity/privacy:** The company and Team data surfaces do not supply verified profile-photo URLs. Avatar uses name initials; it does not fabricate a photo, infer one from email, or access a different tenant. No shared UI avatar implementation was changed.

**Unclosed A5–A7:** Full multi-portal icon family source-instance inventory, header/avatar photo states, visited links, exact external-link indicator, mobile/tablet screenshots, logo/wordmark/tab-title, and zero-mismatch source grep. These checkpoints remain **[ ]** per STRICT TICK RULE, regardless of the focused fixes above. Original 46/46 common SVG asset inventory remains the only complete asset-name coverage claim.

## 2026-10-19 chat-12 — next scoped verification and batch pages

The following two files were checked against the legacy page anatomy and link/token rules, without changing other lanes' shared components.

| Page / element | Legacy source file:line | vNext source file:line | Finding |
|---|---|---|---|
| Batch navigation links | `docs/design/legacy-styles/components___common.scss:68-75` teal `$clrThird`, hover underline | `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx:38,49-56,59,69,113,122-127` `text-link`, `lms-inline-link`, 2px focus outline | 9/9 Link tags use visible focus, hover provided by legacy shared skin / explicit hover on action links |
| Batch tabs | `docs/design/old-lms-pages.md:8` one tab strip directly on the white page canvas | `page.tsx:47` shared TpoBatchWorkspaceTabs; duplicate bottom nav eliminated | One source instance |
| Batch suggestion strips | `old-lms-pages.md:11` thin light-yellow strip | `page.tsx:48-56` `border-l-2 border-warning bg-warning-subtle` | Warning color token retained; rendered-tone proof pending |
| Bulk-review selection rows | `docs/design/old-lms-shell.css:31-32` 44px TPO action target, teal 2px focus | `src/components/tpo/tpo-roster-verification-bulk.tsx:66,72` 44px `min-h-11` and 2px focus-within on the labelled checkbox rows | Source rules aligned; no icon/remote photo introduced |
| Exact phone/tablet boundary | `old-lms-shell.css:68-85` mobile below 768px, tablet above | `tpo-roster-verification-bulk.tsx:71` one column below `md`, two above; `batches/[batchId]/page.tsx:96` two metric columns below `md`, four above | Source breakpoint equals 768px, browser unverified |

**File-scoped coverage proof:** source-equivalent regex scan of fetched `tpo-roster-verification-bulk.tsx` and `batches/[batchId]/page.tsx` for `<(button|input|select|textarea)`, `<svg`, and six-digit `#hex` returned **0** in each. The batch overview had **9** opening and **9** closing Next.js Link elements and **9** `focus-visible:outline-2` instances; no raw anchor/inline SVG icons were introduced. The verification component has no navigational Link and needs no additional icon under its existing wording. These are *scoped* proof counts, not a whole-repository zero-instance claim.

**Strict-tick limitations:** A5/A6/A7 across all portals remain unchecked. Visited/external-link states elsewhere, the existing topbar avatar-size mismatch, exact image/icon family across other lanes, and rendered phone/tablet screenshots remain unresolved. Do not treat these two scoped checks as full global icon/avatar/link completion.

## Batch Students, keyboard actions, saved-view links — 2026-10-19

| Item | Legacy file:line and value | vNext file:line and value | Status |
|---|---|---|---|
| Teal links | `docs/design/legacy-styles/components___common.scss:68-75`: `$clrThird`, weight 500, underline on hover | `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx:79-80,83,153-160,200-208`: `text-link lms-inline-link`, focus-visible outline, 44px primary targets | Source aligned, full visited-state and browser proof open |
| Badge shapes and colours | `docs/design/old-lms-pages.md:10`: small status pills for student decisions | `.../students/page.tsx:68-69,179-184`: shared Badge with warning, neutral, success/error for learner state | Shared icon-free pill, rendered colours not independently measured |
| Toolbar selection | `lms2-fe/src/components/tpo/grid/TpoGrid.jsx:59-62,224-228`: keyboard selection/copy | `src/components/tpo/tpo-batch-student-keyboard-actions.tsx:1-2,35-64`: shared Button/Checkbox, icon-free text actions and guarded editable-target bypass | Source aligned |
| Saved-view download | `lms2-fe/src/components/tpo/grid/GridWorkspace.jsx:410-438,449-455`: Views menu and Export action | `src/components/tpo/tpo-batch-student-saved-views.tsx:85-95`: scoped saved-view list, 44px link with visible focus | Source aligned |
| Responsive list/navigation | `docs/design/old-lms-shell.css:68-85`: mobile below 768px, tablet from 768px | `.../students/page.tsx:104`, `.../keyboard-actions.tsx:56`, `.../saved-views.tsx:85`: grid-cols-1 to md:grid-cols-2 (and xl grid expansion) | Authored source matches; rendered phone/tablet still unverified |

**Scoped JSX/asset grep equivalents (full GitHub-fetched file content):** batch Students, batch keyboard-actions, and batch saved-views files each have 0 literal raw button/input/select/textarea tags, 0 six-digit hex colours, 0 inline SVGs and 0 nested canvas cards. Batch Students Link opening/closing tags = 6/6, Badge opening/closing = 3/3, 8 focus-visible outlines. Keyboard action Button opening/closing = 4/4 and missing Checkbox import has been repaired. Saved-view Button opening/closing = 6/6. No image sources or user photos were invented.

**Global status:** A5/A6/A7 remain **[ ]**. The shared DataTable renders a mobile/desktop transition at 640px; old LMS mobile boundary is 768px. Topbar avatar 42/38px vs old header's 52/45px is independently still open. No live responsive screenshot or full-repo link/icon inventory was performed, so this appendix is not a global tick.


## chat-12 replacement — company AG sheet and academic template links (2026-10-19)

| Element | Legacy source/value | vNext source/value | Result |
|---|---|---|---|
| Company external website action | `docs/design/legacy-styles/components___common.scss:68-75`: teal link; underline on hover | `src/components/tpo/tpo-companies-spreadsheet.tsx:61-67`: text-link, lms-inline-link, underline, teal focus-visible ring; disclosure via accessible new-tab label and ↗ indicator | Source style aligned, visited/raster still open |
| Company directory open action | `old-lms-pages.md:9-10`: compact table with row links and actions | `tpo-companies-spreadsheet.tsx:53-74`: named accessible Quartz cell button opens original companyHref through router, row action Create drive remains Link | Source interaction retained, live keyboard proof open |
| Company drives open action | Legacy `lms2-fe/src/components/tpo/grid/TpoGrid.jsx:14-28`: native grid action and compact row | `src/components/tpo/tpo-company-memory-drive-grid.tsx:61-69`: native grid primary role button with name-based aria-label, original drive route via router | Source action retained, native rendered proof open |
| Academic import template download | `components___common.scss:68-75`: teal link and hover underline; `old-lms-shell.css:27-32`: 44px interactive target | `src/components/tpo/tpo-academic-import-workspace.tsx:119-124`: download template anchor, min-h-11, text-link, lms-inline-link, underline and focus-visible outline | Source matched, responsive click test open |

**Source scan:** the company directory, company drives and academic import workspace each contain **0** literal raw form control tags, inline SVG or six-digit color literals. Company directory JSX Link open/close **1/1**, curly braces **40/40**. Company drives JSX curly braces **35/35**. Academic import Button, Dialog, label and section counts are listed in clone-sheets.md. Native AG Grid rows use the existing `TpoGrid` with a phone fallback at `md` (768px); app-wide icon/visited hover, topbar avatar dimension and actual browser responsive proof remain **unverified**.

**A5 / A6 / A7 remain [ ]** under strict tick rule; no claims of repo-wide zero mismatches or pixel-level screenshot verification. Next visual sweep is `src/components/tpo/recruiter-leads-workspace.tsx`, working only in chat-12-owned source and not `src/components/ui/*`.


## chat-12 continuation — Engage and TPO import links/icons (2026-10-19)

| A5–A7 property | Legacy measured/source value | Current vNext source | Result |
|---|---|---|---|
| Create recruiter icon | lms2-fe/public/assets/images/common/plus.svg:1-4 is original 16×16 white plus with 2px stroke | recruiter-leads-workspace.tsx:675-680 Image source /assets/images/common/plus.svg width=16 height=16, aria-hidden | Source asset matched; rendered baseline pending |
| Nav/campaign actions | old-lms-pages.md:7 one-row action toolbar; old-lms-shell.css:31-32 44px interactive rail/tap and 2px teal focus | recruiter-leads-workspace.tsx:669-681 PageHeader actions preserve three Link routes, primary shared Button, responsive min-h-11 md:min-h-9 | Source sizing / breakpoints compared; final browser focus still open |
| Company profile/people links | legacy-styles/components___common.scss:68-75 teal text, weight500, hover underline | recruiter-leads-workspace.tsx:978-1012 keeps people Link routes in Quartz action cells with text-link, lms-inline-link, underline, 2px teal focus outline and 44px target | Source aligns; visited and actual hover paint unmeasured |
| Saved-view actions | old-lms-pages.md:9 outlined toolbar/Views; old-lms-shell-spec.md:24-25 9px radius 36px desktop | recruiter-saved-view-controls.tsx:85-137 uses 9 shared Button; min-h-11 phone, default shared size and focus, no custom raw button | Source aligns; disabled/hover browser proof pending |
| Academic eligibility template | components___common.scss:68-75 teal hover-underline, old-lms-shell.css:31-32 2px teal focus | tpo-batch-eligibility-import.tsx:111 min-h-11, teal text-link, lms-inline-link and focus-visible outline | Source match |
| Import controls | legacy-styles/components___form.scss:117-143 10px field, 14px font and focus halo | recruiter-leads-workspace.tsx has 10 Input + 16 Select shared controls; all 0 native raw controls in file-scoped regex | Shared implementation applied |

**Source proof:** Full GitHub-fetched recruiter-leads-workspace.tsx: raw button/input/select/textarea **0**, inline svg **0**, 6-digit hex **0**, next Link opening/closing **8/8**. Saved-view controls: raw buttons **0**, inline svg **0**, 6-digit hex **0** and shared Button **9/9**. Phone source styles use min-h-11 and md:min-h-9 at 768px rather than 640px sm. Main shell/topbar and other lane components were not edited.

**Global A5 / A6 / A7 stay [ ]**: shared topbar-avatar, logo/wordmark, browser tab format, full icon-family inventory, all portals' visited/external links, and phone/tablet rendered comparison are not proven here. Next after E8 queue: review any remaining TPO inline images and links without touching other owners' shell/shared UI.


## chat-12 link/tap and icon-family source audit — TPO continuation (2026-10-19)

Exact reference: docs/design/legacy-styles/components___common.scss:68-75 .ln-lnk-ul is teal/weight500 with hover underline; docs/design/old-lms-shell-spec.md:24-25 is 9px radius / 36px desktop toolbar buttons; old-lms-shell.css:68-85 switches mobile to tablet at 768px and enforces 44px phone touch. All changes are scoped source implementation, not raster screenshot proof.

| Component, user-visible action | Legacy property/state | Authored current VNext file/line/source | Scoped evidence |
|---|---|---|---|
| Recruiter CSV import duplicate/result profile links | Teal underline, visible focus, 44px phone hit target | recruiter-lead-csv-import.tsx:224,278, original Link href retained with encodeURIComponent and lms-inline-link | Source two Link pairs 2/2; 0 raw SVG/hex |
| Recruiter detail deep links / mailto / tel | Same teal/underline/focus; external contact actions remain native scheme | recruiter-lead-detail-workspace.tsx:398-490; source links to companies, jobs, mail and phone preserved; min-h-11 and 2px focus | Link 7/7; no fabricated URL/avatar |
| TPO audit item / drive link | Compact row action link, keyboard focus and proper authorized route | tpo-audit-grid.tsx:69-93 rowActions Open item/Open job only for original authorized URLs | Link 2/2; no inferred audit rows |
| Student quick panel | Legacy teal links to eligibility, team discussion, drives, requests; phone 44px | tpo-student-quick-panel.tsx:150-191, min-h-11 md:min-h-9 underline and 2px teal outline, original route retained | Link 7/7; sm 0, md 9 |
| Company memory header actions | Legacy header 36px desktop, 44px phone; focus teal | tpo-company-memory-workspace.tsx:67-69 buttonStyle now min-h-11 md:min-h-9, lms-inline-link teal and focus-visible 2px | Link 10/10; no user-image URL inferred |
| Company Team rich #drive / #company / #student links | Underline teal, keyboard focus and touch | tpo-company-team-conversation.tsx:35-43 rich formatTokens original safe route with min-h-11 md:min-h-9, lms-inline-link, 2px focus-visible | Link 4/4; private same-tenant link semantics retained |
| Team notes, handover and preferences controls | Original compact action/button family, radius9, 36px desktop | tpo-team-decision-toggle.tsx:27 radius token; tpo-team-follow-controls.tsx:30-34; tpo-team-handover.tsx:40-47; tpo-team-message-actions.tsx:28-47; all min-h-11 md:min-h-9 | Source consistent; browser focus/hover unverified |
| TPO batch facet clear-all link | Underline teal hover/focus, 44px phone | tpo-batch-facet-filters.tsx:82; no plain unlabeled link, original clear all route | Link 1/1, raw SVG0 |
| Student note/clipboard/import controls | Shared Button/Input/Textarea/Checkbox family and 44px phone selection | tpo-student-clipboard-actions.tsx:26-49; tpo-student-note-editor.tsx:31-46; tpo-student-nudge-panel.tsx:50-95 | raw native controls0, literal hex0, inline svg0 |

Scoped grep equivalent applied to all edited TPO files (full fetched content): /<(button|input|select|textarea)(?:\s|>)/g, /<svg(?:\s|>)/g, /#[a-f0-9]{6}\b/gi. The current ten Team/composer and company-visibility controls each have 0 occurrences for these raw tokens and 0 sm: styles. Responsive authored phone/desktop height is min-h-11 (44px) and md:min-h-9 (36px) with md=768px; actual browser/OS pixel widths and visited/hover paint not proven.

**STRICT TICK RULE — A5, A6, A7 remain [ ].** The header/topbar avatar and logo, favicon/tab title states, visited/external-link treatment across every portal, all icon-callers' exact stroke/color/size, repository-wide zero-instance grep and phone/tablet screenshots have not been verified here. Shared Table 640px phone breakpoint and shared Quartz 44px versus old 40px header remain other-lane outstanding source mismatches. No application, CI, lint, screenshot or runtime test executed.

## chat-12 follow-through — public invitation and command search links (2026-10-20)

- [x] src/components/tpo/recruiter-invite-landing.tsx — sign-in and join code inputs/buttons use 44px phone and 36px 768px+ target heights; main column at md breakpoint; existing OTP/consent code untouched.
- [x] src/components/tpo/tpo-find-shortcut.tsx — command palette choices now use shared Button and retain role=option/aria-selected, keyboard ArrowDown/ArrowUp, Ctrl+K, scoped href guard; 44px phone and 36px md. Full-search link teal underline/focus with no invented external URL.

| Source file | Legacy value | Exact current vNext evidence (line: code) | File-scoped grep/JSX/phone source proof |
|---|---|---|---|
| src/components/tpo/recruiter-invite-landing.tsx | old-lms-shell.css:23,73 phone <768px; old-lms-shell-spec.md:24-25 36px tablet toolbar; common.scss:68-75 teal link | 25: const actionLink="lms-inline-link inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-rad; 126: <main className={`${authStyles.page} flex min-h-dvh min-w-0 items-center justify-center px-4 py-8 md:py-12`}>; 143: <Button type="button" className="min-h-11 w-full md:min-h-9" onClick={()=>{; 198: className="mt-1 min-h-11 w-full md:min-h-9"/> | raw 0; svg 0; hex 0; Button 6/6; Link 2/2; braces 95/95; sm 0; md 14 |
| src/components/tpo/tpo-find-shortcut.tsx | old-lms-shell.css:23,73 phone <768px; old-lms-shell-spec.md:24-25 36px tablet toolbar; common.scss:68-75 teal link | 79: className="min-h-11 gap-2 md:min-h-9">; 89: maxLength={100} className="mt-2 min-h-11 w-full md:min-h-9"/>; 94: id={"tpo-find-result-"+index} role="option" aria-selected={active===index}; 96: className={"flex min-h-11 w-full items-center justify-between rounded-[var(--lms-control-radius)] px-3 py-2 text-left te | raw 0; svg 0; hex 0; Button 2/2; Link 1/1; braces 55/55; sm 0; md 4 |

Both files were scanned for raw native controls, inline SVG, six-digit hex, button/link pair counts, bracket counts and `sm:` vs `md:` breakpoint tokens. No runtime DOM or browser focus screenshots. **Global A5, A6, A7 remain [ ]** because the complete asset/icon/avatar/tab/visited/external link inventory is unverified.

## chat-12 2026-10-20 — source-scoped TPO mobile icons and links

| Property | Exact old LMS value/source | VNext source/value | State |
|---|---|---|---|
| Five distinct phone footer icons | Legacy MobileFooter.jsx:175-191, 24 × 24px icons; old-lms-shell.css:23,73 phone ends at 767px | src/components/tpo/tpo-mobile-footer.tsx:43-58, five separate Image src, width={24}, height={24}, md:hidden | Scoped source match; raster open |
| More-menu radius, links and focus | old-lms-shell-spec.md:23-24 9px action radius; components___common.scss:68-75 teal hover underline | src/components/tpo/tpo-mobile-footer.tsx:63-67 rounded-[var(--lms-control-radius)], min-h-11, text-link underline and focus-visible ring | Scoped source match |
| Recruiter one-time invite | old-lms-pages.md:7 slim warning, components___common.scss:68-75 links | src/components/tpo/recruiter-leads-workspace.tsx:723,878 border-l-2 warning, teal inline action | Scoped source match |
| CSV action states | old-lms-shell-spec.md:23-24 36px desktop / 44px phone target from shell.css:31-32 | src/components/tpo/tpo-safe-csv-download.tsx:38-42 shared Button min-h-11/md:min-h-9, pending and InlineNotice | Scoped source match |

Source regex equivalent of grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE: all three modified TPO caller files yielded raw forms 0, inline SVG 0 and six-digit hex 0; JSX Link pairs: mobile footer 2/2, recruiter leads 8/8, CSV 0/0; breakpoint sm=0 in each. **Global A5 [ ], A6 [ ], A7 [ ] remain unchecked** pending complete icon/wordmark/avatar/tab/visited/external states and browser mobile/tablet comparison. No CI, app or screenshot executed.