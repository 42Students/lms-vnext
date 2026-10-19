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

## 2026-10-19 one-hour sprint closing source ledger (lane chat-6, 40 commits including queue)

**Checked-in source work:** Fast-forwarded to `main` `3a77aebd651756d5a16b9fea375ffc276fa4404b` first; 40 new lane commits cover 12 edited source files, plus this ledger and lane queue. Shared `src/components/ui/*`, global skin owner files and AG Grid E8 owner files were not edited.

**G4 report-export judgement cases:** `src/components/placements/report-interactive-table.tsx` now has distinct sorted-column accent, selected visible-column count, precise count-bearing CSV and copy accessibility labels, explicit report toolbar print exclusion, and no stale export status after reset. `src/components/placements/report-interactive-table-export-model.ts` was read but not changed because header and column order are already caller-supplied and CSV formula protection is centralized there. Legacy `docs/design/legacy-grid/gridExport.js.txt` is absent from the checked-in tree; AG Grid E8 export parity remains with its owner.

**G4 import wizards:** Corrected stray dash in learner import styles; preserved existing shared FileUpload as the one drop handler for batch eligibility; used shared StatusBadge with success, warning, neutral, error and info tones across eligibility, academic, college, recruiter and round staging result views. Kept row keys, review filters, CSV column names, native submit/confirmation behavior, URLs and APIs as already authored. Ordinary nested card shells in selection and round-result reviews were flattened onto the single canvas. Recruiter-import CSV output reuses `safeReportCsvCell`, retaining `Row,Status,Reason` header and `recruiter-import-results.csv` filename. College course-content CSV now attaches its download anchor to the document and releases the object URL after the handoff.

**G5 print/PDF:** `src/app/(authenticated)/authenticated-print.css` removes interactive report toolbar regions and stacked-card table treatment in physical print. Faculty report PDF control now explicitly has type button and exposes incomplete-report dialog behavior; authorized Faculty CSV download and college course content CSV have descriptive action labels. No PDF geometry/fonts, email brand colors, certificate or offer-letter document contents were changed without historical reference.

**Final source reread:** All 12 source files changed this turn were re-fetched and checked for stray quote-before-className, isolated dash classes and shared-component paired tags. Only self-closing `Tabs` elements appeared unmatched in a naive opener/closer count; they are intentionally `/>`. A source reread is NOT a TypeScript parser, responsive run, print preview or CI result.

- [ ] **G4 strict tick OPEN** — legacy grid export reference absent, exhaustive render/value/responsive comparisons missing; global source greps and live keyboard/browser verification not run.
- [ ] **G5 strict tick OPEN** — old printed PDF/certificate/letter/receipt artifacts and provider-hosted ZeptoMail template HTML unavailable; exact visual/print/email-client comparison impossible from these source files.
- [ ] **Unresolved next source file:** `src/modules/courses/faculty-report-pdf.ts`; compare its existing PDF stream only with real legacy letter/PDF samples when supplied. Then compare hosted email HTML with legacy output. Do not invent styling or mark parity complete.

**No CI, no tests, no lint, no typecheck, no app execution.** Codemod `scripts/codemods/chat6-report-export-links.cjs` from previous turn remains an orchestrator-run dry-run/apply instruction, not executed here.

## Scoped PDF/export file audit — 2026-10-19 (current lane)

**Work queue — source remediation completed; G4/G5 parity ticks remain OPEN.**
- [x] `src/modules/courses/faculty-report-pdf.ts`: keep section heading, divider and first result on one PDF page where possible; preserve existing PDF/1.4 stream, output escaping, Courier, page size and footer
- [x] `src/components/courses/faculty-report-download.tsx`: failed-download anchor/object URL cleanup, 44px touch target through 767px, shared secondary Button, incomplete-report ConfirmDialog and print-hidden control
- [x] `src/components/courses/faculty-report-csv-download.tsx`: source-backed 44px phone / 36px desktop link, legacy keyboard focus 2px / 3px and `--lms-primary-text`, print-hidden action
- [x] `src/components/courses/college-content-csv-export.tsx`: fail-safe object URL/anchor cleanup, shared secondary Button, phone/desktop hit targets and print-hidden action; CSV header and caller filename preserved
- [x] `tests/unit/faculty-report-pdf.test.ts`: added source-only regression coverage for a section heading that would otherwise be orphaned at the end of the page; **test not executed**

### Property/value ledger with exact source positions

| Property and state | Historical reference value | vNext source value | Source verdict |
|---|---|---|---|
| Phone action touch height (up to 767px) | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193,209-214`: 44px | `faculty-report-download.tsx:50`; `faculty-report-csv-download.tsx:14`; `college-content-csv-export.tsx:22`: `min-h-11` = 44px until `md` | **Matches responsive source rule**, not rendered proof |
| Desktop action height (from 768px) | `docs/design/ui-clone-checklist.md:46-47`: live TPO 36px | Same three files: `md:min-h-9` = 36px; `src/app/globals.css:331` `--lms-control-height:36px` | **Matches source rule**, render/computed styles unverified |
| Keyboard focus ring thickness | `components___accessibility.scss:19-21`: solid 2px | `faculty-report-csv-download.tsx:14`: `focus-visible:outline-2` | **Matches** |
| Keyboard focus ring offset | `components___accessibility.scss:19-21`: 3px | `faculty-report-csv-download.tsx:14`: `focus-visible:outline-offset-[3px]` | **Matches** |
| Keyboard focus ring color (light theme) | `components___accessibility.scss:19-21` uses `$teal-text`; `components___variables.scss:12` = `#1a95a1` | `faculty-report-csv-download.tsx:14` uses `--lms-primary-text`; `src/app/globals.css:29` = `#1a95a1` | **Matches light-theme source** |
| Shared secondary control radius | `components___button.scss:1-12` uses older generic 8px; later observed TPO button spec `ui-clone-checklist.md:46-47` says 9px | `src/app/globals.css:333` `--lms-control-radius:9px`; secondary Button and CSV link inherit token | **Matches newer TPO owner spec**, not old generic button |
| Paper-only action hiding | No old LMS printed report rule among 24 checked-in SCSS files | PDF/CSV wrappers use `print:hidden` (PDF/Faculty CSV), college CSV Button `print:hidden` | **Unverifiable against old paper output** |
| PDF media box, page size | No corresponding historical PDF source in `docs/design/legacy-styles` | `faculty-report-pdf.ts:13,98`: 595 × 842 points | **Open** |
| PDF font, body/footer positions | No comparable legacy PDF font/margins | `faculty-report-pdf.ts:85,89-98`: Courier, 9pt body, 8pt footer, left 42pt, top 48pt, 12pt leading, footer baseline 35pt | **Open** |
| Section heading widow prevention | No legacy PDF section pagination source | `faculty-report-pdf.ts:54-70`: reserve first heading and row before breaking; `tests/unit/faculty-report-pdf.test.ts` exercises threshold | **Source behavior covered, unexecuted** |
| Download cleanup on success/failure | No legacy download-object lifetime specified | `faculty-report-download.tsx:23-41`, `college-content-csv-export.tsx:5-20`: remove anchor; delayed URL revocation on handoff, immediate cleanup on failed handoff | **Source behavior covered, unexecuted** |
| Email header/footer/CTA, offer letter, certificate/receipt appearance | External hosted templates; no matching output provided | Code uses template keys/merge data; no faithful visual source | **G5 blocked** |

### Source grep proof and responsive scope

The following counts come from complete **GitHub connector file reads** of exactly the five listed files (four production sources plus the PDF unit test); they are not a local shell execution or a repository-wide grep.

| Scoped expression (equivalent to `grep -oE` over each file) | Observed total in all five files |
|---|---:|
| `<button[ >]` / `<input[ >]` / `<select[ >]` / `<textarea[ >]` | 0 / 0 / 0 / 0 |
| `<table[ >]` | 0 |
| Hard-coded CSS hex (`#[0-9a-fA-F]{3,6}`) | 0 |
| `rounded-full` / `border-b-2` hand-rolls | 0 |

For reproducibility in a checkout: `grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,6}|rounded-full|border-b-2' src/modules/courses/faculty-report-pdf.ts src/components/courses/faculty-report-download.tsx src/components/courses/faculty-report-csv-download.tsx src/components/courses/college-content-csv-export.tsx tests/unit/faculty-report-pdf.test.ts`. Connector read equivalent: **0 literal matches**. This does not prove a zero across every page/portal.

Responsive source evidence: legacy `@media (max-width:767px)` uses a 44px touch minimum; the controls use `min-h-11 md:min-h-9` with a default `md` breakpoint of 768px. Their row wrapper is `flex flex-wrap`. The PDF document itself is fixed-paper output, not a responsive web page. Actual browser phone/tablet screenshot and printer/PDF viewer proof were **not performed**.

Legacy template discovery: the connected legacy backend `42Students/lms` (`master`, 316 tree items) and frontend `42Students/lms2-fe` (`main`, 783 items) were searched by filename for PDF/print/certificate/letter/receipt/email-template candidates. The frontend contains PDF-viewer components but no named email/offer/certificate template; neither tree supplied an authenticated printed report template. This is filename-level evidence, not a proof that no template exists outside those repositories. Also, all 24 checked-in `docs/design/legacy-styles/*.scss` sources were read and yielded **0** `@media print` or `@page` declarations.

**Strict status:** G4 and G5 stay **[ ]** because their global source coverage, computed visual values, screenshots, printed legacy PDF/letter/receipt/certificate and hosted email HTML are still unavailable. The five entries above mark *scoped source edits/review*, not category parity.

## Replacement lane chat-6 · G4/G5 Super Admin CSV and print pass (2026-10-19)

The replacement lane fast-forwarded `chatgpt/chat-6-b` from `dd845578f6ff97b2d409d8ba81ad2e6fc36a4f15` to current main `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` before writing. The branch had **0** unique commits and was **1,017** behind main; fast-forward preserved the previously merged chat-6 work. These are new scoped source changes, **not** category-level G4 or G5 ticks.

### Work queue · completed source files
- [x] `src/app/(authenticated)/admin/quizzes/page.tsx` — quiz CSV action: responsive hit area (44px phone / 36px desktop), background hover, 2px focus / 3px offset, brand ring, print suppression; export href/label unchanged.
- [x] `src/app/(authenticated)/admin/assignments/page.tsx` — matching CSV anchor states and exact 768px touch boundary; export href/label unchanged.
- [x] `src/components/admin/tenant-directory-csv-control.tsx` — explicit type button, mobile touch target, paper-hidden guarded fetch action.
- [x] `src/components/admin/admin-scoped-csv-control.tsx` — same Super Admin download action treatments; guard, URL and CSV filename retained.
- [x] `src/components/courses/admin-assessment-read-directory.tsx` — seven previously `sm:min-h-9` controls/links retargeted to 768px; pagination gains phone 44px, keyboard ring and hover; filters, pager, offering link excluded from paper report.
- [x] `src/components/admin/admin-scoped-read-page.tsx` — interactive directory filter/refresh and pagination excluded from print; on-screen directory unaffected.
- [x] `src/app/(authenticated)/admin/tenants/page.tsx` — interactive tenant filters and header actions paper-hidden; tenant records retained.
- [x] `src/components/admin/super-admin-people-csv-control.tsx` — explicit button type, 44px/36px break, hide download and helper on printed output.
- [x] `src/components/admin/super-admin-faculty-bulk-import.tsx` — 44px/36px sample/download and submit controls; 44px file picker override; missing `StatusBadge` import restored for existing status cells; sample download anchor attached and released after handoff (no CSV bytes/name changed).
- [x] `src/components/admin/super-admin-student-import-history.tsx` — responsive history trigger and print exclusion.
- [ ] **Next exact file:** `src/components/admin/college-bulk-import.tsx` — source-level drop/upload/confirmation, paper exclusion and 44px touch state comparisons, without changing data or handlers.

### Legacy value matrix (G4 and G5 narrow scope, not a global parity claim)

| Property / state | Legacy source/value | vNext source/value | Status |
|---|---|---|---|
| Phone tap region through 767px | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,190-214` — `$admin-list-touch-min:44px`, mobile max-width 767px | Quiz CSV `src/app/(authenticated)/admin/quizzes/page.tsx:53`, assignment CSV `.../assignments/page.tsx:52`, admin CSV `src/components/admin/{admin-scoped,tenant-directory,super-admin-people}-csv-control.tsx:21,20,23`: `min-h-11 md:min-h-9` | Source classes match threshold; browser check missing |
| Large-screen button height | `docs/design/ui-clone-checklist.md:46-47` — 36px observed legacy TPO control | Export links and shared CSV buttons `md:min-h-9`; 36px CSS utility intended | Source match; computed height not measured |
| Keyboard focus ring | `docs/design/legacy-styles/components___accessibility.scss:18-21` — 2px solid `$teal-text`, 3px offset | Quiz/assignment links `page.tsx:53,52`, directory pager `admin-assessment-read-directory.tsx:107-109`: `outline-2`, `outline-offset-[3px]`, `--lms-primary-text` | Source match conditional on existing token; not tested in browser |
| Hover state for outlined links | `docs/design/old-lms-pages.md:8` — outlined secondary actions; `docs/design/ui-clone-checklist.md:46-47` shared button states | Quiz/assignment links `page.tsx:53,52`, directory page links `admin-assessment-read-directory.tsx:107-109`: `hover:bg-primary-subtle` | Inherits current token; exact computed legacy hover color unproved |
| Printed report interaction chrome | Original authenticated legacy `@media print` not supplied in `legacy-styles` | `admin-scoped-read-page.tsx:87,159,197`; `admin-assessment-read-directory.tsx:31,103`; `admin/tenants/page.tsx:53,64`: `print:hidden` | Safe omission only, **G5 value parity unprovable** |
| Import file picker and results | `docs/design/legacy-styles/pages___admin-list-pages.scss:190-214`: mobile action hit area 44px; original import result visuals absent | `super-admin-faculty-bulk-import.tsx:10,91-111`: FileUpload descendant input 44px/36px, StatusBadge existing outcomes | Partial source match; exact results table/validation states unknown |
| PDF / receipt / offer / certificate / hosted email | Historical output/templates and ZeptoMail HTML not present | Unchanged existing PDF stream / templates | **G5 remains OPEN** |

### Coverage proof (SCOPED; no app or CI run)

All ten source files above were re-fetched from `chatgpt/chat-6-b` after the commits and checked by source regex equivalent to `/<button(?=[\\s>])/`, `/<select(?=[\\s>])/` and `/#[0-9a-fA-F]{3,8}\\b/`. Across the ten fetched files: **0 native button tags**, **0 native select tags**, **0 hard-coded hex literals**. These checks cover exactly the ten listed files, **not** the repository. Link/JSX edits were all matched with exact single-occurrence strings and re-fetched byte-for-byte; shared `src/components/ui/*` files are unchanged.

Reproducible checkout commands still owed for STRICT TICK RULE:
```sh
grep -rlE '<button[ >]' src --include='*.tsx'
grep -rlE '<(select|textarea)[ >]' src --include='*.tsx'
grep -rlE '<table[ >]' src --include='*.tsx'
grep -rlE '#[[:xdigit:]]{3,8}' src --include='*.tsx'
```
**No tests, TypeScript, lint, CI, application, responsive browser or actual print render were executed.** G4 and G5 remain `[ ]` until exhaustive legacy value/state tables, whole-repository source scans, computed styles, and genuine historical PDF/email/print output are available. No parity checkmark asserted.

## chat-6 continued import-wizard pass · next unticked queue batch · 2026-10-19

**Branch reconciliation:** `main` advanced 206 commits after the previous bounded turn. The branch was reconciled through a two-parent merge `869db4a3f79e27bc6833c1cfaef24402ab52f05c`, preserving chat-6's ten modified source files, reconciling the shared ledger append, and taking the new main tree for all other paths. No unique lane work was discarded.

### Work queue (whole-file source pass; not a strict category parity tick)
- [x] `src/components/admin/college-bulk-import.tsx` — complete source pass of open/paste CSV/validation/confirm/row result/print states; shared Button/Select/Textarea/DataTable/StatusBadge/ConfirmDialog retained, handler code unchanged.
- [x] `src/components/college/college-student-csv-import.tsx` — complete source pass of template, three selection fields, upload/paste, preview, row result CSV, confirm and print; shared components retained, permission/data calls unchanged.
- [x] `src/components/college/college-faculty-csv-import.tsx` — complete source pass of template, upload/paste, validation, row report, confirmation and print; shared components retained, no CSV value changes.
- [x] `src/components/tpo/tpo-academic-import-workspace.tsx` — complete source pass of open/template, upload/paste, preview table, inclusion toggles, confirmation and print; same TPO matching and guarded import API path.
- [ ] **Next exact file:** `src/components/tpo/tpo-batch-eligibility-import.tsx` — upload, preview, result chips and print; then `src/components/placements/tpo-selection-import.tsx`.

The following are **source-based value comparisons**; every remaining mismatch / unmeasured state is explicitly left open, not declared a pixel-level match.

### Legacy-source reference values used
`docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214`: 44px minimum touch target under `@media (max-width: 767px)`; `docs/design/legacy-styles/components___accessibility.scss:12-22`: no mouse-only focus outline, keyboard focus solid 2px teal with 3px offset; `docs/design/legacy-styles/components___variables.scss:12,30-40,76-85`: brand text `#1a95a1`, neutral lines `#e5e9f0`, semantic status tones; `docs/design/ui-clone-checklist.md:46-47`: owner-observed button 36px, 9px radius, 14px/650 and hover. `src/app/globals.css:27,334-337` has corresponding vNext text/button tokens. `src/components/ui/button.tsx:10-35` and `status-badge.tsx:5-17` remain shared and unchanged.

#### `src/components/admin/college-bulk-import.tsx`
| Property/state | Old LMS reference | Current file:line and value | Source verdict |
|---|---|---|---|
| Phone launch/import/discard hit height | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `:47,66,69` `min-h-11` = 44px | Matched source |
| Desktop control minimum | `ui-clone-checklist.md:46-47` 36px | `:47,52,66,69` `md:min-h-9` = 36px from 768px | Matched source |
| Secondary/primary button colors, hover and disabled | `ui-clone-checklist.md:46-47` shared variants | `:47,66,69` shared `Button` variants, `disabled={busy}`, `loading={busy}` | Shared source, actual computed values unverified |
| CSV validation failure | `components___variables.scss:79-85` error semantic | `:59,64` `aria-invalid`, `role="alert"`, `text-error` | Semantic token; exact legacy import error visual unavailable |
| Result table | `old-lms-pages.md:9` single canvas, compact hairline table | `:72-80` shared `DataTable`; `StatusBadge` created success, failed error, skipped neutral | Shared source; legacy import-specific row heights unverified |
| Print-only controls | No legacy printed import source in checked-in SCSS | `:47,51,56,62,63,65` `print:hidden`; result region `:72-80` remains | Safe print separation only; no exact print parity |
| Confirmation and empty | No historical college import confirmation specs | `:73-86` shared table empty and both `ConfirmDialog` states | Source behavior preserved; G4 comparison open |

#### `src/components/college/college-student-csv-import.tsx`
| Property/state | Old LMS reference | Current file:line and value | Source verdict |
|---|---|---|---|
| Template and row CSV download hit area | `pages___admin-list-pages.scss:8,193-214` 44px mobile | `:70,137` `min-h-11 md:min-h-9` | Matched source |
| Link focus thickness/offset/color | `components___accessibility.scss:18-21` 2px/3px/`$teal-text` | `:70,137` 2px, 3px, `--lms-primary-text` (`globals.css:29` `#1a95a1`) | Matched source on light-theme token |
| Program/batch/class controls | `pages___admin-list-pages.scss:193-214` 44px mobile | `:77,85,94` shared `Select`, `min-h-11 md:min-h-9`; `:73` selectors grid preserved | Matched source touch minimum |
| Upload input | `pages___admin-list-pages.scss:193-214` 44px mobile | `:101` shared `FileUpload`, descendant input `min-h-11 md:min-h-9` | Matched source target; native picker/platform visuals unverified |
| Validation, pending and confirmation | `components___variables.scss:79-85` semantic error; shared primary button style | `:119-122,133,150-162` shared Button/Checkbox, role alerts, existing disabled/pending guards | Source states covered; exact legacy error/disabled pixels unverified |
| Row results | `old-lms-pages.md:9` compact table/status pills | `:140-148` shared `DataTable` with success/error/warning pills | Source structure aligned; computed table styles unverified |
| Print | No old print sheet available | `:70,73,101,108,119,137,150,161` print-hidden controls; results table visible | Source-only; historical print parity unknown |

#### `src/components/college/college-faculty-csv-import.tsx`
| Property/state | Old LMS reference | Current file:line and value | Source verdict |
|---|---|---|---|
| Template/report download hit height | `pages___admin-list-pages.scss:8,193-214` 44px phone; `ui-clone-checklist.md:46-47` 36px desktop | `:57,90-91` `min-h-11 md:min-h-9` | Matched source |
| Keyboard focus links | `components___accessibility.scss:18-21` 2px teal/3px offset | `:57,90-91` focus-visible 2px/3px, `--lms-primary-text` | Matched source on light-theme token |
| File selection | `pages___admin-list-pages.scss:193-214` 44px mobile | `:60` shared FileUpload with 44px descendant / 36px desktop | Matched source size; WebView native picker still unverified |
| Preview/import disabled/loading | `ui-clone-checklist.md:46-47` shared primary look | `:79-82,109-112` shared `Button` pending/confirmation guards | Shared source; computed disabled/loading and hover unverified |
| Structural error and row pills | `components___variables.scss:79-85` status semantics | `:88,94-100` error role/color and shared status tones | Matched semantic source, not historical import screenshot |
| Print separation | No source legacy print template | `:57,60,73,79,90-91,105,109` print:hidden on input/controls, results table retained | Safe omission; G5 still open |

#### `src/components/tpo/tpo-academic-import-workspace.tsx`
| Property/state | Old LMS reference | Current file:line and value | Source verdict |
|---|---|---|---|
| Open/preview/confirm action touch area | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `:102,129,163` shared `Button` `min-h-11 md:min-h-9` | Matched source |
| Template link keyboard state | `components___accessibility.scss:18-21` 2px teal/3px offset | `:118` link focus-visible 2px/3px and `--lms-primary-text` | Matched source on light-theme token |
| File input and pasted data | `components___form.scss:23-33` mouse focus removal; `pages___admin-list-pages.scss:193-214` 44px phone | `:121,123` shared FileUpload/Textarea; input 44px/36px | Shared inherited source; original drop-area state metrics missing |
| Match/invalid table and badges | `old-lms-pages.md:9` compact list/data table and status pills | `:139-153` shared `DataTable`, success/warning `StatusBadge`, per-row Checkbox | Structural match; exact historical cells/badges unknown |
| Review/confirmation and failure | No old import wizard result-state source | `:134-177` existing guarded preview, row inclusion, Dialog, alerts/status messages | Behaviors retained, no pixel-level claim |
| Paper output | No legacy TPO import printer stylesheet | `:102,118,121,123,129,155,163` interactive controls hidden; results table retained | Source-only G5 print baseline |

### Scoped grep proof and responsive-state audit

All **four complete TSX files** were retrieved again after mutation. They contain **zero** case-sensitive native `<button`, `<input`, `<select`, `<textarea`, `<table` elements and **zero** hard-coded CSS hex literals. Existing shared imports and opening/closing tag pairs were retained. Per-file counts:

| File | Native button/input/select/textarea/table | Hex literals | `print:hidden` occurrences |
|---|---:|---:|---:|
| `admin/college-bulk-import.tsx` | 0 / 0 / 0 / 0 / 0 | 0 | 6 |
| `college/college-student-csv-import.tsx` | 0 / 0 / 0 / 0 / 0 | 0 | 8 |
| `college/college-faculty-csv-import.tsx` | 0 / 0 / 0 / 0 / 0 | 0 | 6 |
| `tpo/tpo-academic-import-workspace.tsx` | 0 / 0 / 0 / 0 / 0 | 0 | 7 |

Suggested checkout reproduction (NOT executed):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 src/components/admin/college-bulk-import.tsx \
 src/components/college/college-student-csv-import.tsx \
 src/components/college/college-faculty-csv-import.tsx \
 src/components/tpo/tpo-academic-import-workspace.tsx
```

**Responsive source proof:** 0–767px uses `min-h-11` = 44px in actions, inputs and links, matching `pages___admin-list-pages.scss:193-214`; 768px+ `md:min-h-9` resolves 36px matching `ui-clone-checklist.md:46-47`. Student chooser uses `sm:grid-cols-3`, which may show three columns on 640–767px with 44px targets. The row results are shared `DataTable` with phone single-row-card presentation and `sm:` table layout (see `src/components/ui/data-table.tsx:49-100`); no new page-specific overflow or fixed width was added. Print modifiers only suppress interactive widgets; no A4 margins, fonts or page geometry were invented.

**Still open for G4:** exact legacy import wizard drop-zone measurements, hover/disabled/error/empty/stepper visual values, complete repository-wide grep and runtime phone/tablet screenshots. **Still open for G5:** historical printed offer/certificate/receipt/PDF and hosted email templates, computed print output and email clients. No tests/CI/app/browser were run. These are **whole-file source completions**, not strict category parity ticks.
