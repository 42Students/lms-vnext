# UI clone audit — G4 reports/import/export and G5 print/PDF/email
Owner: chat-6 · source branch: `chatgpt/chat-6-b` · 2026-10-19

## Scope and tick status
- [ ] **G4 Reports, exports, import wizards and upload steps** (missing: complete coverage proof, full state-by-state and responsive value comparison, all validation previews migrated, live side-by-side check).
- [ ] **G5 Print, PDF/certificate/offer/receipt and email templates** (missing: legacy print/PDF/offer/certificate/email source styles, hosted ZeptoMail template HTML, comprehensive print rule in app, phone/tablet and actual printed/PDF/email visual verification).
- [ ] **Raw Button sweep (Super Admin, auth, shared admin)** (missing: repository-wide coverage count and all long-class instances zero; targeted sampled files already use shared Button).

STRICT TICK RULE: **nothing is ticked** without every comparable property and state, greps over the whole source, responsive evidence, and unchanged behavior. The separate browser/screenshot comparison belongs to section J and is NOT claimed here. This file is an evidence ledger, not an attestation of full parity.

## Reference matrix — value and state evidence (incomplete, no tick claimed)

| Element / state or property | Old LMS source and value | vNext source and value | Finding |
|---|---|---|---|
| Page canvas background | `docs/design/old-lms-pages.md:4` one white canvas on #f1f4f9 shell | `src/components/ui/page-canvas.tsx`, inherited by authentic layouts; used by report pages | Shared shell intended; report-page device verification pending |
| Canvas radius/border/padding | `docs/design/old-lms-pages.md:4` 12px / 1px #e5e9f0 / 24px | Shared PageCanvas token references (not directly evaluated as computed CSS) | Computed equality not certified |
| Report page header placement | `docs/design/old-lms-pages.md:5` title + inline subtitle + right actions | `src/components/ui/page-header.tsx:17-53` row; specific reports not all audited | Partial coverage |
| Report tile structure | `docs/design/old-lms-pages.md:12,21` cards only for independent report options | `src/components/placements/placement-report-ui.tsx:181-193` summary strip; `college-report-navigation.tsx` no longer nests a card | Scope corrected; report tiles not exhaustive |
| Toolbar filter/search/export arrangement | `docs/design/old-lms-pages.md:8` search, Filters, Views, Columns, Export outlined actions | `src/components/placements/report-interactive-table.tsx:67-133` shared Input/Select/Button; column filters and export actions | Exact labels/spacing/state parity not proven |
| Tab underline/count | `docs/design/old-lms-pages.md:7` counted tabs with teal active underline | `src/components/tpo/tpo-batch-eligibility-import.tsx:119-126` shared Tabs | Inherited; token/state matrix owned by chat-14 |
| Upload input focus / mouse focus | `docs/design/legacy-styles/components___form.scss:23-33` removes ring for non-focus-visible input/select | `src/components/ui/file-upload.tsx:82-94` uses shared Input and focus-visible outline | Keyboard focus and exact color still to compare |
| Upload accept + size error | No exact legacy drop-area error source identified in checked-in SCSS | `src/components/ui/file-upload.tsx:67-80` size + accept precheck, visible alert/error | Cannot prove legacy text or error visual |
| Upload disabled/reset | No G4 legacy source states located | `src/components/ui/file-upload.tsx:53-65` clears selection when disabled/unavailable | Behavior inherited; parity not demonstrable |
| Import row table border / responsive | `docs/design/old-lms-pages.md:9` hairlines, compact rows; no import-specific exact pixels | `src/components/ui/data-table.tsx:37-53` responsive/empty; row color via shared tokens | Responsive and exact data-table metrics unproved |
| Buttons default radius | `docs/design/legacy-styles/components___button.scss:1-17` generic .ln-btn radius 8px, 40px high | `src/components/ui/button.tsx:24-28` tokenized radius/control height | Live TPO owner override differs; compare computed TPO variant before tick |
| Buttons current live TPO variant | `docs/design/ui-clone-checklist.md:76` primary #0a7c88, white, radius 9, 36px, 14px/650; hover #086873 | `src/components/ui/button.tsx:10-28` uses CSS variables and md 14px/650 | Actual resolved tokens and hover/focus/disabled not yet checked |
| Buttons on phone | `docs/design/legacy-styles/pages___admin-list-pages.scss:8-9` 44px minimum touch; `docs/design/legacy-styles/components___button.scss:19-21` desktop font variant | `src/components/ui/button.tsx:16-21` icon 44px on max-sm; md min var(--lms-control-height) | Variant by variant responsiveness remains unproven |
| Print background and canvas | No old LMS report-specific print stylesheet evidenced in supplied SCSS | `public/assets/static/static-page.css:59` static legal page print rule; `src/app/globals.css` no `@media print` found by checked-in text inspection | G5 open: authenticated print layout unresolved |
| PDF document font/margins | No legacy PDF certificate/offer/report template source found | `src/modules/courses/faculty-report-pdf.ts:11-14,63-90` A4-like 595×842, Courier 9 and 42pt left margin | Distinct layout, not verified clone |
| PDF page footer | No old LMS source found | `src/modules/courses/faculty-report-pdf.ts:84-91` “Page x of y” footer | Value proof absent |
| Email header/footer/CTA | External ZeptoMail provider-managed template, source HTML not in repo | `src/modules/messaging/providers.ts:49-56` sends `template_key` and merge fields; `recruiter-message-email-model.ts:19-40` sanitizes variables | Cannot inspect pixels or make parity claim; no HTML edited |
| Offer, certificate, receipt print | Legacy source reference not located; repo includes evidence/document models | No common template identified on checked-in search | Inventory and comparisons needed |

## Work completed and surface coverage — partial
- Colleges: `src/components/admin/college-bulk-import.tsx` uses shared Button, Select, Textarea, DataTable and ConfirmDialog without hard-coded button skin overrides.
- College faculty: `src/components/college/college-faculty-csv-import.tsx` uses FileUpload (1MB), Checkbox, DataTable and shared Buttons.
- College students: `src/components/college/college-student-csv-import.tsx` uses FileUpload (1MB), Checkbox and shared Button/Select/Textarea; import-specific wording and authorized actions preserved.
- Super Admin faculty: `src/components/admin/super-admin-faculty-bulk-import.tsx` uses FileUpload (1.5MB), DataTable and shared Buttons.
- TPO recruiter leads: `src/components/tpo/recruiter-lead-csv-import.tsx` converted 8 raw locally styled button instances to shared Button variants, FileUpload (10MB), Checkbox and DataTable; preview grouping and guarded commit preserved.
- TPO academic import: `src/components/tpo/tpo-academic-import-workspace.tsx` FileUpload (200KB).
- TPO batch eligibility: `src/components/tpo/tpo-batch-eligibility-import.tsx` FileUpload (1.5MB) retains existing drop target and sheet preview; untouched raw list preview remains for possible table migration.
- TPO selection + round results: `src/components/placements/tpo-selection-import.tsx` FileUpload (2MB); `tpo-round-results-import.tsx` shared FileUpload and Button variants.
- Report surfaces: `src/components/placements/tpo-report-presentation.tsx`, `tpo-report-saved-filters.tsx`, `report-interactive-table.tsx`, `placement-report-ui.tsx`, `college-report-navigation.tsx` migrate style overrides and fix duplicate imports; `src/components/tracker/tracker-report-form.tsx` reuses shared Button variant styles.
- Auth/Admin sampled static source files: `src/components/auth/login-form.tsx`, `device-list.tsx`, `membership-chooser.tsx`, `membership-recovery.tsx` plus `src/components/admin/department-actions.tsx`, `organization-actions.tsx`, `student-rule-editor.tsx`, `person-profile-dialog.tsx`, `tenant-domain-manager.tsx` and multiple others already had 0 native `<button` elements at time of targeted fetch. Do **not** extrapolate this to all app files.

## Grep ledger (commands and counts)
The user explicitly prohibited executing the app/tests/CI. A full cloned-repository grep is not accessible to this connector workflow. Never turn a sampled count into a global zero.

| Scope | Reproducible command to run in a checkout | Observed count | Proof status |
|---|---|---:|---|
| All raw buttons | `grep -rlE '<button[ >]' src --include='*.tsx' | wc -l` | **not run** | Open |
| All native file inputs | `grep -rlE '<input[^>]+type="file"' src --include='*.tsx' | wc -l` | **not run** | Open |
| All native select/textarea | `grep -rlE '<(select|textarea)[ >]' src --include='*.tsx' | wc -l` | **not run** | Open |
| All hand-rolled tables | `grep -rlE '<table[ >]' src --include='*.tsx' | wc -l` | **not run** | Open |
| Styled buttons in scoped import | `grep -o '<button' src/components/tpo/recruiter-lead-csv-import.tsx | wc -l` | **0 (connector fetched file)** | Scoped only |
| Styled buttons in sampled Admin/auth | Same expression on 24 individually fetched `src/components/admin/` and `src/components/auth/` files | **0 in each sampled file** | Scoped only |
| Print rules | `grep -R '@media print' src/app/globals.css` | **0 (fetched 1,096 lines)** | Does not cover other print CSS |
| Hard-coded hex outside tokens | `grep -rlE '#[0-9a-fA-F]{3,8}' src --include='*.tsx' | wc -l` | **not run** | Open |

## 2026-10-19 bounded-turn evidence: branch replay, G4 tables and native buttons

### Confirmed edits (unexecuted)
- Replayed the prior 13 `[chat-6]` commits on top of main `d915bd67b20838f496d2a5b25b4365e748a35dd5` as 13 new commits. The replayed file patches each applied against main without a reported text conflict; no app execution or TypeScript compile was performed.
- `src/components/placements/tpo-round-results-import.tsx`: the missing-applicants review within the import preview is now a shared `DataTable` with Applicant and Application ID, retaining the same row keys and scroll window. The nested muted/card wrapper was removed to preserve the one-canvas legacy page anatomy (`docs/design/old-lms-pages.md:4,9`). Matched rows, unmatched rows and staged results were already using shared `DataTable`.
- `src/components/admin/copy-finding-for-claude.tsx`: native styled button converted to shared `Button variant="secondary"`, retaining its clipboard callback and status message.
- `src/app/(authenticated)/admin/inbound-mail/error.tsx`: native Retry button converted to shared `Button variant="secondary"`, retaining `reset`.
- These are source-level, scoped checks only; device screenshots, keyboard interactions and production print rendering were not checked. G4 and G5 **remain unticked**.

### Work queue — native-button inventory (search + file inspection, NOT a repository grep)
1. GitHub code search `<button repo:42Students/lms-vnext path:src/components/admin` returned **58 candidate files**, all 58 fetched on branch and checked with the case-sensitive literal `/<button(?=[\\s>])/`. **0 remaining native buttons** in those 58 candidate files after the copy-finding conversion. The search also returned uppercase `<Button>` and so its candidate count is not a raw-button count.
2. GitHub code search `<button repo:42Students/lms-vnext path:src/app/(authenticated)/admin` returned **81 candidate files**, all 81 fetched and case-sensitively checked. **0 remaining native buttons** among those 81 after the inbound-mail error conversion.
3. The four code-search candidates `src/components/auth/device-list.tsx`, `membership-recovery.tsx`, `login-form.tsx`, `membership-chooser.tsx` were fetched and had **0 native buttons**.
4. **Outstanding**: all other unsearched TSX files in Super Admin and shared admin ownership, plus repository-wide verification. The exact checkout commands required by the STRICT TICK RULE are:
   - `grep -rlE '<button[ >]' src --include='*.tsx'`
   - `grep -rlE '<button[ >]' src/components/admin src/components/auth 'src/app/(authenticated)/admin' --include='*.tsx'`
   - `grep -rlE '<input[^>]+type="file"' src --include='*.tsx'`
   - `grep -rlE '<table[ >]' src --include='*.tsx'`
   **Not run** because no repository checkout is attached to this connector session. Neither zero global coverage nor absence of multiline native JSX is claimed.

### G5 legacy-source inventory and blockers
- Every checked-in file under `docs/design/legacy-styles/` was searched by reading its contents for `@media print` and `@page`: **0 print stylesheet rules found**. A drawer class `.ln-drawer-pdf` exists in `components___antddesign.scss:688`, but it is not a printed PDF/certificate/receipt page layout.
- `docs/design/old-lms-pages.md:4-12` supplies on-screen legacy canvas and report anatomy, **not** an authenticated print stylesheet. `src/modules/courses/faculty-report-pdf.ts:11-14,63-90` uses a Courier-based PDF stream with distinct page coordinates. There is no verified old-LMS counterpart to compare every print/PDF value against.
- Hosted email template HTML is not present in the checked-in SCSS. Do not invent email header, footer, buttons or PDF font/margins. G5 stays **[ ]** until legacy print/PDF/certificate/offer-letter/receipt/email artifacts and rendered output are available.
- Next G5 file: `src/app/(authenticated)/layout.tsx` (review a dedicated scoped print stylesheet integration against shell owner before changing layout or `src/app/globals.css`; do not edit `src/components/ui/*`).

## Continued G4/G5 bounded turn (2026-10-19, latest main `46cd0161a0e289e7da68e615359589b03ee463e9`)

**Source-level coverage only.** This turn fast-forwarded the lane to the current `main` (branch was 1042 commits behind, 0 ahead at start); no app, lint, build, TypeScript or CI execution. Native JSX tags changed in this turn: the selection/round/academic `<ul>…</ul>` previews and recruiter `<nav>…</nav>` filter groups were each replaced in full; the surrounding `Disclosure`/table semantics and handlers remained.

### G4 report and import changes
- Report filters now inherit shared `Input`, `Select` and `Button` skins without per-page hard-coded colors, radius, borders and focus overrides in:
  `src/app/(authenticated)/tpo/reports/{page,after-college,by-company,season-pipeline,placement-summary,leads,joining-followups,offers-expiry,placed-branch,accreditation,branch-season,unplaced}.tsx` (each actual route uses its `page.tsx`). Existing 44px phone / 36px larger breakpoint utility heights were retained where already present.
- Import preview data and actions: `src/components/tpo/tpo-academic-import-preview.tsx`, `src/components/placements/tpo-selection-import.tsx`, and `src/components/placements/tpo-round-results-import.tsx` use shared `DataTable` for previously hand-rolled row lists; row identity, matching, preview and staged action flow are unchanged.
- `src/components/tpo/recruiter-lead-csv-import.tsx`: row-group hand-rolled primary/secondary pill buttons became controlled `Tabs`, preserving `rowGroup` filtering, with counts supplied from existing current preview and skipped-row state. Responsive horizontal tab scrolling and active underline now inherit the shared Tabs.
- `src/components/{college/college-student-csv-import.tsx,college/college-faculty-csv-import.tsx,admin/super-admin-faculty-bulk-import.tsx,tpo/tpo-academic-import-preview.tsx}`: legacy-style status pills now use `StatusBadge` semantic tones (valid/imported/created success; invalid/failed error; skipped or unresolved neutral/warning).
- `src/components/tpo/tpo-batch-eligibility-import.tsx` and `src/app/(authenticated)/tpo/reports/[slug]/page.tsx`: removed inner-card treatment, keeping the one white authenticated canvas.

### G5 print rule ownership
- Authenticated layout imports `src/app/(authenticated)/authenticated-print.css`, whose rules are scoped to `@media print` and `.lms-shell-frame`, rather than affecting the login/public views. It hides shell chrome, transient controls and report navigation; makes the single canvas printable; repeats table headers; avoids breaking a table row.
- `src/components/placements/tpo-report-presentation.tsx`: existing report-only print styles moved to that CSS file, retaining the separate fullscreen-mode styling and the report's print-hidden forms/buttons, table hairlines and page-header break behavior.
- Legacy print/PDF/offer-letter/certificate/receipt source-value coverage remains **not available** in `docs/design/legacy-styles/*.scss`, and hosted ZeptoMail template HTML is still absent; the new paper baseline is NOT claimed to pixel-clone historical printed artifacts.

| G4/G5 property or state | Legacy source file:line | vNext source file:line | Strict parity outcome |
|---|---|---|---|
| Reports stay on one white canvas; avoid ordinary nested section cards | `docs/design/old-lms-pages.md:4,12` | `src/app/(authenticated)/layout.tsx:114-128`; `src/app/(authenticated)/tpo/reports/[slug]/page.tsx:24` | Partial; canvas source matched, all reports not visually verified |
| Report table hairlines / compact rows | `docs/design/old-lms-pages.md:9`; `docs/design/legacy-styles/pages___admin-list-pages.scss:69-111` | `src/components/ui/data-table.tsx:37-53`; `src/app/(authenticated)/authenticated-print.css` | Partial: print row height and all responsive widths not compared |
| TPO report toolbar search and filters | `docs/design/old-lms-pages.md:8` | `src/app/(authenticated)/tpo/reports/page.tsx:231-249` | Partial: responsive/hover/focus comparisons missing |
| Counted tabs instead of custom pill toggles | `docs/design/old-lms-pages.md:7` | `src/components/tpo/recruiter-lead-csv-import.tsx:205-214`; `src/components/ui/tabs.tsx:63-100` | Partial: controls reuse shared values; browser focus proof missing |
| Paper-only authenticated shell | No legacy `@media print` or `@page` in checked-in SCSS | `src/app/(authenticated)/authenticated-print.css`; `src/app/(authenticated)/layout.tsx:1` | **Not provable**; remain unticked |
| PDF/certificate/offer-letter/receipt/email look | No legacy template HTML/PDF source or hosted email HTML available | `src/modules/courses/faculty-report-pdf.ts:63-90`; `src/modules/messaging/providers.ts:49-56` | **Not provable**; remain unticked |

- [ ] **G4 (missing):** repo-wide source scans over every report/export/import surface, all legacy property-state rows and phone/tablet behavior proofs, side-by-side visual comparison.
- [ ] **G5 (missing):** legacy print/PDF/certificate/offer-letter/receipt template output, hosted email HTML, exact property-state comparisons, physical print preview and PDF/email browser checks.
- [ ] **H Super Admin/shared native controls (missing):** full `grep -rlE '<button[ >]' src --include='*.tsx'` verification and exemptions. This turn intentionally followed the owner's codemod direction and did not hand-migrate already shared controls.

**Next file:** `src/components/placements/report-interactive-table.tsx` — validate report export/sort/filter responsive and keyboard states, then reconcile report CSV links and email document-source inventory. Do not tick without every proof field.

## Next file and unverified work
**Next:** `src/components/placements/report-interactive-table.tsx` — interactive report exports and keyboard/focus/dynamic filtering; then CSV download actions and G5 template evidence.

**SMARTER PLAN repeat-pattern codemod (2026-10-19):** `scripts/codemods/chat6-report-export-links.cjs` targets static TPO report CSV/export `<a>` skin classes in eight explicitly enumerated report files (expected at least 3 candidates). `node scripts/codemods/chat6-report-export-links.cjs` reports a dry run; `node scripts/codemods/chat6-report-export-links.cjs --apply` applies only primary-button color tokens. It preserves anchor tags, hrefs, labels, downloads and layout. **Script committed but not run; orchestrator to apply and typecheck.** No G4 parity tick.

## G5 email/template source inventory (2026-10-19, inspection only)

| Template family | Code-side evidence | Actual legacy HTML available? | Open comparison |
|---|---|---|---|
| OTP email | `src/modules/notifications/zeptomail-email.ts:7-14,62-109` sends `otp`, `learnerName`, `email`, `mobile` and expiry variables via a provisioned ZeptoMail template key | **No** | Provider-hosted header, colors, spacing, footer, CTA and phone email-client rendering |
| Notification/campaign email | `src/modules/messaging/providers.ts:10-24,40-56` resolves provisioned template keys and merge fields; OTP templates are excluded | **No** | Campaign-specific legacy HTML and all rendering states |
| Recruiter message digest | `src/modules/placements/recruiter-message-email-provider.ts:13-29,41-46` selects a distinct digest template with sanitized merge data | **No** | Reply CTA, quoted digest blocks, notification hierarchy, responsive mail rendering |
| Recruiter invitation | `src/modules/placements/tpo-recruiter-invite-email-delivery.ts:11-16,29-35` requires an explicitly verified template key | **No** | Invite body, branding, CTA and disabled/expired link presentation |
| Faculty PDF report | `src/modules/courses/faculty-report-pdf.ts:43-90` assembles a PDF stream programmatically | No historical counterpart identified | Paper geometry, typography, page breaks, footer and actual PDF viewer rendering |
| Learner offer letter | `src/modules/placements/learner-offer-letter-model.ts:2-17` validates an offer-letter URL; it does not define a printable letter design | **No** | Signed document/template source and actual offer-letter evidence |
| Certificate/receipt templates | No complete legacy template was found in the checked-in design references | **No** | Require original HTML/PDF or pixel captures for both sides |

This is a source inventory, **not** visual parity. Do not infer an email or letter design from `template_key` or a sanitized merge-field model. G5 remains `[ ]`.

## G4/G5 judgement-case verification ledger — latest bounded turn

- [x] **Scoped source inspection (not a checklist tick):** `src/components/placements/report-interactive-table.tsx` now offers all column filter inputs even when a column is hidden, resets sort when its column is hidden, disables exports for zero matching rows, retains post-"Show 500 more" selector values, announces row/export status, and gives the mobile sort direction a pressed state. Existing CSV escaping and secure download utilities were left untouched (`src/components/placements/report-interactive-table-{export,download}-model.ts`).
- [x] **Scoped source inspection (not a checklist tick):** `src/components/placements/tpo-report-saved-filters.tsx` now uses an inline canvas section rather than a nested card; stale selected views clear on route/tenant change and the empty view selector is disabled.
- [x] **Scoped source inspection (not a checklist tick):** `src/components/placements/placement-report-ui.tsx` primary CSV link inherits the exact `--lms-button-primary` and hover tokens from the owner's shell spec; it has a specific accessible export label and the report navigation retains visible keyboard focus.
- [x] **Scoped source inspection (not a checklist tick):** authenticated paper output now disables decorative report controls and download links, makes `data-slot="scroll-cue"` overflow visible, hides scroll fades, restores table display on narrow screens, and removes sticky positioning so complete columns can appear on paper. No original printed output is available to compare against.
- [ ] **Still missing for G4:** parity-report style mismatch pairs, runtime responsive screenshots at phone/tablet/desktop, repeated controls migrated by the orchestrator-run codemod, print and keyboard journey validation.
- [ ] **Still missing for G5:** source PDF/offer/certificate/receipt/mail HTML samples, print device/browser output, computed print font/margins and email-client layout comparison.
- **Next file:** `src/components/placements/report-interactive-table-export-model.ts`, checking exact export header names and ordering against the legacy grid/export documentation; do not conflate G4's report CSV with the E8 owner lane's AG Grid exporting.

G4 and G5 remain unticked under the STRICT TICK RULE; no tests, parser, typecheck, runtime or CI were invoked in this lane.

## One-hour G4/G5 sprint continuation, 2026-10-19 — strict-tick source evidence

### Main synchronization and report export model
- Fast-forwarded `chatgpt/chat-6-b` onto `main` commit `3a77aebd651756d5a16b9fea375ffc276fa4404b` before edits; previous 30 lane commits had already been incorporated into main. This sprint owns only new [chat-6] lane commits.
- Read `src/components/placements/report-interactive-table-export-model.ts` and `report-interactive-table-download-model.ts`: exported column order is the caller's `headings` order filtered by visible columns; CSV values are quoted and neutralized for formula-starting strings; CSV receives BOM at browser-download boundary; name helper is `report-<slug>.csv`. No value guessing or rewrite of the model was justified.
- `docs/design/legacy-grid/gridExport.js.txt` is **not in the current main tree**; neither this file nor any `docs/design/legacy-grid/*` entry appeared in the recursive tree listing. As such exact old AG Grid export header/filename matching is NOT verified. E8 AG Grid itself remains the separate owner lane's responsibility.
- `src/components/placements/report-interactive-table.tsx` now visibly distinguishes sorted headings, reports selected/total column count, labels copy/export by shown-row count, and suppresses its toolbars on paper via a scoped `data-report-toolbar` marker. No raw controls were introduced.
- `src/app/(authenticated)/authenticated-print.css` hides those marked report toolbars, neutralizes mobile card/padding on table rows, and still does not set an invented legacy print @page/margin/font.

### Import wizard judgement states
- `src/components/college/college-student-csv-import.tsx`: removed an actual stray literal `-` from section classes and removed redundant primary visual overrides from import confirmation.
- `src/components/tpo/tpo-batch-eligibility-import.tsx`: removed the nested drag/drop handler surrounding the shared FileUpload (which already owns drop interaction), retaining CSV instructions and download; validation outcomes now have neutral/success/warning StatusBadge semantics.
- `src/components/tpo/tpo-academic-import-workspace.tsx`: matched vs unmatched academic import rows now show shared success/warning status pills.
- `src/components/placements/tpo-round-results-import.tsx`: staging outcome pills and error tones; removed ordinary card shells around missing-candidate review, policy group and staged results.
- `src/components/placements/tpo-selection-import.tsx`: removed the nested border card around unmatched selection rows and applies semantic error tone.
- `src/components/admin/college-bulk-import.tsx`: CREATED/SKIPPED/FAILED result pills; removed duplicate scroll container around DataTable and used semantic error tone.
- `src/components/tpo/recruiter-lead-csv-import.tsx`: preview and results status pills; old-LMS slim pale warning strip before confirm; focus/copy status text. Row result CSV now reuses `safeReportCsvCell` for formula neutralization while preserving original header `Row,Status,Reason` and filename `recruiter-import-results.csv`.
- These are scoped SOURCE inspections only, not runtime screenshots or legacy property-value proof. No semantic input field, confirmation, post endpoint or return value was deliberately changed.

### Remaining strict-tick conditions
- [ ] **G4 still OPEN:** exhaustive legacy source-value tables for every wizard/report visual property and default/hover/active/focus/loading/error states; repository-wide grep counts; phone/tablet screenshots; legacy grid export source absent. This turn did not invoke scripts/tests/typecheck/CI.
- [ ] **G5 still OPEN:** no provider-hosted ZeptoMail/other email HTML, old PDF/certificate/letter/receipt templates or actual printed samples in checked-in references; cannot attest to exact font, header/footer, branded button, margin or pagination parity. `authenticated-print.css` is a conservative baseline, NOT a cloned old-LMS print template.
- [ ] **Next work:** `src/components/courses/faculty-report-download.tsx` — compare PDF link wording/state, then `src/modules/courses/faculty-report-pdf.ts` with actual legacy print evidence if supplied; finish unresolved email template source capture once hosted HTML is available.
