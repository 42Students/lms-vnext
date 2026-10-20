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
| Open/preview/confirm action touch area | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `:102,132,166` shared `Button` `min-h-11 md:min-h-9` | Matched source |
| Template link keyboard state | `components___accessibility.scss:18-21` 2px teal/3px offset | `:121` link focus-visible 2px/3px and `--lms-primary-text` | Matched source on light-theme token |
| File input and pasted data | `components___form.scss:23-33` mouse focus removal; `pages___admin-list-pages.scss:193-214` 44px phone | `:124,126` shared FileUpload/Textarea; input 44px/36px | Shared inherited source; original drop-area state metrics missing |
| Match/invalid table and badges | `old-lms-pages.md:9` compact list/data table and status pills | `:142-156` shared `DataTable`, success/warning `StatusBadge`, per-row Checkbox | Structural match; exact historical cells/badges unknown |
| Review/confirmation and failure | No old import wizard result-state source | `:137-180` existing guarded preview, row inclusion, Dialog, alerts/status messages | Behaviors retained, no pixel-level claim |
| Paper output | No legacy TPO import printer stylesheet | `:102,116,121,124,126,132,158,166` interactive controls hidden; results table retained | Source-only G5 print baseline |

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

### Concurrent-main integration proof (2026-10-19)
The second merge `c0886af430adec3868af30b7059c07c2cea887db` incorporated newer `main` `2808e32a641e1e35f513755b840b6ef892c61163`. For overlapping files, the merge retained the other lanes' **tenant DataTable migration** (`admin/tenants/page.tsx`) and **assessment Pagination migration** (`admin-assessment-read-directory.tsx`), with that pager still `print:hidden` at current line 104. The TPO academic import's concurrent step guidance was kept at `tpo-academic-import-workspace.tsx:116-118`; the import template/export control states are now at lines 121/124/126/132/158/166. Only G4 visual controls were patched over the newer page. The four-file scoped zero-native-control / zero-hex count was reverified after merging. G4/G5 categories remain unticked, with no tests, browser rendering or CI.

## G4/G5 next bounded source batch — lane chat-6

**Scope note.** The following eleven full source files were refetched from `chatgpt/chat-6-b` after all patches and following concurrent `main` merges. Every row is a **source-only property comparison**, not computed style evidence. Screen/table contents, routes, data permissions and submission APIs were not deliberately rewritten. No app, TypeScript compiler, tests, CI, screenshot or print preview was executed. Owner G4/G5 **still remain unchecked** under STRICT TICK RULE; do not treat scoped source edits as a claim of pixel-level historical parity.

### Whole-file source remediation queue
- [x] **Source remediation only** — `src/components/tpo/tpo-batch-eligibility-import.tsx`: Eligibility decision import drawer: opener, FileUpload/CSV, per-row skip, status tab filters, eight-row preview and confirmation; Import results still use shared DataTable and StatusBadge; repaired missing Checkbox import; template download focus uses explicit 2px/3px brand ring. **Still required for strict category tick:** Legacy eligibility drawer-specific spacing, stepper and results print are absent.
- [x] **Source remediation only** — `src/components/placements/tpo-selection-import.tsx`: Company selection import: shared FileUpload, match preview, unmatched explanation, confirm; Paired confirmed shared Button and two DataTables; print expands 52-row and 40-row max-scroll wrappers. **Still required for strict category tick:** Legacy match-preview-specific row heights and disabled text values absent.
- [x] **Source remediation only** — `src/components/placements/tpo-round-results-import.tsx`: Round-result import: file, CSV template, four result preview tables, matching overrides and staging confirmation; CSV template focus 2px/3px, shared FileUpload input 44px; print expands capped containers, hides stage controls. **Still required for strict category tick:** Legacy radio/checkbox and missing-policy print specifics absent.
- [x] **Source remediation only** — `src/components/tpo/tpo-academic-import-preview.tsx`: Page-local TPO academic CSV preview: paste, validate, warning status and result rows; Retained newer main progress guidance, shared Button 44px phone/36px desktop, print rows overflow visible. **Still required for strict category tick:** No legacy exact page-local academic preview values.
- [x] **Source remediation only** — `src/components/placements/tpo-report-presentation.tsx`: Fullscreen report presentation button and error status; Shared Button 44px phone/36px desktop; paper-hidden trigger; preserved aria-pressed, fullscreen handler and listener. **Still required for strict category tick:** Inherited shared Button focus 2px offset (legacy global 3px) not computed.
- [x] **Source remediation only** — `src/components/tpo/recruiter-lead-csv-import.tsx`: Recruiter leads CSV dialog: opener, chooser, tabbed review, filters, grouped rows and result export; All seven paired shared Buttons; CSV template link explicit 2px/3px; result download anchor cleaned up and URL release delayed. **Still required for strict category tick:** Legacy dialog width/focus/drag-drop specific output missing; no visual client check.
- [x] **Source remediation only** — `src/components/placements/report-interactive-table.tsx`: Interactive TPO report table: search, row-size select, column dropdowns, exports, sorting, show more; Shared DataTable; on-screen header Button stays interactive, separate print-only heading text prevents blank printed headers; export CSV model unchanged. **Still required for strict category tick:** Only first currently rendered rows print when limit truncates data; no old print evidence.
- [x] **Source remediation only** — `src/components/placements/tpo-report-saved-filters.tsx`: Saved report filter disclosure: name/selected view inputs and save/apply/delete; Input Select Button 44px phone/36px desktop; Disclosure hidden on paper; browser-local storage behavior unchanged. **Still required for strict category tick:** Legacy filter/disclosure specifics and saved-state visuals not supplied.
- [x] **Source remediation only** — `src/components/placements/college-report-navigation.tsx`: College report links: four separate routes, navigation/keyboard/touch; Each Link 44px/36px, focus 2px/3px brand token, radius shared and nav hidden in print. **Still required for strict category tick:** Exact historical college links and print rules missing.
- [x] **Source remediation only** — `src/components/tpo/tpo-batch-undo-control.tsx`: Eligibility import undo review: Checkbox acknowledgement, Undo action and error; Phone checkbox label 44px, Undo shared Button 44px/36px; entire action hidden on print. **Still required for strict category tick:** Old undo affordance and user-review text layout absent.
- [x] **Source remediation only** — `src/components/placements/placement-report-ui.tsx`: TPO report filters, season/drive choices, route navigation, export link; Select and filter shared Button mobile 44px/desktop 36px, printed report excludes filters/nav; CSV primary export has 2px/3px focus. **Still required for strict category tick:** Native hidden input intentional and not replaced; no old complete print/PDF output available.
- [ ] **Next file:** `src/components/admin/super-admin-faculty-bulk-import.tsx` (review actual template/download print and file-chooser mismatch against other imports), then continue other G4 import/export surfaces.

### Reference properties shared by this matrix
- **Legacy touch rule:** `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` declares `$admin-list-touch-min:44px` for `@media(max-width:767px)`; vNext `min-h-11` is 44px and `md:min-h-9` is 36px beginning 768px.
- **Desktop owner value:** `docs/design/ui-clone-checklist.md:46-47` describes the measured old TPO 36px button, 9px radius, 14px/650 and brand hover; `src/app/globals.css:334-337` defines 36px/9px tokens. The shared Button source is `src/components/ui/button.tsx:10-35`, not edited by this lane.
- **Legacy focus:** `docs/design/legacy-styles/components___accessibility.scss:18-21` outlines 2px solid `$teal-text` and offset 3px; `docs/design/legacy-styles/components___variables.scss:12` and `src/app/globals.css:29` both resolve the light-theme text brand to `#1a95a1`. Shared Button's inherited outline is offset 2px, so its exact global 3px focus parity remains a chat-17 skin question; explicit anchor focus values are local source matches.
- **Legacy table:** `docs/design/old-lms-pages.md:9` describes compact hairline rows and badges; `docs/design/legacy-styles/pages___admin-list-pages.scss:69-111` provides table scroll, font and padding values. Shared `DataTable` at `src/components/ui/data-table.tsx:37-100` carries responsive and table skin rules; exact browser computed rows not inspected.
- **Print historical gap:** Checked-in `docs/design/legacy-styles/*.scss` contains no matching authenticated `@media print` or PDF/receipt/certificate layouts. `src/app/(authenticated)/authenticated-print.css:1-80` is the vNext paper baseline, **not** a validated historical template.

### Value/property evidence by completed source file

#### `src/components/tpo/tpo-batch-eligibility-import.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/tpo/tpo-batch-eligibility-import.tsx:94, 102, 108, 112, 118 (+6 more)` — `min-h-11`, 11 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/tpo/tpo-batch-eligibility-import.tsx:94, 102, 118, 142, 156 (+2 more)` — `md:min-h-9`, 7 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | `src/components/tpo/tpo-batch-eligibility-import.tsx:127` shared DataTable; alerts `src/components/tpo/tpo-batch-eligibility-import.tsx:121, 170`, results `src/components/tpo/tpo-batch-eligibility-import.tsx:120, 171` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/tpo/tpo-batch-eligibility-import.tsx:94, 102, 108, 114, 118 (+4 more)` — 9 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Import results still use shared DataTable and StatusBadge; repaired missing Checkbox import; template download focus uses explicit 2px/3px brand ring | Code reviewed, **not executed** |

#### `src/components/placements/tpo-selection-import.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/tpo-selection-import.tsx:56, 70` — `min-h-11`, 2 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/tpo-selection-import.tsx:70` — `md:min-h-9`, 1 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | `src/components/placements/tpo-selection-import.tsx:61, 80` shared DataTable; alerts `src/components/placements/tpo-selection-import.tsx:82`, results `src/components/placements/tpo-selection-import.tsx:59, 83` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/tpo-selection-import.tsx:56, 70` — 2 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Paired confirmed shared Button and two DataTables; print expands 52-row and 40-row max-scroll wrappers | Code reviewed, **not executed** |

#### `src/components/placements/tpo-round-results-import.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/tpo-round-results-import.tsx:62, 63, 66, 91, 97 (+1 more)` — `min-h-11`, 6 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/tpo-round-results-import.tsx:62, 66, 91, 121` — `md:min-h-9`, 4 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/placements/tpo-round-results-import.tsx:62` — `focus-visible:outline-offset-[3px]` | Explicit link source matches light-theme legacy token; inherited controls require separate computed verification |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | `src/components/placements/tpo-round-results-import.tsx:73, 84, 105, 134` shared DataTable; alerts `src/components/placements/tpo-round-results-import.tsx:144`, results `src/components/placements/tpo-round-results-import.tsx:71, 131` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/tpo-round-results-import.tsx:62, 63, 66, 91, 97 (+2 more)` — 7 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | CSV template focus 2px/3px, shared FileUpload input 44px; print expands capped containers, hides stage controls | Code reviewed, **not executed** |

#### `src/components/tpo/tpo-academic-import-preview.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/tpo/tpo-academic-import-preview.tsx:25` — `min-h-11`, 1 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/tpo/tpo-academic-import-preview.tsx:25` — `md:min-h-9`, 1 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | `src/components/tpo/tpo-academic-import-preview.tsx:28` shared DataTable; alerts `src/components/tpo/tpo-academic-import-preview.tsx:26`, results `src/components/tpo/tpo-academic-import-preview.tsx:27` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/tpo/tpo-academic-import-preview.tsx:22, 24, 25` — 3 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Retained newer main progress guidance, shared Button 44px phone/36px desktop, print rows overflow visible | Code reviewed, **not executed** |

#### `src/components/placements/tpo-report-presentation.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/tpo-report-presentation.tsx:24` — `min-h-11`, 1 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/tpo-report-presentation.tsx:24` — `md:min-h-9`, 1 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | No table in this component; alerts `src/components/placements/tpo-report-presentation.tsx:28`, results `src/components/placements/tpo-report-presentation.tsx:not present` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/tpo-report-presentation.tsx:24` — 1 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Shared Button 44px phone/36px desktop; paper-hidden trigger; preserved aria-pressed, fullscreen handler and listener | Code reviewed, **not executed** |

#### `src/components/tpo/recruiter-lead-csv-import.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/tpo/recruiter-lead-csv-import.tsx:159, 174, 181, 185, 198 (+6 more)` — `min-h-11`, 11 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/tpo/recruiter-lead-csv-import.tsx:159, 174, 181, 198, 203 (+3 more)` — `md:min-h-9`, 8 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/tpo/recruiter-lead-csv-import.tsx:181` — `focus-visible:outline-offset-[3px]` | Explicit link source matches light-theme legacy token; inherited controls require separate computed verification |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | `src/components/tpo/recruiter-lead-csv-import.tsx:216, 274` shared DataTable; alerts `src/components/tpo/recruiter-lead-csv-import.tsx:188`, results `src/components/tpo/recruiter-lead-csv-import.tsx:191, 232, 267` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/tpo/recruiter-lead-csv-import.tsx:159, 174, 181, 185, 197 (+4 more)` — 9 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | All seven paired shared Buttons; CSV template link explicit 2px/3px; result download anchor cleaned up and URL release delayed | Code reviewed, **not executed** |

#### `src/components/placements/report-interactive-table.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/report-interactive-table.tsx:69, 73, 84, 91, 102 (+6 more)` — `min-h-11`, 11 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/report-interactive-table.tsx:69, 73, 84, 91, 102 (+6 more)` — `md:min-h-9`, 11 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | `src/components/placements/report-interactive-table.tsx:135` shared DataTable; alerts `src/components/placements/report-interactive-table.tsx:not present`, results `src/components/placements/report-interactive-table.tsx:65, 117, 139, 159` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/report-interactive-table.tsx:84, 102, 112, 113, 115 (+3 more)` — 8 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Shared DataTable; on-screen header Button stays interactive, separate print-only heading text prevents blank printed headers; export CSV model unchanged | Code reviewed, **not executed** |

#### `src/components/placements/tpo-report-saved-filters.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/tpo-report-saved-filters.tsx:62, 65, 69, 75, 76` — `min-h-11`, 5 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/tpo-report-saved-filters.tsx:62, 65, 69, 75, 76` — `md:min-h-9`, 5 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | No table in this component; alerts `src/components/placements/tpo-report-saved-filters.tsx:not present`, results `src/components/placements/tpo-report-saved-filters.tsx:78` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/tpo-report-saved-filters.tsx:58` — 1 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Input Select Button 44px phone/36px desktop; Disclosure hidden on paper; browser-local storage behavior unchanged | Code reviewed, **not executed** |

#### `src/components/placements/college-report-navigation.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/college-report-navigation.tsx:15` — `min-h-11`, 1 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/college-report-navigation.tsx:15` — `md:min-h-9`, 1 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/placements/college-report-navigation.tsx:15` — `focus-visible:outline-offset-[3px]` | Explicit link source matches light-theme legacy token; inherited controls require separate computed verification |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | No table in this component; alerts `src/components/placements/college-report-navigation.tsx:not present`, results `src/components/placements/college-report-navigation.tsx:not present` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/college-report-navigation.tsx:10` — 1 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Each Link 44px/36px, focus 2px/3px brand token, radius shared and nav hidden in print | Code reviewed, **not executed** |

#### `src/components/tpo/tpo-batch-undo-control.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/tpo/tpo-batch-undo-control.tsx:28` — `min-h-11`, 1 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/tpo/tpo-batch-undo-control.tsx:28` — `md:min-h-9`, 1 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/ui/button.tsx:30-35` inherited offset 2px; no local 3px ring | Known inherited offset differs from 3px legacy global; remains OPEN |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | No table in this component; alerts `src/components/tpo/tpo-batch-undo-control.tsx:30`, results `src/components/tpo/tpo-batch-undo-control.tsx:not present` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/tpo/tpo-batch-undo-control.tsx:28` — 1 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Phone checkbox label 44px, Undo shared Button 44px/36px; entire action hidden on print | Code reviewed, **not executed** |

#### `src/components/placements/placement-report-ui.tsx`

| State/property | Legacy file:line value | vNext file:line value (source check) | Evidence status |
|---|---|---|---|
| Small-screen interactive target | `pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/placements/placement-report-ui.tsx:67, 82, 103, 115, 228 (+1 more)` — `min-h-11`, 6 occurrence(s) | Source target only; physical touch not measured |
| Large-screen button control | `ui-clone-checklist.md:46-47` — 36px, radius 9px | `src/components/placements/placement-report-ui.tsx:67, 82, 103, 115, 228 (+1 more)` — `md:min-h-9`, 6 occurrence(s) | Source target only; resolved style unverified |
| Keyboard focus | `components___accessibility.scss:18-21` — teal 2px / 3px offset | `src/components/placements/placement-report-ui.tsx:228, 267` — `focus-visible:outline-offset-[3px]` | Explicit link source matches light-theme legacy token; inherited controls require separate computed verification |
| Table / result display | `old-lms-pages.md:9` — shared hairline rows/status pills | No table in this component; alerts `src/components/placements/placement-report-ui.tsx:not present`, results `src/components/placements/placement-report-ui.tsx:218` | Structured source inspected; exact hover, error, empty and table metrics not fully compared |
| Paper separation | No historical authenticated print counterpart in checked-in SCSS | `src/components/placements/placement-report-ui.tsx:60, 222, 223, 267` — 4 `print:hidden` marker(s), plus shared paper CSS | vNext paper behavior source-only; G5 remains OPEN |
| Workflow preservation | No complete legacy import flow or report behavior counterpart supplied | Select and filter shared Button mobile 44px/desktop 36px, printed report excludes filters/nav; CSV primary export has 2px/3px focus | Code reviewed, **not executed** |

### Scoped grep ledger and responsive proof (complete file reads)

These regex counts were computed over the entire fetched UTF-8 content of exactly eleven files on `chatgpt/chat-6-b`. They are **not** a checkout-wide grep. Native hidden-field exemption is explicitly identified below.

| Path | Raw `button/input/select/textarea/table` tags | Hex literals | `print:hidden` markers | Paired shared Button open/close |
|---|---|---|---|
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | 0/0/0/0/0 | 0 | 9 | 10/10 |
| `src/components/placements/tpo-selection-import.tsx` | 0/0/0/0/0 | 0 | 2 | 1/1 |
| `src/components/placements/tpo-round-results-import.tsx` | 0/0/0/0/0 | 0 | 7 | 2/2 |
| `src/components/tpo/tpo-academic-import-preview.tsx` | 0/0/0/0/0 | 0 | 3 | 1/1 |
| `src/components/placements/tpo-report-presentation.tsx` | 0/0/0/0/0 | 0 | 1 | 1/1 |
| `src/components/tpo/recruiter-lead-csv-import.tsx` | 0/0/0/0/0 | 0 | 9 | 7/7 |
| `src/components/placements/report-interactive-table.tsx` | 0/0/0/0/0 | 0 | 8 | 8/8 |
| `src/components/placements/tpo-report-saved-filters.tsx` | 0/0/0/0/0 | 0 | 1 | 3/3 |
| `src/components/placements/college-report-navigation.tsx` | 0/0/0/0/0 | 0 | 1 | 0/0 |
| `src/components/tpo/tpo-batch-undo-control.tsx` | 0/0/0/0/0 | 0 | 1 | 1/1 |
| `src/components/placements/placement-report-ui.tsx` | 0/1/0/0/0 | 0 | 4 | 2/2 |

**Scoped totals:** raw controls `0/1/0/0/0`; hard-coded hex `0`; all shared Button pairs balanced. The **one native input** is `src/components/placements/placement-report-ui.tsx:92-97`, intentionally `type="hidden"` to preserve season scope across a drive filter GET form; it is not a visible hand-rolled input and has no CSS class override. No native `<button>` remains in these eleven files. JSX open/close counts are lexical proof, not a TypeScript parser.

Checkout reproduction, **not executed**:
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
  src/components/tpo/tpo-batch-eligibility-import.tsx \
  src/components/placements/tpo-selection-import.tsx \
  src/components/placements/tpo-round-results-import.tsx \
  src/components/tpo/tpo-academic-import-preview.tsx \
  src/components/placements/tpo-report-presentation.tsx \
  src/components/tpo/recruiter-lead-csv-import.tsx \
  src/components/placements/report-interactive-table.tsx \
  src/components/placements/tpo-report-saved-filters.tsx \
  src/components/placements/college-report-navigation.tsx \
  src/components/tpo/tpo-batch-undo-control.tsx \
  src/components/placements/placement-report-ui.tsx
```

**Responsive source scope:** the controls use the 44px target through 767px and 36px from 768px where locally overridden; shared Button/Select/FileUpload behavior otherwise inherits the central skin. TPO eligibility uses shared Tabs and DataTable with phone card-style rows, while the selected/round result wrappers expand clipped scroll regions in print using `print:max-h-none print:overflow-visible`. `ReportInteractiveTable` now emits a print-only text header alongside its interactive header Button so the shared print CSS's button hiding cannot blank paper table headings. Actual phone, tablet, printed pagination, PDF/email output and side-by-side rendering **not performed**.

**Still OPEN:** G4 needs complete old-LMS wizard-specific state/value sources, report computed properties and repository-wide scan; G5 needs authentic print/PDF/certificate/receipt/offer-letter and provider-hosted email HTML, plus printed/browser visual output. These cannot be certified from checked-in SCSS alone.

## G4 follow-on faculty and college reports — chat-6

**Scope and proof policy:** The four complete sources below were inspected and re-fetched after their file updates. They reuse shared form/table/buttons and preserve export URLs, selectors, handlers and existing user content. This records *source remediation* only. Every unspecified historical property, rendered phone/tablet state, print media geometry and actual browser output remains explicitly open under STRICT TICK RULE.

### Completed source-file remediation and next target
- [x] **Scoped source pass only**: `src/components/admin/super-admin-faculty-bulk-import.tsx` — Sample CSV, selection state, local validation, confirm and row status outcomes; sample link already uses delayed URL revocation and shared StatusBadge; on paper show result summary/table, suppress input/status controls.
- [x] **Scoped source pass only**: `src/components/courses/college-learner-progress-report.tsx` — Class/course filters, conditional content, four summary tiles, per-learner result table and CSV link; filter form and export CTA omitted on paper, query strings and export route unchanged.
- [x] **Scoped source pass only**: `src/components/courses/college-live-classes-directory.tsx` — Seven-plus filters including date bounds, report header CSV control, row statuses, query and paginator; filter controls now 44px phone/36px desktop, paper output suppresses interactive search.
- [x] **Scoped source pass only**: `src/components/courses/college-content-aggregate.tsx` — Content catalogue with sixteen filter controls, page CSV export, mobile-only cards and desktop table; print forces one table and hides mobile duplicates, filter/navigation controls suppressed.
- [ ] **Next exact file**: `src/components/courses/college-assessment-aggregate.tsx` — assessment CSV actions, 44px controls, table/print treatment, complete state+responsive value audit.

### Per-file legacy comparison tables

#### `src/components/admin/super-admin-faculty-bulk-import.tsx`

| Property/state | Old LMS source:value | vNext source:value | Source-level verdict |
|---|---|---|---|
| Mobile action target | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214`: minimum **44px** through **767px** | `src/components/admin/super-admin-faculty-bulk-import.tsx:91, 93, 99`: `min-h-11` (3 source occurrences) | Size token matches where applied; phone tap/browser proof missing |
| Tablet/desktop target | `docs/design/ui-clone-checklist.md:46-47`: measured button **36px**, radius **9px**, font **14px/650** | `src/components/admin/super-admin-faculty-bulk-import.tsx:91, 99`: `md:min-h-9`; default shared control token `src/app/globals.css:334-337` | Source token matches 768px+; computed style still unverified |
| Keyboard focus | `docs/design/legacy-styles/components___accessibility.scss:18-21`: **2px** teal / **3px** offset | `src/components/admin/super-admin-faculty-bulk-import.tsx:not present`: explicit export/nav anchor offset-3 when present; otherwise inherited shared Button focus | Explicit anchors match light-theme token; shared Button global offset remains separate unverified/mismatch |
| Display/result | `docs/design/old-lms-pages.md:9`, `pages___admin-list-pages.scss:69-111`: hairline compact rows | `src/components/admin/super-admin-faculty-bulk-import.tsx:105`: shared table or report list, `StatusBadge` and consistent tokens | Structural source only; exact row-height/padding/hover states not certified |
| Printed interaction chrome | No legacy `@media print`/certificate/letter/receipt source in supplied SCSS | `src/components/admin/super-admin-faculty-bulk-import.tsx:90, 91, 93, 96, 97, 99`: 6 print-hide marker(s), authenticated print CSS `:1-80` | Conservative print-only separation; historical parity **OPEN** |
| Behavior/empty/error | No old counterpart for all states | Sample CSV, selection state, local validation, confirm and row status outcomes; sample link already uses delayed URL revocation and shared StatusBadge; on paper show result summary/table, suppress input/status controls. | Existing component logic retained; tests and browser interactions **not run** |

#### `src/components/courses/college-learner-progress-report.tsx`

| Property/state | Old LMS source:value | vNext source:value | Source-level verdict |
|---|---|---|---|
| Mobile action target | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214`: minimum **44px** through **767px** | `src/components/courses/college-learner-progress-report.tsx:35, 43, 52, 56, 74`: `min-h-11` (5 source occurrences) | Size token matches where applied; phone tap/browser proof missing |
| Tablet/desktop target | `docs/design/ui-clone-checklist.md:46-47`: measured button **36px**, radius **9px**, font **14px/650** | `src/components/courses/college-learner-progress-report.tsx:35, 43, 52, 56, 74`: `md:min-h-9`; default shared control token `src/app/globals.css:334-337` | Source token matches 768px+; computed style still unverified |
| Keyboard focus | `docs/design/legacy-styles/components___accessibility.scss:18-21`: **2px** teal / **3px** offset | `src/components/courses/college-learner-progress-report.tsx:56, 74`: explicit export/nav anchor offset-3 when present; otherwise inherited shared Button focus | Explicit anchors match light-theme token; shared Button global offset remains separate unverified/mismatch |
| Display/result | `docs/design/old-lms-pages.md:9`, `pages___admin-list-pages.scss:69-111`: hairline compact rows | `src/components/courses/college-learner-progress-report.tsx:77`: shared table or report list, `StatusBadge` and consistent tokens | Structural source only; exact row-height/padding/hover states not certified |
| Printed interaction chrome | No legacy `@media print`/certificate/letter/receipt source in supplied SCSS | `src/components/courses/college-learner-progress-report.tsx:32, 74`: 2 print-hide marker(s), authenticated print CSS `:1-80` | Conservative print-only separation; historical parity **OPEN** |
| Behavior/empty/error | No old counterpart for all states | Class/course filters, conditional content, four summary tiles, per-learner result table and CSV link; filter form and export CTA omitted on paper, query strings and export route unchanged. | Existing component logic retained; tests and browser interactions **not run** |

#### `src/components/courses/college-live-classes-directory.tsx`

| Property/state | Old LMS source:value | vNext source:value | Source-level verdict |
|---|---|---|---|
| Mobile action target | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214`: minimum **44px** through **767px** | `src/components/courses/college-live-classes-directory.tsx:28, 34, 39, 46, 55, 62 (+4 more)`: `min-h-11` (10 source occurrences) | Size token matches where applied; phone tap/browser proof missing |
| Tablet/desktop target | `docs/design/ui-clone-checklist.md:46-47`: measured button **36px**, radius **9px**, font **14px/650** | `src/components/courses/college-live-classes-directory.tsx:28, 34, 39, 46, 55, 62 (+4 more)`: `md:min-h-9`; default shared control token `src/app/globals.css:334-337` | Source token matches 768px+; computed style still unverified |
| Keyboard focus | `docs/design/legacy-styles/components___accessibility.scss:18-21`: **2px** teal / **3px** offset | `src/components/courses/college-live-classes-directory.tsx:76`: explicit export/nav anchor offset-3 when present; otherwise inherited shared Button focus | Explicit anchors match light-theme token; shared Button global offset remains separate unverified/mismatch |
| Display/result | `docs/design/old-lms-pages.md:9`, `pages___admin-list-pages.scss:69-111`: hairline compact rows | `src/components/courses/college-live-classes-directory.tsx:78`: shared table or report list, `StatusBadge` and consistent tokens | Structural source only; exact row-height/padding/hover states not certified |
| Printed interaction chrome | No legacy `@media print`/certificate/letter/receipt source in supplied SCSS | `src/components/courses/college-live-classes-directory.tsx:24`: 1 print-hide marker(s), authenticated print CSS `:1-80` | Conservative print-only separation; historical parity **OPEN** |
| Behavior/empty/error | No old counterpart for all states | Seven-plus filters including date bounds, report header CSV control, row statuses, query and paginator; filter controls now 44px phone/36px desktop, paper output suppresses interactive search. | Existing component logic retained; tests and browser interactions **not run** |

#### `src/components/courses/college-content-aggregate.tsx`

| Property/state | Old LMS source:value | vNext source:value | Source-level verdict |
|---|---|---|---|
| Mobile action target | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214`: minimum **44px** through **767px** | `src/components/courses/college-content-aggregate.tsx:33, 44, 50, 55, 60, 65 (+13 more)`: `min-h-11` (19 source occurrences) | Size token matches where applied; phone tap/browser proof missing |
| Tablet/desktop target | `docs/design/ui-clone-checklist.md:46-47`: measured button **36px**, radius **9px**, font **14px/650** | `src/components/courses/college-content-aggregate.tsx:33, 44, 50, 55, 60, 65 (+12 more)`: `md:min-h-9`; default shared control token `src/app/globals.css:334-337` | Source token matches 768px+; computed style still unverified |
| Keyboard focus | `docs/design/legacy-styles/components___accessibility.scss:18-21`: **2px** teal / **3px** offset | `src/components/courses/college-content-aggregate.tsx:33, 161`: explicit export/nav anchor offset-3 when present; otherwise inherited shared Button focus | Explicit anchors match light-theme token; shared Button global offset remains separate unverified/mismatch |
| Display/result | `docs/design/old-lms-pages.md:9`, `pages___admin-list-pages.scss:69-111`: hairline compact rows | `src/components/courses/college-content-aggregate.tsx:217`: shared table or report list, `StatusBadge` and consistent tokens | Structural source only; exact row-height/padding/hover states not certified |
| Printed interaction chrome | No legacy `@media print`/certificate/letter/receipt source in supplied SCSS | `src/components/courses/college-content-aggregate.tsx:38, 187, 264`: 3 print-hide marker(s), authenticated print CSS `:1-80` | Conservative print-only separation; historical parity **OPEN** |
| Behavior/empty/error | No old counterpart for all states | Content catalogue with sixteen filter controls, page CSV export, mobile-only cards and desktop table; print forces one table and hides mobile duplicates, filter/navigation controls suppressed. | Existing component logic retained; tests and browser interactions **not run** |

### Scoped grep results and responsive/print proof

These counts came from entire **GitHub connector file reads** (not shell execution or a global checkout scan); all existing JSX Button opener/closer pairs were checked lexically. Native matches are literal lowercase tags, not shared `Button`, `Select`, `Input`, `DataTable` calls.

| File | Native button/input/select/textarea/table | Hard-coded hex | Print-hide markers | Button opener/closer |
|---|---|---:|---:|---:|
| `src/components/admin/super-admin-faculty-bulk-import.tsx` | 0/0/0/0/0 | 0 | 6 | 2/2 |
| `src/components/courses/college-learner-progress-report.tsx` | 0/0/0/0/0 | 0 | 2 | 1/1 |
| `src/components/courses/college-live-classes-directory.tsx` | 0/0/0/0/0 | 0 | 1 | 1/1 |
| `src/components/courses/college-content-aggregate.tsx` | 0/0/0/0/0 | 0 | 3 | 1/1 |

Reproduce in checkout (not executed):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
  src/components/admin/super-admin-faculty-bulk-import.tsx \
  src/components/courses/college-learner-progress-report.tsx \
  src/components/courses/college-live-classes-directory.tsx \
  src/components/courses/college-content-aggregate.tsx
```

**Responsive source evidence:** Buttons/inputs/selects use `min-h-11` through 767px (44px) and `md:min-h-9` from 768px (36px); already flex-wrapped search filters remain multi-row on phones. Print-only rules hide search/picker/confirmation, preserve summary and result tables, expand import result overflow, and in the catalogue hide card-form mobile duplicates while forcing the DataTable wrapper visible. Actual phone/tablet/print preview, long-content truncation, margins, focus placement and email/PDF templates are **not verified**.

**G4/G5 remain [ ]:** Pixel parity needs complete legacy wizard/progress/report fixtures and every computed state. Provider-hosted email and original certificate/offer/receipt PDF styling are still unavailable. No CI, tests, compile, app run or browser rendering performed.

## G4 additional assessment directory source completion — chat-6

- [x] **Source remediation only:** `src/components/courses/college-assessment-aggregate.tsx` — assessment CSV export and sibling navigation; 10 locally styled search/filter controls now responsive; source filter form and pager are print-hidden; phone card version hidden on paper while one DataTable wrapper prints; existing protected assessment read/actions untouched.
- [ ] **Next exact file:** `src/components/courses/faculty-course-roster.tsx`, then remaining G4 report/export sources. G4/G5 strict ticks stay OPEN until historical values, rendered snapshots and print/email template artifacts exist.

| Property/state | Legacy source:value | vNext source:value | Evidence status |
|---|---|---|---|
| Phone tap minimum | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/courses/college-assessment-aggregate.tsx:83, 87, 91, 107, 112, 117, 122, 127, 135, 143 (+9 more)` — `min-h-11` (44px) | Local source matches token; physical phone not rendered |
| Tablet/desktop minimum | `docs/design/ui-clone-checklist.md:46-47` — 36px/9px/14px/650 for standard buttons | `src/components/courses/college-assessment-aggregate.tsx:83, 87, 91, 107, 112, 117, 122, 127, 135, 143 (+7 more)` — `md:min-h-9` (36px) plus shared control radius | Tokens match; computed state proof pending |
| Anchor focus | `docs/design/legacy-styles/components___accessibility.scss:18-21` — 2px solid `$teal-text` / 3px offset | `src/components/courses/college-assessment-aggregate.tsx:83, 87, 91, 177, 295, 301` — `focus-visible:outline-2`, offset 3px, `--lms-primary-text` | Local export/navigation anchor source match in light theme |
| Table/status/empty | `docs/design/old-lms-pages.md:9`, `pages___admin-list-pages.scss:69-111` compact table / status pills | `src/components/courses/college-assessment-aggregate.tsx:236` uses shared DataTable and existing shared StatusBadge | Actual row heights, loading/empty/hover not browser-checked |
| Print/no duplicate phone cards | No checked-in old authenticated print stylesheet, PDF or email markup | `src/components/courses/college-assessment-aggregate.tsx:81, 99, 205, 288` print-hidden actions; `print:hidden` phone cards and `print:block` table | vNext source correction only; print and PDF parity unprovable |
| Regression | No content or route behavior rewrite permitted | Assessment query, CSV href and actions preserved; shared Button still owns click behavior | Source read verified; no tests or CI run |

**Scoped grep equivalent on complete file:** native lowercase button/input/select/textarea/table = `0`; CSS hex literal = `0`; shared Button open/close = `1/1`. Reproduce without running app: `grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' src/components/courses/college-assessment-aggregate.tsx` (expected **0** matching lines in this file). Phone/tablet proof is strictly a breakpoint/class inspection: `min-h-11` at 0–767px and `md:min-h-9` at 768px and above. Side-by-side browser screenshots and printer preview are **not performed**. G4/G5 remain unchecked.

## G4/G5 report export and admin directory nine-file pass — chat-6

This pass uses the **old LMS SCSS numeric source**, not an inferred screenshot. All nine vNext TSX sources were fetched from the committed branch after edits. Never tick G4 or G5 for these limited source checks: the strict rule requires every old-LMS state, whole-repository evidence and actual comparative phone/print rendering, which are still unavailable. No application, TypeScript, lint, test, CI or actual browser print run.

### File completion queue (source-level only)
- [x] `src/components/courses/faculty-course-roster.tsx` — Roster CSV export, per-learner paginated DataTable, phone/email links, avatar preview and print-only initials; **remains unverified for strict parity:** Printed roster retains only the current page of 25; no complete multi-page historical print baseline.
- [x] `src/components/admin/department-directory.tsx` — Department CSV link, live filter, name-sort header, result count, paging and printed static header; **remains unverified for strict parity:** Printed list uses the current filtered page, not necessarily the whole authorized directory.
- [x] `src/components/admin/admin-program-directory.tsx` — Program create form, CSV export, filtering, pagination, disabled/loading/empty; **remains unverified for strict parity:** Original program form states and print pagination metrics not supplied.
- [x] `src/components/admin/super-admin-interview-operations.tsx` — Super Admin interview CSV export, filtered date/sort, per-row ICS and conflict table; **remains unverified for strict parity:** ICS/content-disposition exact historical template and print page-breaks unavailable.
- [x] `src/components/admin/college-at-glance-panel.tsx` — College metric refresh and four tiles; loading and retry states; **remains unverified for strict parity:** Dashboard PDF/certificate/receipt print geometry unknown.
- [x] `src/components/placements/tpo-round-apply-control.tsx` — TPO entire-round consequence preview, CSV report, confirmation and results copy; **remains unverified for strict parity:** No exact historical outcome-stepper or email notification template, runtime unavailable.
- [x] `src/components/placements/college-hiring-funnel.tsx` — College hiring funnel CSV link, department/program/batch/date filters, charts, company DataTable; **remains unverified for strict parity:** Legacy funnel metric layout chart axes, PDF and print chart output unavailable.
- [x] `src/components/admin/people-pagination.tsx` — People directory paginator and count; paper controls excluded; **remains unverified for strict parity:** Historical people-directory print page sequencing unverified.
- [x] `src/components/admin/academic-directory-refresh.tsx` — Academic directory Refresh and busy state; **remains unverified for strict parity:** Historical disabled spinner timing and actual computed focus unverified.
- [ ] **Next file:** `src/components/placements/tpo-bulk-round-result-recorder.tsx` — finish TPO results staging/export review row states and print controls.

### File:line value and state matrix

Reference: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` specifies mobile max-width **767px** with a 44px minimum; `docs/design/ui-clone-checklist.md:46-47` records the old button **36px**, **9px radius**, **14px/650**. `docs/design/legacy-styles/components___accessibility.scss:18-21` specifies a teal **2px outline + 3px offset**. `src/app/globals.css:29,334-337` resolves `--lms-primary-text` and 36px/9px control tokens; shared `Button` owns loading/hover/disabled and stays unchanged. Legacy report print/PDF/email reference files are not present.

#### `src/components/courses/faculty-course-roster.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/courses/faculty-course-roster.tsx:161, 168, 214, 221, 226, 240 (+1)`: `min-h-11` in 7 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/courses/faculty-course-roster.tsx:161, 168, 214, 221, 226, 240 (+1)`: `md:min-h-9` in 7 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/courses/faculty-course-roster.tsx:n/a`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/courses/faculty-course-roster.tsx:193`: shared DataTable (when used); status `:n/a`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/courses/faculty-course-roster.tsx:161, 165, 203, 235`: 4 `print:hidden` source line(s); print expansion `:161, 165, 203, 206, 235` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | Roster CSV export, per-learner paginated DataTable, phone/email links, avatar preview and print-only initials. Printed roster retains only the current page of 25; no complete multi-page historical print baseline | Source reviewed, no runtime validation |

#### `src/components/admin/department-directory.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/admin/department-directory.tsx:79, 91, 100, 126`: `min-h-11` in 4 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/admin/department-directory.tsx:79, 91, 100, 126`: `md:min-h-9` in 4 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/admin/department-directory.tsx:100`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/admin/department-directory.tsx:121`: shared DataTable (when used); status `:118, 141`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/admin/department-directory.tsx:70, 126, 147`: 3 `print:hidden` source line(s); print expansion `:70, 124, 126, 147` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | Department CSV link, live filter, name-sort header, result count, paging and printed static header. Printed list uses the current filtered page, not necessarily the whole authorized directory | Source reviewed, no runtime validation |

#### `src/components/admin/admin-program-directory.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/admin/admin-program-directory.tsx:151, 163, 169, 174, 180, 189 (+4)`: `min-h-11` in 10 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/admin/admin-program-directory.tsx:151, 163, 169, 174, 180, 189 (+4)`: `md:min-h-9` in 10 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/admin/admin-program-directory.tsx:201`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/admin/admin-program-directory.tsx:210`: shared DataTable (when used); status `:143, 207`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/admin/admin-program-directory.tsx:137, 186, 220`: 3 `print:hidden` source line(s); print expansion `:137, 186, 220` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | Program create form, CSV export, filtering, pagination, disabled/loading/empty. Original program form states and print pagination metrics not supplied | Source reviewed, no runtime validation |

#### `src/components/admin/super-admin-interview-operations.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/admin/super-admin-interview-operations.tsx:27, 49, 53, 60, 81, 83`: `min-h-11` in 6 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/admin/super-admin-interview-operations.tsx:53, 60, 81, 83`: `md:min-h-9` in 4 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/admin/super-admin-interview-operations.tsx:60`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/admin/super-admin-interview-operations.tsx:64`: shared DataTable (when used); status `:57, 61`, alert `:62` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/admin/super-admin-interview-operations.tsx:43, 60, 81, 83`: 4 `print:hidden` source line(s); print expansion `:43, 60, 81, 83` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | Super Admin interview CSV export, filtered date/sort, per-row ICS and conflict table. ICS/content-disposition exact historical template and print page-breaks unavailable | Source reviewed, no runtime validation |

#### `src/components/admin/college-at-glance-panel.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/admin/college-at-glance-panel.tsx:39`: `min-h-11` in 1 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/admin/college-at-glance-panel.tsx:39`: `md:min-h-9` in 1 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/admin/college-at-glance-panel.tsx:n/a`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/admin/college-at-glance-panel.tsx:n/a`: shared DataTable (when used); status `:51`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/admin/college-at-glance-panel.tsx:39`: 1 `print:hidden` source line(s); print expansion `:39` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | College metric refresh and four tiles; loading and retry states. Dashboard PDF/certificate/receipt print geometry unknown | Source reviewed, no runtime validation |

#### `src/components/placements/tpo-round-apply-control.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/placements/tpo-round-apply-control.tsx:47, 65, 73, 75, 84, 88`: `min-h-11` in 6 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/placements/tpo-round-apply-control.tsx:47, 65, 73, 75, 84, 88`: `md:min-h-9` in 6 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/placements/tpo-round-apply-control.tsx:n/a`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/placements/tpo-round-apply-control.tsx:n/a`: shared DataTable (when used); status `:79`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/placements/tpo-round-apply-control.tsx:47, 65, 71, 84, 88`: 5 `print:hidden` source line(s); print expansion `:47, 59, 65, 71, 81, 84 (+1)` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | TPO entire-round consequence preview, CSV report, confirmation and results copy. No exact historical outcome-stepper or email notification template, runtime unavailable | Source reviewed, no runtime validation |

#### `src/components/placements/college-hiring-funnel.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/placements/college-hiring-funnel.tsx:31, 33, 40, 46, 52, 58 (+3)`: `min-h-11` in 9 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/placements/college-hiring-funnel.tsx:31, 33, 40, 46, 52, 58 (+3)`: `md:min-h-9` in 9 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/placements/college-hiring-funnel.tsx:31, 33, 40, 46, 52, 58 (+2)`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/placements/college-hiring-funnel.tsx:95`: shared DataTable (when used); status `:108`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/placements/college-hiring-funnel.tsx:30, 36`: 2 `print:hidden` source line(s); print expansion `:30, 36` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | College hiring funnel CSV link, department/program/batch/date filters, charts, company DataTable. Legacy funnel metric layout chart axes, PDF and print chart output unavailable | Source reviewed, no runtime validation |

#### `src/components/admin/people-pagination.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/admin/people-pagination.tsx:n/a`: `min-h-11` in 0 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/admin/people-pagination.tsx:n/a`: `md:min-h-9` in 0 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/admin/people-pagination.tsx:n/a`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/admin/people-pagination.tsx:n/a`: shared DataTable (when used); status `:n/a`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/admin/people-pagination.tsx:19`: 1 `print:hidden` source line(s); print expansion `:19` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | People directory paginator and count; paper controls excluded. Historical people-directory print page sequencing unverified | Source reviewed, no runtime validation |

#### `src/components/admin/academic-directory-refresh.tsx`

| Property/state | Old LMS file:line and exact value | vNext file:line and value | Verification |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: 44px minimum at ≤767px | `src/components/admin/academic-directory-refresh.tsx:8`: `min-h-11` in 1 source instance(s) | Source token only; no phone device |
| Tablet/desktop minimum | `ui-clone-checklist.md:46-47`: 36px, 9px radius, 14px/650 | `src/components/admin/academic-directory-refresh.tsx:8`: `md:min-h-9` in 1 source instance(s), shared radius | Source token only; no computed DOM |
| Focus | `components___accessibility.scss:18-21`: 2px solid teal, 3px offset | `src/components/admin/academic-directory-refresh.tsx:n/a`: explicit anchor offset-3 where present; others inherit shared Button | Explicit link source matches; inherited shared offset mismatch/unmeasured remains OPEN |
| Result/empty/loading | `old-lms-pages.md:9`: compact table, status, thin hairlines | `src/components/admin/academic-directory-refresh.tsx:n/a`: shared DataTable (when used); status `:n/a`, alert `:n/a` | Existing empty/disabled logic preserved; browser not run |
| Print output | Legacy authenticated report print template missing | `src/components/admin/academic-directory-refresh.tsx:8`: 1 `print:hidden` source line(s); print expansion `:8` | vNext paper rules only; historical match unavailable |
| Behavior | No complete historical wizard/result fixture | Academic directory Refresh and busy state. Historical disabled spinner timing and actual computed focus unverified | Source reviewed, no runtime validation |

### Exact lexical grep proof from full fetched files

| File | Native `button/input/select/textarea/table` | CSS hex | `<Button>` open/close | Print-hidden source lines |
|---|---|---:|---:|---|
| `src/components/courses/faculty-course-roster.tsx` | 0/0/0/0/0 | 0 | 4/4 | 4 |
| `src/components/admin/department-directory.tsx` | 0/0/0/0/0 | 0 | 6/6 | 3 |
| `src/components/admin/admin-program-directory.tsx` | 0/0/0/0/0 | 0 | 5/5 | 3 |
| `src/components/admin/super-admin-interview-operations.tsx` | 0/0/0/0/0 | 0 | 1/1 | 4 |
| `src/components/admin/college-at-glance-panel.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1 |
| `src/components/placements/tpo-round-apply-control.tsx` | 0/0/0/0/0 | 0 | 6/6 | 5 |
| `src/components/placements/college-hiring-funnel.tsx` | 0/2/0/0/0 | 0 | 1/1 | 2 |
| `src/components/admin/people-pagination.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/academic-directory-refresh.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1 |

**Scope caveat:** `college-hiring-funnel.tsx` retains two native `<input type="hidden">` values for the selected season and job in a GET form (not visual hand-rolled controls). Every other native control count in the nine files is 0. Source tag counts are lexical, not a TypeScript parse. In `faculty-course-roster.tsx`, CSV exports omit phone/email and the DataTable prints only the *current page*; neither behavior was changed by the styling pass.

Reproduce on checkout (command **not executed**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
  src/components/courses/faculty-course-roster.tsx \
  src/components/admin/department-directory.tsx \
  src/components/admin/admin-program-directory.tsx \
  src/components/admin/super-admin-interview-operations.tsx \
  src/components/admin/college-at-glance-panel.tsx \
  src/components/placements/tpo-round-apply-control.tsx \
  src/components/placements/college-hiring-funnel.tsx \
  src/components/admin/people-pagination.tsx \
  src/components/admin/academic-directory-refresh.tsx
```

**Responsive source proof:** all locally sized visible controls use `min-h-11` (44px) through 767px; where present, `md:min-h-9` lowers the minimum to 36px beginning 768px. Flex-wrapped filter strips remain multi-row on narrow screens; the roster's telephone/email links no longer shrink prematurely at 640px. `print:hidden` excludes controls; static report data remains, and the department sort header has a separate print-only label. Printed paginated rosters/results are not guaranteed to include every record. This is *not* a screenshot/device/actual print verification.

**G4/G5 still [ ]**: old-LMS all-state value tables, global raw-control grep, print/PDF/certificate/offer-letter/receipt and provider-hosted email fixtures, browser screenshots and TypeScript proof are outstanding.

## G4 staging and G5 email source proof — chat-6

**Completed source files (not strict parity ticks):**
- [x] `src/components/placements/tpo-bulk-round-result-recorder.tsx` — bulk round staging result preview, 25-learner review, warnings, per-learner CSV download, paper suppression of selection controls; preserved existing input, API and confirmation semantics. Fixed missing semantic error tone and detached download anchor only after click; URL revocation deferred.
- [x] `src/app/(authenticated)/tpo/settings/templates/page.tsx` — read-only example email subjects and draft bodies now have static, complete, line-break-preserving **print-only** text, while interactive text controls and sidebar return navigation are suppressed on paper; all template words unchanged.
- [x] `src/components/tpo/tpo-communication-settings-editors.tsx` — specifically **TPO email signature editor** keeps editable textarea on screen, but prints an identified static signature preview without input/character counter/save button. SMS cap and recruiter-duration editors in the same file were not redesigned.
- [ ] **Next exact file:** `src/components/tpo/tpo-campaign-compose.tsx` — check message preview body, validation/error/loading values, 44px actions, printable draft/text without changing outbound delivery.

### Legacy-to-vNext property tables

Checked legacy references: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` = **44px** targets for phone max-width 767px; `docs/design/ui-clone-checklist.md:46-47` = **36px** desktop action height, radius **9px**, font **14px/650**. `docs/design/legacy-styles/components___accessibility.scss:18-21` = **2px** teal focus outline / **3px** offset. `docs/design/old-lms-pages.md:9` = table/divider/badge rules. These references are not provider-hosted email HTML or paper PDF templates.

#### `src/components/placements/tpo-bulk-round-result-recorder.tsx`

| State/property | Exact old LMS file:line value | vNext source file:line value | Result |
|---|---|---|---|
| Phone hit minimum | `pages___admin-list-pages.scss:8,193-214` 44px until 767px | `src/components/placements/tpo-bulk-round-result-recorder.tsx:159, 163, 165, 171, 180, 198, 234, 251, 279`: `min-h-11` where editable action exists | Source token comparison only |
| Tablet/desktop action | `ui-clone-checklist.md:46-47`: 36px/9px/14px 650 | `src/components/placements/tpo-bulk-round-result-recorder.tsx:159, 163, 165, 171, 180, 198, 234, 251, 279`: `md:min-h-9` where locally overridden | Source token; no computed CSS |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px | Shared controls inherit focus; template return link `src/components/placements/tpo-bulk-round-result-recorder.tsx:not present` uses 3px | Explicit link can match; shared Button 2px inherited offset is an open discrepancy |
| Error/result/empty | `old-lms-pages.md:9` compact hairline/status states | `src/components/placements/tpo-bulk-round-result-recorder.tsx:261` alerts; `:146, 237, 263` statuses; `:not present` DataTable if used | Source-level only; exact legacy state pixels absent |
| Paper/template output | No old-LMS print/email HTML reference checked in | `src/components/placements/tpo-bulk-round-result-recorder.tsx:152, 192, 206, 218, 230, 251, 279` 7 print-hidden modifiers; `:not present` static paper blocks | G5 historical parity unproven; actual print not rendered |
| Existing workflow | Original legacy email/CSV result output unavailable | Existing shared Button/Select/Textarea/Checkbox drive reviewed CSV import and result rows; no table in this component, per-learner outcomes render as a structured list. Download is client Blob, and print hides all editable fields, with static preview and outcome summary remaining. | Business logic and copy preserved; no runtime test |

#### `src/app/(authenticated)/tpo/settings/templates/page.tsx`

| State/property | Exact old LMS file:line value | vNext source file:line value | Result |
|---|---|---|---|
| Phone hit minimum | `pages___admin-list-pages.scss:8,193-214` 44px until 767px | `src/app/(authenticated)/tpo/settings/templates/page.tsx:19, 25`: `min-h-11` where editable action exists | Source token comparison only |
| Tablet/desktop action | `ui-clone-checklist.md:46-47`: 36px/9px/14px 650 | `src/app/(authenticated)/tpo/settings/templates/page.tsx:19, 25`: `md:min-h-9` where locally overridden | Source token; no computed CSS |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px | Shared controls inherit focus; template return link `src/app/(authenticated)/tpo/settings/templates/page.tsx:25` uses 3px | Explicit link can match; shared Button 2px inherited offset is an open discrepancy |
| Error/result/empty | `old-lms-pages.md:9` compact hairline/status states | `src/app/(authenticated)/tpo/settings/templates/page.tsx:not present` alerts; `:not present` statuses; `:not present` DataTable if used | Source-level only; exact legacy state pixels absent |
| Paper/template output | No old-LMS print/email HTML reference checked in | `src/app/(authenticated)/tpo/settings/templates/page.tsx:14, 19, 21, 25` 4 print-hidden modifiers; `:20, 22` static paper blocks | G5 historical parity unproven; actual print not rendered |
| Existing workflow | Original legacy email/CSV result output unavailable | Text examples are sourced from `TPO_MANUAL_MESSAGE_TEMPLATES`; no email/SMS is sent. Static paper subject and body are derived from the same `item` with `whitespace-pre-wrap`, so long draft text is no longer dependent on a five-row textarea print viewport. | Business logic and copy preserved; no runtime test |

#### `src/components/tpo/tpo-communication-settings-editors.tsx`

| State/property | Exact old LMS file:line value | vNext source file:line value | Result |
|---|---|---|---|
| Phone hit minimum | `pages___admin-list-pages.scss:8,193-214` 44px until 767px | `src/components/tpo/tpo-communication-settings-editors.tsx:45, 49, 88, 120, 126`: `min-h-11` where editable action exists | Source token comparison only |
| Tablet/desktop action | `ui-clone-checklist.md:46-47`: 36px/9px/14px 650 | `src/components/tpo/tpo-communication-settings-editors.tsx:88`: `md:min-h-9` where locally overridden | Source token; no computed CSS |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px | Shared controls inherit focus; template return link `src/components/tpo/tpo-communication-settings-editors.tsx:not present` uses 3px | Explicit link can match; shared Button 2px inherited offset is an open discrepancy |
| Error/result/empty | `old-lms-pages.md:9` compact hairline/status states | `src/components/tpo/tpo-communication-settings-editors.tsx:50, 89, 127` alerts; `:51, 90, 128` statuses; `:not present` DataTable if used | Source-level only; exact legacy state pixels absent |
| Paper/template output | No old-LMS print/email HTML reference checked in | `src/components/tpo/tpo-communication-settings-editors.tsx:75, 81, 86, 88` 4 print-hidden modifiers; `:74` static paper blocks | G5 historical parity unproven; actual print not rendered |
| Existing workflow | Original legacy email/CSV result output unavailable | Editor signature text is re-used verbatim in the on-screen preview `whitespace-pre-line`; the printed static preview is the same existing visual text. The actual outbound provider template and mail client appearance are not changed. | Business logic and copy preserved; no runtime test |

### Scoped whole-file grep counts

| Path | Raw lowercase button/input/select/textarea/table | Hex literals | Shared Button opening/closing |
|---|---|---:|---:|
| `src/components/placements/tpo-bulk-round-result-recorder.tsx` | 0/0/0/0/0 | 0 | 5/5 |
| `src/app/(authenticated)/tpo/settings/templates/page.tsx` | 0/0/0/0/0 | 0 | 0/0 |
| `src/components/tpo/tpo-communication-settings-editors.tsx` | 0/0/0/0/0 | 0 | 3/3 |

Counts above are from full GitHub file reads and show **0 raw button/select/textarea/table controls**, no source-literal hex colors and equal shared Button opening/closing tags. `G4` and `G5` remain `[ ]`; no run of application, TypeScript compiler, tests, CI, responsive device or print PDF happened.

Checkout reproduction (not executed):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
  src/components/placements/tpo-bulk-round-result-recorder.tsx \
  'src/app/(authenticated)/tpo/settings/templates/page.tsx' \
  src/components/tpo/tpo-communication-settings-editors.tsx
```

### G5 actual email and print ownership boundary

| Property | Current actual source/value | Why parity stays open |
|---|---|---|
| OTP mail payload | `src/modules/notifications/zeptomail-email.ts:4-6,18-31,85-117`: POST to ZeptoMail template endpoint `https://api.zeptomail.in/v1.1/email/template`, external `template_key` and merge values `otp, learnerName, email, mobile, expiryMinutes` | The **HTML template itself is hosted outside this repository**; cannot inspect actual header, footer, fonts or button states by changing this provider. Existing HTML-sensitive display-name escaping is retained. |
| Recruiter invitation | `src/modules/placements/tpo-recruiter-invite-email-delivery.ts:9-17,31-41`: verified opt-in template key and provider send with scoped variables | The provider-hosted invitation visual is not locally available. No unverified template send was attempted. |
| Paper baseline | `src/app/(authenticated)/authenticated-print.css:1-80`: authenticated shell/sidebar removal, controls hidden, DataTable header repetition, page overflow and break-inside rules | This baseline explicitly notes absence of original print template values; therefore no equivalence to historical certificate, offer letter, receipt, PDF or email rendering can be claimed. |
| Print-only example drafts | `src/app/(authenticated)/tpo/settings/templates/page.tsx:15-26`: subject/body now static in `print:block` paragraphs, editor controls `print:hidden` | Helps avoid truncation in a browser print, but is **not** a reconstructed provider-hosted email template. |
| Email signature paper preview | `src/components/tpo/tpo-communication-settings-editors.tsx:74-100`: existing signature preview and hidden editable controls | Same limitations. |

**Responsive source proof:** 0–767px `min-h-11` = 44px for locally sized controls and 768px+ `md:min-h-9` = 36px; wide disclosure/table containers retain existing flex wrapping. Print-only draft paragraphs use `whitespace-pre-wrap` to maintain line breaks; no measured paper margins, font metrics, clipping or real email-client snapshots were available. G4/G5 strict ticks remain open pending exact legacy assets and whole-repo checks.

## G5 campaign draft composer source pass — chat-6

- [x] **Source pass** `src/components/tpo/tpo-campaign-compose.tsx`: Complete campaign draft editing/preview: opener/segment/input values, selected recruiter audience validation, template-key guard, preview, save/disabled/error and paper-only campaign/subject identifiers. Displayed preview remains explicitly a sample, not a provider-hosted sent email.
- [ ] **Next exact file:** `src/components/tpo/tpo-optional-emails-editor.tsx` — study optional email preference toggles and printable settings summary, then remaining email and receipt output surfaces.

| State/property | Old LMS file:line exact value | Current vNext file:line value | Status |
|---|---|---|---|
| Phone hit target | `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` — 44px through 767px | `src/components/tpo/tpo-campaign-compose.tsx:15, 89, 134, 137, 141`: `min-h-11` | Token source aligned; device not inspected |
| Desktop height/radius | `docs/design/ui-clone-checklist.md:46-47` — 36px, radius 9px, text 14/650 | `src/components/tpo/tpo-campaign-compose.tsx:15, 89, 134, 137, 141`: `md:min-h-9`, shared controls | Resolved computed styles unavailable |
| Keyboard focus | `docs/design/legacy-styles/components___accessibility.scss:18-21` — 2px teal solid / 3px offset | `src/components/tpo/tpo-campaign-compose.tsx:134, 137`: audience link 2px/3px with `--lms-primary-text`; shared Button inherited focus remains separate | Partial exact source match; full states open |
| Error/status and busy | `docs/design/old-lms-pages.md:9` statuses/alerts and labels | `src/components/tpo/tpo-campaign-compose.tsx:88, 95, 96, 140, 146` role alert with `text-error`; `:84, 87, 91, 140, 145` live status; existing busy/disabled condition unchanged | Semantic source only |
| Paper text view | Original old-LMS provider template HTML absent | `src/components/tpo/tpo-campaign-compose.tsx:83, 114` prints current title/subject; `:79, 89, 100, 106, 110, 115, 126, 134, 137, 141` hides editable controls, return links, Save action; existing `whitespace-pre-wrap` body preview stays | No printer preview or historical provider email comparison |
| HTML email template | `src/modules/notifications/zeptomail-email.ts:85-117` calls remotely hosted `template_key` | No hosted markup edited; `previewTpoCampaignText` still uses local example merge variables | G5 email visual parity **OPEN** |

**Entire-file scoped grep:** raw lowercase `button/input/select/textarea/table` = `0/0/0/0/0`, hex literals `0`, shared Button opens/closes `2/2`. No raw visible controls or local color hex introduced; both JSX label and Button pairs remained balanced in the checked-in source. Reproduce (not executed): `grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' src/components/tpo/tpo-campaign-compose.tsx` (expected no hits). Responsive proof is 44px phone/36px desktop **source class comparison**, not phone screenshot or tablet physical test. Print-only content is static, line breaks preserved by the existing preview block.

**G4 and G5 category boxes remain [ ]**. A full old-LMS email client rendering, external ZeptoMail template HTML, printable PDFs and run-time/no-regression proof are still unavailable.

## chat-6 continuation: email, print and safe CSV controls (source-only pass)

This section is scoped to **11 source files read back after their commits**. Historical source measurements are matched to available legacy CSS only, and **G4/G5 strict category tick remains [ ]**. No app, compiler, CI, browser, phone/tablet screenshot, PDF render or email provider HTML fetch was run.

### Work queue
- [x] Source pass: `src/components/tpo/tpo-optional-emails-editor.tsx` — Print-only On/Off summary for optional student emails; Checkbox edits and PATCH concurrency guard preserved.
- [x] Source pass: `src/app/(authenticated)/tpo/settings/notices/page.tsx` — Student Notices/Preparation settings navigation hidden on paper; Badge import restored and five links use teal/3px focus.
- [x] Source pass: `src/components/tpo/tpo-communication-settings-editors.tsx` — SMS limit and recruiter-duration static print summaries; signature preview and save controls separated; PATCH unchanged.
- [x] Source pass: `src/components/tpo/tpo-campaign-compose.tsx` — Fixed incomplete JSX expression in Save draft label; preview and editable campaign stay separate on paper.
- [x] Source pass: `src/components/tpo/tpo-safe-csv-download.tsx` — Guarded CSV validates content type and nonempty payload; export pending/error unchanged; 44/36px and delayed URL release.
- [x] Source pass: `src/components/tpo/tpo-student-clipboard-actions.tsx` — Paste/copy student roster controls use shared Button and Textarea, hidden on printed reports.
- [x] Source pass: `src/components/tpo/tpo-batch-student-keyboard-actions.tsx` — Batch learner keyboard/clipboard/CSV toolbar has 44/36px targets and print exclusion; keyboard bindings retained.
- [x] Source pass: `src/components/tpo/tpo-batch-student-saved-views.tsx` — Saved batch CSV links have visible brand focus and 44/36px targets; entire saved-view control area excluded on print.
- [x] Source pass: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx` — Offer-letter evidence is a status table, not a letter generator; return link omitted on paper.
- [x] Source pass: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` — Offer evidence/current status and history remain printable; two internal navigation links hidden on paper.
- [x] Source pass: `src/components/admin/inbound-mail-list.tsx` — Inbound mail message preview no longer line-clamped on paper; read/triage buttons hidden or shared-sized.
- [ ] **Next exact source:** `src/components/auth/device-list.tsx` for the follow-on Super Admin/auth/shared-admin control pass; G4/G5 historical template and global scan remain separate open work.

### Legacy and vNext property matrices
Reference: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` = 44px mobile target at max-width 767px; `docs/design/ui-clone-checklist.md:46-47` = 36px, 9px radius, 14px/650 desktop controls; `docs/design/legacy-styles/components___accessibility.scss:18-21` = 2px solid teal with 3px offset; `docs/design/old-lms-pages.md:9` = compact tables and report layout. Shared components are imported but **not edited** in this pass.

#### `src/components/tpo/tpo-optional-emails-editor.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-optional-emails-editor.tsx:58`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-optional-emails-editor.tsx:58`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-optional-emails-editor.tsx:none`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-optional-emails-editor.tsx:59` alert, `:60` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-optional-emails-editor.tsx:50, 58` print-hidden lines; `:55` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Print-only On/Off summary for optional student emails; Checkbox edits and PATCH concurrency guard preserved | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/app/(authenticated)/tpo/settings/notices/page.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/app/(authenticated)/tpo/settings/notices/page.tsx:36, 41, 63, 66, 67`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/app/(authenticated)/tpo/settings/notices/page.tsx:36, 41, 63, 66, 67`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/app/(authenticated)/tpo/settings/notices/page.tsx:36, 41, 63, 66, 67`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/app/(authenticated)/tpo/settings/notices/page.tsx:none` alert, `:34, 40, 44, 61` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/app/(authenticated)/tpo/settings/notices/page.tsx:29, 36, 41, 63, 65, 66, 67` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Student Notices/Preparation settings navigation hidden on paper; Badge import restored and five links use teal/3px focus | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/tpo/tpo-communication-settings-editors.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-communication-settings-editors.tsx:45, 50, 89, 121, 128`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-communication-settings-editors.tsx:45, 50, 89, 121, 128`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-communication-settings-editors.tsx:none`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-communication-settings-editors.tsx:51, 90, 129` alert, `:52, 91, 130` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-communication-settings-editors.tsx:42, 45, 50, 76, 82, 87, 89 (+2)` print-hidden lines; `:47, 75, 125` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | SMS limit and recruiter-duration static print summaries; signature preview and save controls separated; PATCH unchanged | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/tpo/tpo-campaign-compose.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-campaign-compose.tsx:15, 89, 134, 137, 141`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-campaign-compose.tsx:15, 89, 134, 137, 141`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-campaign-compose.tsx:134, 137`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-campaign-compose.tsx:88, 95, 96, 140, 146` alert, `:84, 87, 91, 140, 145` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-campaign-compose.tsx:79, 89, 100, 106, 110, 115, 126 (+3)` print-hidden lines; `:83, 114` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Fixed incomplete JSX expression in Save draft label; preview and editable campaign stay separate on paper | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/tpo/tpo-safe-csv-download.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-safe-csv-download.tsx:39`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-safe-csv-download.tsx:39`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-safe-csv-download.tsx:none`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-safe-csv-download.tsx:42` alert, `:none` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-safe-csv-download.tsx:37` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Guarded CSV validates content type and nonempty payload; export pending/error unchanged; 44/36px and delayed URL release | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/tpo/tpo-student-clipboard-actions.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-student-clipboard-actions.tsx:28, 31, 38, 40`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-student-clipboard-actions.tsx:28, 31, 40`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-student-clipboard-actions.tsx:none`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-student-clipboard-actions.tsx:44` alert, `:46` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-student-clipboard-actions.tsx:26` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Paste/copy student roster controls use shared Button and Textarea, hidden on printed reports | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/tpo/tpo-batch-student-keyboard-actions.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-batch-student-keyboard-actions.tsx:40, 44, 46, 48, 49, 51, 57`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-batch-student-keyboard-actions.tsx:44, 46, 48, 49`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-batch-student-keyboard-actions.tsx:49`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-batch-student-keyboard-actions.tsx:none` alert, `:64` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-batch-student-keyboard-actions.tsx:36` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Batch learner keyboard/clipboard/CSV toolbar has 44/36px targets and print exclusion; keyboard bindings retained | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/tpo/tpo-batch-student-saved-views.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/tpo/tpo-batch-student-saved-views.tsx:62, 73, 75, 87, 95`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/tpo/tpo-batch-student-saved-views.tsx:62, 73, 95`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/tpo/tpo-batch-student-saved-views.tsx:95`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/tpo/tpo-batch-student-saved-views.tsx:102` alert, `:101` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/tpo/tpo-batch-student-saved-views.tsx:61` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Saved batch CSV links have visible brand focus and 44/36px targets; entire saved-view control area excluded on print | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx:41`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx:41`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx:41`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx:none` alert, `:none` status; `:48` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx:41` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Offer-letter evidence is a status table, not a letter generator; return link omitted on paper | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx:23, 31`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx:23, 31`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx:23, 31`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx:none` alert, `:none` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx:23, 31` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Offer evidence/current status and history remain printable; two internal navigation links hidden on paper | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

#### `src/components/admin/inbound-mail-list.tsx`
| State/property | Legacy source and actual value | vNext file:line and source value | Outcome |
|---|---|---|---|
| Phone target | `pages___admin-list-pages.scss:8,193-214`: **44px through 767px** | `src/components/admin/inbound-mail-list.tsx:53, 65`: `min-h-11` where present | Source matches when locally specified; no device measurement |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: **36px**, 9px radius, 14px/650 | `src/components/admin/inbound-mail-list.tsx:53, 65`: `md:min-h-9` or shared inherited control | Some controls inherit defaults; no computed CSS confirmation |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal / 3px offset** | `src/components/admin/inbound-mail-list.tsx:none`: explicit 3px outline offset on styled links where present | Other controls inherit shared focus and require visual check |
| Status/empty/error | `old-lms-pages.md:9`: compact borders and semantic pills | `src/components/admin/inbound-mail-list.tsx:none` alert, `:42, 69` status; `:none` shared table where applicable | Source-only; exact legacy error/loading/empty visuals unproven |
| Print/PDF/email | No actual authenticated email/offer/PDF print templates checked into legacy styles | `src/components/admin/inbound-mail-list.tsx:53` print-hidden lines; `:none` print-only static text | Screen-print source separation; **G5 output parity not verified** |
| Behavior | No complete historical matching interaction recording | Inbound mail message preview no longer line-clamped on paper; read/triage buttons hidden or shared-sized | Event handlers retained except safe Blob URL cleanup; runtime verification outstanding |

### Coverage proof — scoped lexical grep

| Whole source file | Raw button/input/select/textarea/table | Hard-coded hex | Shared Button open/close | Label open/close |
|---|---|---:|---:|---:|
| `src/components/tpo/tpo-optional-emails-editor.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1/1 |
| `src/app/(authenticated)/tpo/settings/notices/page.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0/0 |
| `src/components/tpo/tpo-communication-settings-editors.tsx` | 0/0/0/0/0 | 0 | 3/3 | 3/3 |
| `src/components/tpo/tpo-campaign-compose.tsx` | 0/0/0/0/0 | 0 | 2/2 | 5/5 |
| `src/components/tpo/tpo-safe-csv-download.tsx` | 0/0/0/0/0 | 0 | 1/1 | 0/0 |
| `src/components/tpo/tpo-student-clipboard-actions.tsx` | 0/0/0/0/0 | 0 | 3/3 | 1/1 |
| `src/components/tpo/tpo-batch-student-keyboard-actions.tsx` | 0/0/0/0/0 | 0 | 4/4 | 2/2 |
| `src/components/tpo/tpo-batch-student-saved-views.tsx` | 0/0/0/0/0 | 0 | 6/6 | 3/3 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0/0 |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0/0 |
| `src/components/admin/inbound-mail-list.tsx` | 0/0/0/0/0 | 0 | 2/2 | 0/0 |

Command to reproduce on a checkout (**not executed**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
  'src/components/tpo/tpo-optional-emails-editor.tsx' \\
  'src/app/(authenticated)/tpo/settings/notices/page.tsx' \\
  'src/components/tpo/tpo-communication-settings-editors.tsx' \\
  'src/components/tpo/tpo-campaign-compose.tsx' \\
  'src/components/tpo/tpo-safe-csv-download.tsx' \\
  'src/components/tpo/tpo-student-clipboard-actions.tsx' \\
  'src/components/tpo/tpo-batch-student-keyboard-actions.tsx' \\
  'src/components/tpo/tpo-batch-student-saved-views.tsx' \\
  'src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx' \\
  'src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx' \\
  'src/components/admin/inbound-mail-list.tsx'
```

**Responsive source evidence:** mobile width up to 767px uses `min-h-11` when locally specified (44px); `md:min-h-9` at 768px+ (36px). Source value comparison does not prove actual touch target dimensions or computed font/hover/focus CSS. `print:hidden` suppresses interactive controls. Saved email preferences, campaign subject/message and template examples have static text on paper while editing stays interactive on screen. Offer-letter **evidence** is not an actual PDF/offer letter and remains labelled unavailable where underlying records are missing. Provider-hosted ZeptoMail OTP/recruiter campaign HTML remains external and uninspected.

**Important source repair:** the previously stored `src/components/tpo/tpo-campaign-compose.tsx` Save draft button had an incomplete JSX expression `{busy?"Saving…":"Save draft"`; this pass explicitly repaired it to `{busy?"Saving…":"Save draft"}`. `src/app/(authenticated)/tpo/settings/notices/page.tsx` referenced `Badge` without an import, which was added from shared UI. These fixes are source-verified only; no compiler/CI was run.

**Still open, no strict G4/G5 tick:** repository-wide grep, all state/value tables, tablet/small-phone computed geometry, authenticated print preview and exact external PDF/certificate/receipt/offer/email HTML.

## chat-6 auth and Super Admin shared-Button source pass

These **seven complete source files** were re-fetched from the branch after updates. All visible native raw `<button>` candidates in this set were already converted to shared `Button` when this lane arrived, so this pass corrected breakpoints and paper states rather than performing redundant tag replacements. **No shared `src/components/ui/*.tsx` source was edited.**

- [x] Source pass `src/components/auth/device-list.tsx` — Device sign-out, other-device and all-device controls: shared Button hit targets; confirmations unchanged.
- [x] Source pass `src/components/auth/membership-recovery.tsx` — Membership recovery continuation: explicit type button, disabled while pending; same route and recovery call.
- [x] Source pass `src/components/auth/membership-chooser.tsx` — Membership chooser continue action: shared Button 44px/36px; selected membership logic unchanged.
- [x] Source pass `src/components/auth/login-form.tsx` — Sign-in method tab buttons, submit, resend, email fallback and restart actions: 44px/36px classes; keyboard arrows and submit/auth requests unchanged.
- [x] Source pass `src/components/admin/admin-revoke-sessions.tsx` — Admin revoke-sessions danger action: 44px/36px, print hidden; confirmation and permission API unchanged.
- [x] Source pass `src/components/admin/placement-panel-error-boundary.tsx` — Admin placement panel error recovery: Retry shared Button 44px/36px and paper hidden.
- [x] Source pass `src/components/admin/copy-finding-for-claude.tsx` — Copy findings for external review: shared Button 44px/36px, paper hidden; copy logic unchanged, JSX callback closing brace rechecked.
- [ ] **Next exact file:** `src/components/admin/college-archive-button.tsx` — inspect remaining Super Admin/raw-button queue and preserve its confirm/destructive behavior.

### Legacy file:line value tables (source-only)
Old values: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` 44px tap target through 767px; `docs/design/ui-clone-checklist.md:46-47` 36px/9px desktop button; `docs/design/legacy-styles/components___accessibility.scss:18-21` teal focus 2px / offset 3px. These are exact old **style sources**, not a computed browser read.

#### `src/components/auth/device-list.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/auth/device-list.tsx:83, 106` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/auth/device-list.tsx:83, 106` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/auth/device-list.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/auth/device-list.tsx:not present` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/auth/device-list.tsx:not present` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Device sign-out, other-device and all-device controls: shared Button hit targets; confirmations unchanged | Code only; not executed |

#### `src/components/auth/membership-recovery.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/auth/membership-recovery.tsx:56` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/auth/membership-recovery.tsx:56` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/auth/membership-recovery.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/auth/membership-recovery.tsx:64` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/auth/membership-recovery.tsx:not present` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Membership recovery continuation: explicit type button, disabled while pending; same route and recovery call | Code only; not executed |

#### `src/components/auth/membership-chooser.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/auth/membership-chooser.tsx:130, 161` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/auth/membership-chooser.tsx:161` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/auth/membership-chooser.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/auth/membership-chooser.tsx:111` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/auth/membership-chooser.tsx:not present` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Membership chooser continue action: shared Button 44px/36px; selected membership logic unchanged | Code only; not executed |

#### `src/components/auth/login-form.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/auth/login-form.tsx:395, 396, 434, 514, 530, 540, 550` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/auth/login-form.tsx:395, 396, 434, 514, 530, 540, 550` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/auth/login-form.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/auth/login-form.tsx:329, 427` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/auth/login-form.tsx:not present` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Sign-in method tab buttons, submit, resend, email fallback and restart actions: 44px/36px classes; keyboard arrows and submit/auth requests unchanged | Code only; not executed |

#### `src/components/admin/admin-revoke-sessions.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/admin/admin-revoke-sessions.tsx:39` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/admin/admin-revoke-sessions.tsx:39` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/admin/admin-revoke-sessions.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/admin/admin-revoke-sessions.tsx:not present` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/admin/admin-revoke-sessions.tsx:39` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Admin revoke-sessions danger action: 44px/36px, print hidden; confirmation and permission API unchanged | Code only; not executed |

#### `src/components/admin/placement-panel-error-boundary.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/admin/placement-panel-error-boundary.tsx:14` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/admin/placement-panel-error-boundary.tsx:14` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/admin/placement-panel-error-boundary.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/admin/placement-panel-error-boundary.tsx:11` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/admin/placement-panel-error-boundary.tsx:14` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Admin placement panel error recovery: Retry shared Button 44px/36px and paper hidden | Code only; not executed |

#### `src/components/admin/copy-finding-for-claude.tsx`

| State | Legacy file:line/value | vNext source file:line/value | Evidence |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` 44px through 767px | `src/components/admin/copy-finding-for-claude.tsx:20` `min-h-11` | Source token comparison, not device screenshot |
| Tablet/desktop | `ui-clone-checklist.md:46-47` 36px and 9px radius | `src/components/admin/copy-finding-for-claude.tsx:20` `md:min-h-9` + shared radius | Source only |
| Keyboard focus | `components___accessibility.scss:18-21` 2px teal / 3px offset | `src/components/admin/copy-finding-for-claude.tsx:not present` explicit focus when present, otherwise shared Button inherited outline | Shared focus offset differs from global legacy in some states; open |
| Busy/disabled/error | Legacy shared hover/disabled/error states not fully available for this specific screen | `src/components/admin/copy-finding-for-claude.tsx:not present` alert; existing `disabled`/pending/ConfirmDialog kept | Behavior source preserved; no actual execution |
| Print | No historical authenticated PDF or device-print target source | `src/components/admin/copy-finding-for-claude.tsx:20` print:hidden if applicable | Source only; G5 open |
| Functional state | No old end-to-end interaction fixture | Copy findings for external review: shared Button 44px/36px, paper hidden; copy logic unchanged, JSX callback closing brace rechecked | Code only; not executed |


### Scoped grep source counts

| File | Raw button/input/select/textarea/table | Hard-coded hex | Shared Button open/close |
|---|---|---:|---:|
| `src/components/auth/device-list.tsx` | 0/0/0/0/0 | 0 | 2/2 |
| `src/components/auth/membership-recovery.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/auth/membership-chooser.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/auth/login-form.tsx` | 0/0/0/0/0 | 0 | 6/6 |
| `src/components/admin/admin-revoke-sessions.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/placement-panel-error-boundary.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/copy-finding-for-claude.tsx` | 0/0/0/0/0 | 0 | 1/1 |

All seven listed files have **0 raw native form/button/table tags** and **0 local CSS hex literals** by source regex; opener/closer counts match. This covers exactly the fetched files, **not** every file in the repo.

Reproduce in a checkout (**not executed**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
  'src/components/auth/device-list.tsx' \\
  'src/components/auth/membership-recovery.tsx' \\
  'src/components/auth/membership-chooser.tsx' \\
  'src/components/auth/login-form.tsx' \\
  'src/components/admin/admin-revoke-sessions.tsx' \\
  'src/components/admin/placement-panel-error-boundary.tsx' \\
  'src/components/admin/copy-finding-for-claude.tsx'
```

**Responsive source proof:** `min-h-11` is 44px mobile 0–767px, `md:min-h-9` is 36px from 768px. Login method selection keeps keyboard arrow/Home/End handlers, resend and cooldown/disabled states. Explicit sign-out confirmation dialogs stay shared. Native browser screenshots, actual 640px/768px computed CSS, runtime typecheck, CLI lint, tests and CI **not run**. G4/G5 historical PDF/email output and category tick remain open.

## chat-6 Super Admin mutation controls print-safe source batch

- [x] Scoped source file: `src/components/admin/college-archive-button.tsx` — Archive button and ConfirmDialog retain guards/loading; interactive destructive actions excluded on paper.
- [x] Scoped source file: `src/components/admin/tenant-restore-action.tsx` — Tenant Restore confirmation and permission-scoped API retained; print omits mutation trigger.
- [x] Scoped source file: `src/components/admin/college-admin-lifecycle-action.tsx` — Administrator suspend/reactivate reason and confirm form entirely excluded from print.
- [x] Scoped source file: `src/components/admin/tenant-settings-other-keys.tsx` — Tenant stored-key values and editing actions intentionally excluded from printing to avoid exposing reference configuration; 3px focus and responsive controls aligned.
- [x] Scoped source file: `src/components/admin/college-feature-rule-editor.tsx` — College module-feature override Select and mutation controls source-aligned, entire mutation editor hidden on paper.
- [ ] **Next exact file**: `src/components/admin/college-signin-method-form.tsx`, followed by other admin settings / people mutations. G4/G5 remain unverified at category level.

Source-of-truth numeric properties: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` 44px touch minimum at ≤767px; `docs/design/ui-clone-checklist.md:46-47` 36px button / 9px radius / 14px-650; `docs/design/legacy-styles/components___accessibility.scss:18-21` teal 2px outline with 3px offset. Print original still absent. **No shared ui components edited.**

#### `src/components/admin/college-archive-button.tsx`
| Property/state | Old LMS source / value | Current vNext file:line / value | Result |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` **44px ≤767px** | `src/components/admin/college-archive-button.tsx:119, 133, 141` `min-h-11`, when present | Source match; no measured device |
| Tablet/desktop | `ui-clone-checklist.md:46-47` **36px/9px radius** | `src/components/admin/college-archive-button.tsx:119, 133, 141` `md:min-h-9` | Source token; computed style unverified |
| Focus | `components___accessibility.scss:18-21` **2px teal, offset 3px** | `src/components/admin/college-archive-button.tsx:none` explicit 3px focus when present | Else inherited Button focus, full parity open |
| Busy/error/empty | Old per-action screenshots/status absent | Guard/disabled/ConfirmDialog retained, `src/components/admin/college-archive-button.tsx:none` alert if present | No app or compiler check |
| Paper | Legacy paper template missing | `src/components/admin/college-archive-button.tsx:119, 133, 141` print exclusions | Prevents action exposure; no actual PDF validation |
| Semantics | Legacy full action flow unavailable | Archive button and ConfirmDialog retain guards/loading; interactive destructive actions excluded on paper | Source reviewed, interactions not executed |

#### `src/components/admin/tenant-restore-action.tsx`
| Property/state | Old LMS source / value | Current vNext file:line / value | Result |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` **44px ≤767px** | `src/components/admin/tenant-restore-action.tsx:37` `min-h-11`, when present | Source match; no measured device |
| Tablet/desktop | `ui-clone-checklist.md:46-47` **36px/9px radius** | `src/components/admin/tenant-restore-action.tsx:37` `md:min-h-9` | Source token; computed style unverified |
| Focus | `components___accessibility.scss:18-21` **2px teal, offset 3px** | `src/components/admin/tenant-restore-action.tsx:none` explicit 3px focus when present | Else inherited Button focus, full parity open |
| Busy/error/empty | Old per-action screenshots/status absent | Guard/disabled/ConfirmDialog retained, `src/components/admin/tenant-restore-action.tsx:none` alert if present | No app or compiler check |
| Paper | Legacy paper template missing | `src/components/admin/tenant-restore-action.tsx:37` print exclusions | Prevents action exposure; no actual PDF validation |
| Semantics | Legacy full action flow unavailable | Tenant Restore confirmation and permission-scoped API retained; print omits mutation trigger | Source reviewed, interactions not executed |

#### `src/components/admin/college-admin-lifecycle-action.tsx`
| Property/state | Old LMS source / value | Current vNext file:line / value | Result |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` **44px ≤767px** | `src/components/admin/college-admin-lifecycle-action.tsx:39, 42` `min-h-11`, when present | Source match; no measured device |
| Tablet/desktop | `ui-clone-checklist.md:46-47` **36px/9px radius** | `src/components/admin/college-admin-lifecycle-action.tsx:39, 42` `md:min-h-9` | Source token; computed style unverified |
| Focus | `components___accessibility.scss:18-21` **2px teal, offset 3px** | `src/components/admin/college-admin-lifecycle-action.tsx:none` explicit 3px focus when present | Else inherited Button focus, full parity open |
| Busy/error/empty | Old per-action screenshots/status absent | Guard/disabled/ConfirmDialog retained, `src/components/admin/college-admin-lifecycle-action.tsx:none` alert if present | No app or compiler check |
| Paper | Legacy paper template missing | `src/components/admin/college-admin-lifecycle-action.tsx:36` print exclusions | Prevents action exposure; no actual PDF validation |
| Semantics | Legacy full action flow unavailable | Administrator suspend/reactivate reason and confirm form entirely excluded from print | Source reviewed, interactions not executed |

#### `src/components/admin/tenant-settings-other-keys.tsx`
| Property/state | Old LMS source / value | Current vNext file:line / value | Result |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` **44px ≤767px** | `src/components/admin/tenant-settings-other-keys.tsx:59, 69, 73, 77` `min-h-11`, when present | Source match; no measured device |
| Tablet/desktop | `ui-clone-checklist.md:46-47` **36px/9px radius** | `src/components/admin/tenant-settings-other-keys.tsx:59, 69, 73, 77` `md:min-h-9` | Source token; computed style unverified |
| Focus | `components___accessibility.scss:18-21` **2px teal, offset 3px** | `src/components/admin/tenant-settings-other-keys.tsx:52` explicit 3px focus when present | Else inherited Button focus, full parity open |
| Busy/error/empty | Old per-action screenshots/status absent | Guard/disabled/ConfirmDialog retained, `src/components/admin/tenant-settings-other-keys.tsx:none` alert if present | No app or compiler check |
| Paper | Legacy paper template missing | `src/components/admin/tenant-settings-other-keys.tsx:45` print exclusions | Prevents action exposure; no actual PDF validation |
| Semantics | Legacy full action flow unavailable | Tenant stored-key values and editing actions intentionally excluded from printing to avoid exposing reference configuration; 3px focus and responsive controls aligned | Source reviewed, interactions not executed |

#### `src/components/admin/college-feature-rule-editor.tsx`
| Property/state | Old LMS source / value | Current vNext file:line / value | Result |
|---|---|---|---|
| Phone | `pages___admin-list-pages.scss:8,193-214` **44px ≤767px** | `src/components/admin/college-feature-rule-editor.tsx:75, 80` `min-h-11`, when present | Source match; no measured device |
| Tablet/desktop | `ui-clone-checklist.md:46-47` **36px/9px radius** | `src/components/admin/college-feature-rule-editor.tsx:75, 80` `md:min-h-9` | Source token; computed style unverified |
| Focus | `components___accessibility.scss:18-21` **2px teal, offset 3px** | `src/components/admin/college-feature-rule-editor.tsx:none` explicit 3px focus when present | Else inherited Button focus, full parity open |
| Busy/error/empty | Old per-action screenshots/status absent | Guard/disabled/ConfirmDialog retained, `src/components/admin/college-feature-rule-editor.tsx:none` alert if present | No app or compiler check |
| Paper | Legacy paper template missing | `src/components/admin/college-feature-rule-editor.tsx:72` print exclusions | Prevents action exposure; no actual PDF validation |
| Semantics | Legacy full action flow unavailable | College module-feature override Select and mutation controls source-aligned, entire mutation editor hidden on paper | Source reviewed, interactions not executed |

### Scoped literal grep counts

| File | Raw button/input/select/textarea/table | Hex | Shared Button tags |
|---|---|---:|---:|
| `src/components/admin/college-archive-button.tsx` | 0/0/0/0/0 | 0 | 3/3 |
| `src/components/admin/tenant-restore-action.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/college-admin-lifecycle-action.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/tenant-settings-other-keys.tsx` | 0/0/0/0/0 | 0 | 2/2 |
| `src/components/admin/college-feature-rule-editor.tsx` | 0/0/0/0/0 | 0 | 2/2 |

Checkout grep (documented, **not run**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 'src/components/admin/college-archive-button.tsx' \\
 'src/components/admin/tenant-restore-action.tsx' \\
 'src/components/admin/college-admin-lifecycle-action.tsx' \\
 'src/components/admin/tenant-settings-other-keys.tsx' \\
 'src/components/admin/college-feature-rule-editor.tsx'
```

Responsive proof is limited to the 44px mobile/36px 768px+ source classes and inherited shared form control contracts. No React/TypeScript validation, screen recording, printer PDF render or provider-hosted email template comparison. **G4/G5 remain unticked.**

## chat-6 college sign-in, branding and academic print source verification

- [x] Scoped source file `src/components/admin/college-signin-method-form.tsx` — Saved college sign-in policy label prints as text; Radio edit/save only on screen, server version-check unchanged.
- [x] Scoped source file `src/components/admin/college-branding-form.tsx` — Branding form hidden on paper; fixed sign-in preview remains, no API/color persistence behavior changed.
- [x] Scoped source file `src/components/admin/college-logo-uploader.tsx` — Stored logo image stays printable, file chooser/crop sliders/mutation controls hidden; file checks and crop geometry untouched.
- [x] Scoped source file `src/components/admin/academic-module-scope-inventory.tsx` — Scope DataTable print wrapper shows existing bounded loaded rows, pagination and disclosure controls hidden; does NOT claim printing all hierarchy pages.
- [ ] **Next exact source file**: `src/components/admin/college-create-form.tsx` — remaining Super Admin/new-college form Button and responsive/print states. G4/G5 historical template parity still unticked.

Numeric legacy baseline: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` mobile min **44px** through 767px; `docs/design/ui-clone-checklist.md:46-47` desktop **36px**, radius 9px, text 14/650; `docs/design/legacy-styles/components___accessibility.scss:18-21` keyboard focus 2px teal and offset 3px. The original authenticated print/PDF/email templates are still unavailable.

#### `src/components/admin/college-signin-method-form.tsx`

| State | Exact legacy file:line/value | Current vNext file:line/value | Verdict |
|---|---|---|---|
| Mobile tap control | `pages___admin-list-pages.scss:8,193-214`: **44px ≤767px** | `src/components/admin/college-signin-method-form.tsx:67` `min-h-11` when present | Token match, no physical test |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14/650 | `src/components/admin/college-signin-method-form.tsx:67` `md:min-h-9` | Token source comparison only |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal/3px offset** | `src/components/admin/college-signin-method-form.tsx:59` explicit 3px where applied; shared controls otherwise | Shared focus may differ; open |
| Print interaction | No historical print template for this report | `src/components/admin/college-signin-method-form.tsx:57, 67` hidden edit controls, `:65` read-only paper values | Intended print source; no rendered preview |
| Data/table/empty | `old-lms-pages.md:9` compact shared table/empty | `src/components/admin/college-signin-method-form.tsx:none` inherited table if present, existing error/empty states | No exact legacy screenshot for all states |
| Behavior | Historic flows not in supplied SCSS | Saved college sign-in policy label prints as text; Radio edit/save only on screen, server version-check unchanged | Business actions preserved, no runtime tests |

#### `src/components/admin/college-branding-form.tsx`

| State | Exact legacy file:line/value | Current vNext file:line/value | Verdict |
|---|---|---|---|
| Mobile tap control | `pages___admin-list-pages.scss:8,193-214`: **44px ≤767px** | `src/components/admin/college-branding-form.tsx:169, 195, 209, 249` `min-h-11` when present | Token match, no physical test |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14/650 | `src/components/admin/college-branding-form.tsx:169, 195, 209, 249` `md:min-h-9` | Token source comparison only |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal/3px offset** | `src/components/admin/college-branding-form.tsx:none` explicit 3px where applied; shared controls otherwise | Shared focus may differ; open |
| Print interaction | No historical print template for this report | `src/components/admin/college-branding-form.tsx:145` hidden edit controls, `:none` read-only paper values | Intended print source; no rendered preview |
| Data/table/empty | `old-lms-pages.md:9` compact shared table/empty | `src/components/admin/college-branding-form.tsx:none` inherited table if present, existing error/empty states | No exact legacy screenshot for all states |
| Behavior | Historic flows not in supplied SCSS | Branding form hidden on paper; fixed sign-in preview remains, no API/color persistence behavior changed | Business actions preserved, no runtime tests |

#### `src/components/admin/college-logo-uploader.tsx`

| State | Exact legacy file:line/value | Current vNext file:line/value | Verdict |
|---|---|---|---|
| Mobile tap control | `pages___admin-list-pages.scss:8,193-214`: **44px ≤767px** | `src/components/admin/college-logo-uploader.tsx:83, 100, 105` `min-h-11` when present | Token match, no physical test |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14/650 | `src/components/admin/college-logo-uploader.tsx:83, 100, 105` `md:min-h-9` | Token source comparison only |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal/3px offset** | `src/components/admin/college-logo-uploader.tsx:none` explicit 3px where applied; shared controls otherwise | Shared focus may differ; open |
| Print interaction | No historical print template for this report | `src/components/admin/college-logo-uploader.tsx:80, 85, 105` hidden edit controls, `:none` read-only paper values | Intended print source; no rendered preview |
| Data/table/empty | `old-lms-pages.md:9` compact shared table/empty | `src/components/admin/college-logo-uploader.tsx:none` inherited table if present, existing error/empty states | No exact legacy screenshot for all states |
| Behavior | Historic flows not in supplied SCSS | Stored logo image stays printable, file chooser/crop sliders/mutation controls hidden; file checks and crop geometry untouched | Business actions preserved, no runtime tests |

#### `src/components/admin/academic-module-scope-inventory.tsx`

| State | Exact legacy file:line/value | Current vNext file:line/value | Verdict |
|---|---|---|---|
| Mobile tap control | `pages___admin-list-pages.scss:8,193-214`: **44px ≤767px** | `src/components/admin/academic-module-scope-inventory.tsx:49, 50, 63, 65` `min-h-11` when present | Token match, no physical test |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14/650 | `src/components/admin/academic-module-scope-inventory.tsx:49, 50, 63, 65` `md:min-h-9` | Token source comparison only |
| Keyboard focus | `components___accessibility.scss:18-21`: **2px teal/3px offset** | `src/components/admin/academic-module-scope-inventory.tsx:63, 65` explicit 3px where applied; shared controls otherwise | Shared focus may differ; open |
| Print interaction | No historical print template for this report | `src/components/admin/academic-module-scope-inventory.tsx:48, 60` hidden edit controls, `:none` read-only paper values | Intended print source; no rendered preview |
| Data/table/empty | `old-lms-pages.md:9` compact shared table/empty | `src/components/admin/academic-module-scope-inventory.tsx:55` inherited table if present, existing error/empty states | No exact legacy screenshot for all states |
| Behavior | Historic flows not in supplied SCSS | Scope DataTable print wrapper shows existing bounded loaded rows, pagination and disclosure controls hidden; does NOT claim printing all hierarchy pages | Business actions preserved, no runtime tests |

### Scoped grep and responsive proof
| File | Native button/input/select/textarea/table | Hex | Shared Button open/close |
|---|---|---:|---:|
| `src/components/admin/college-signin-method-form.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/college-branding-form.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/college-logo-uploader.tsx` | 0/0/0/0/0 | 0 | 2/2 |
| `src/components/admin/academic-module-scope-inventory.tsx` | 0/0/0/0/0 | 0 | 2/2 |

All four full files were re-read. This is **not** a repository-wide grep. Reproduce in a checkout, **not executed**:
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 'src/components/admin/college-signin-method-form.tsx' \\
 'src/components/admin/college-branding-form.tsx' \\
 'src/components/admin/college-logo-uploader.tsx' \\
 'src/components/admin/academic-module-scope-inventory.tsx'
```

**Responsive source:** 44px `min-h-11` until 767px, 36px `md:min-h-9` from 768px where those overrides exist; no phone/tablet browser measurement. **Print source:** mutating forms and pagination do not appear in paper output; stored sign-in setting, branding preview and existing academic rows are legible as noninteractive text/graphics. Academic scope pagination still limits the underlying loaded data, so print is **not** the entire hierarchy. No CI/app/compile or printer validation. **G4/G5 remain unticked.**

## chat-6 creation forms: responsive and print controls

Source remediation completed, without changing form validation, existing input labels, tenant authorization, create requests or navigation:
- [x] `src/components/admin/college-create-form.tsx` — visible inputs or selects meet 44px minimum phone, 36px at 768px+ where locally sized; creation controls hidden on printed output.
- [x] `src/components/admin/organization-create-form.tsx` — visible inputs or selects meet 44px minimum phone, 36px at 768px+ where locally sized; creation controls hidden on printed output.
- [x] `src/components/admin/department-create-form.tsx` — visible inputs or selects meet 44px minimum phone, 36px at 768px+ where locally sized; creation controls hidden on printed output.
- [ ] **Next exact file:** `src/components/admin/tenant-domain-manager.tsx` — inspect domain verification/export/printed records without exposing sensitive DNS tokens. G4/G5 global strict parity remains open.

Reference values: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` 44px mobile through 767px; `docs/design/ui-clone-checklist.md:46-47` measured 36px desktop/9px radius/14px weight-650; `docs/design/legacy-styles/components___accessibility.scss:18-21` 2px teal keyboard ring offset 3px. Actual old-LMS create form/paper fixtures were not provided.

#### `src/components/admin/college-create-form.tsx`

| State | Old LMS source / value | Current vNext source / value | Proof |
|---|---|---|---|
| Phone field/action height | `pages___admin-list-pages.scss:8,193-214`: 44px at ≤767px | `src/components/admin/college-create-form.tsx:105, 126, 143, 165, 173` `min-h-11` | Source value only |
| Desktop size | `ui-clone-checklist.md:46-47`: 36px, radius 9px | `src/components/admin/college-create-form.tsx:105, 126, 143, 165, 173` `md:min-h-9`, shared radius | Source only |
| Focus/disabled/errors | `components___accessibility.scss:18-21` 2px teal +3px | Shared Input/Select/Button inherited focus and disabled states, existing form errors `:none` | Still need browser and full state table |
| Paper view | No legacy authenticated print values | `src/components/admin/college-create-form.tsx:95` `print:hidden` form | Conservative interactive form exclusion, no actual PDF |
| Regression | Original request validation preserved | Same handlers/props except local visual classes | Source-level, no code execution |

#### `src/components/admin/organization-create-form.tsx`

| State | Old LMS source / value | Current vNext source / value | Proof |
|---|---|---|---|
| Phone field/action height | `pages___admin-list-pages.scss:8,193-214`: 44px at ≤767px | `src/components/admin/organization-create-form.tsx:69, 77` `min-h-11` | Source value only |
| Desktop size | `ui-clone-checklist.md:46-47`: 36px, radius 9px | `src/components/admin/organization-create-form.tsx:69, 77` `md:min-h-9`, shared radius | Source only |
| Focus/disabled/errors | `components___accessibility.scss:18-21` 2px teal +3px | Shared Input/Select/Button inherited focus and disabled states, existing form errors `:none` | Still need browser and full state table |
| Paper view | No legacy authenticated print values | `src/components/admin/organization-create-form.tsx:59` `print:hidden` form | Conservative interactive form exclusion, no actual PDF |
| Regression | Original request validation preserved | Same handlers/props except local visual classes | Source-level, no code execution |

#### `src/components/admin/department-create-form.tsx`

| State | Old LMS source / value | Current vNext source / value | Proof |
|---|---|---|---|
| Phone field/action height | `pages___admin-list-pages.scss:8,193-214`: 44px at ≤767px | `src/components/admin/department-create-form.tsx:66, 74` `min-h-11` | Source value only |
| Desktop size | `ui-clone-checklist.md:46-47`: 36px, radius 9px | `src/components/admin/department-create-form.tsx:66, 74` `md:min-h-9`, shared radius | Source only |
| Focus/disabled/errors | `components___accessibility.scss:18-21` 2px teal +3px | Shared Input/Select/Button inherited focus and disabled states, existing form errors `:79` | Still need browser and full state table |
| Paper view | No legacy authenticated print values | `src/components/admin/department-create-form.tsx:55` `print:hidden` form | Conservative interactive form exclusion, no actual PDF |
| Regression | Original request validation preserved | Same handlers/props except local visual classes | Source-level, no code execution |

### Scoped grep proof
| File | Native button/input/select/textarea/table | Hex literal | Button open/close |
|---|---|---:|---:|
| `src/components/admin/college-create-form.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/organization-create-form.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/department-create-form.tsx` | 0/0/0/0/0 | 0 | 1/1 |

Checkout command for reproducibility (documented, **not run**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 'src/components/admin/college-create-form.tsx' \\
 'src/components/admin/organization-create-form.tsx' \\
 'src/components/admin/department-create-form.tsx'
```

**Responsive source**: 0–767px classes target 44px, 768px+ target 36px. **Print**: interactive creation forms hidden. No runtime app, TypeScript strict pass, CI or screenshot; G4/G5 remain `[ ]`.

## Replacement chat-6 continued — Super Admin tenant, policy and navigation screens

**Work queue (source remediation, not final G4/G5 pixel-parity ticks):**
- [x] `src/components/admin/tenant-domain-manager.tsx` — Tenant domain GET state/list, verified/primary badges and last DNS-check dates retained; edit, Verify/Make primary/Delete controls suppressed in print, TXT verification value suppressed in print, input and dangerous confirmation focus/touch sized.
- [x] `src/components/admin/managed-college-subdomain.tsx` — Managed hostname current-state paragraphs retained in print while editable subdomain input and allot/change/remove are paper-hidden; wildcard warning remains.
- [x] `src/components/admin/college-edit-dialog.tsx` — College edit launcher paper-hidden and all eight edit modal inputs sized; saved college details and API behavior unchanged.
- [x] `src/components/admin/college-setup-checklist.tsx` — Setup list ActionLink has exact local teal 2px/3px focus, 44px/36px and no printed Open nav controls.
- [x] `src/components/admin/college-dashboard-section-failure.tsx` — Failure retry link has 2px teal/3px outline and print exclusion; shared ErrorState retained.
- [x] `src/components/admin/academic-setup-steps.tsx` — Academic setup step links, disabled step labels, and refresh action excluded on paper; 44px/36px targets and 2px teal/3px focus.
- [x] `src/components/admin/department-actions.tsx` — Department Rename/Archive action group excluded from print; input 44px/36px; custom ConfirmDialog/discard/archival dependency logic retained.
- [x] `src/components/admin/organization-actions.tsx` — Organization action group excluded from print, edit input 44px/36px; archival and rename dialogs retained.
- [x] `src/components/admin/person-membership-actions.tsx` — Member roles/suspend/reactivate/end row actions excluded on paper, text areas and Buttons 44px/36px; permission and state guards unchanged.
- [x] `src/components/admin/descendant-feature-rule-editor.tsx` — Descendant feature rule selectors/actions excluded on paper; six breakpoint modifiers normalized to md 36px; original guarded policy actions untouched.
- [x] `src/components/admin/student-rule-editor.tsx` — Student module override editing hidden on paper; Select/Checkbox/action minimums match 44px mobile and 36px desktop; ConfirmDialog remains guarded.
- [ ] **Next exact file:** `src/components/admin/admin-dashboard-actions.tsx` — focus of Quick Actions cards and keyboard/hover states; then `src/components/admin/tenant-settings-editor.tsx`, `src/components/admin/super-admin-platform-block-action.tsx`.

Legacy numeric design constraints: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` = 44px min phone through 767px; `docs/design/ui-clone-checklist.md:46-47` = 36px desktop, 9px radius, font 14px/650; `docs/design/legacy-styles/components___accessibility.scss:18-21` = 2px solid teal, offset 3px; `docs/design/old-lms-pages.md:9` = compact table/borders, status and badges. Domain verification TXT values are deliberately **not printed**; they are editable tenant proof, not historical report output. We neither printed them nor changed access-control behavior.

### Individual legacy/vNext property matrices

#### `src/components/admin/tenant-domain-manager.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/tenant-domain-manager.tsx:193, 207, 274, 293, 305, 405` `min-h-11` (6 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/tenant-domain-manager.tsx:193, 207, 274, 293, 305, 405` `md:min-h-9` (6 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/tenant-domain-manager.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/tenant-domain-manager.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/tenant-domain-manager.tsx:182, 269, 320` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Tenant domain GET state/list, verified/primary badges and last DNS-check dates retained; edit, Verify/Make primary/Delete controls suppressed in print, TXT verification value suppressed in print, input and dangerous confirmation focus/touch sized | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/managed-college-subdomain.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/managed-college-subdomain.tsx:52, 58, 61` `min-h-11` (3 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/managed-college-subdomain.tsx:52, 58, 61` `md:min-h-9` (3 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/managed-college-subdomain.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/managed-college-subdomain.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/managed-college-subdomain.tsx:49, 56` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Managed hostname current-state paragraphs retained in print while editable subdomain input and allot/change/remove are paper-hidden; wildcard warning remains | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/college-edit-dialog.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/college-edit-dialog.tsx:92, 115, 124, 140, 151, 169, 187, 205` `min-h-11` (8 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/college-edit-dialog.tsx:92, 115, 124, 140, 151, 169, 187, 205` `md:min-h-9` (8 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/college-edit-dialog.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/college-edit-dialog.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/college-edit-dialog.tsx:92` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | College edit launcher paper-hidden and all eight edit modal inputs sized; saved college details and API behavior unchanged | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/college-setup-checklist.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/college-setup-checklist.tsx:35` `min-h-11` (1 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/college-setup-checklist.tsx:35` `md:min-h-9` (1 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/college-setup-checklist.tsx:35` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/college-setup-checklist.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/college-setup-checklist.tsx:35` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Setup list ActionLink has exact local teal 2px/3px focus, 44px/36px and no printed Open nav controls | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/college-dashboard-section-failure.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/college-dashboard-section-failure.tsx:9` `min-h-11` (1 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/college-dashboard-section-failure.tsx:9` `md:min-h-9` (1 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/college-dashboard-section-failure.tsx:9` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/college-dashboard-section-failure.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/college-dashboard-section-failure.tsx:9` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Failure retry link has 2px teal/3px outline and print exclusion; shared ErrorState retained | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/academic-setup-steps.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/academic-setup-steps.tsx:28, 30, 32, 34, 36` `min-h-11` (5 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/academic-setup-steps.tsx:28, 30, 32, 34, 36` `md:min-h-9` (5 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/academic-setup-steps.tsx:28, 30, 34` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/academic-setup-steps.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/academic-setup-steps.tsx:21` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Academic setup step links, disabled step labels, and refresh action excluded on paper; 44px/36px targets and 2px teal/3px focus | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/department-actions.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/department-actions.tsx:188, 229` `min-h-11` (2 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/department-actions.tsx:188, 229` `md:min-h-9` (2 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/department-actions.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/department-actions.tsx:none` status and `:229` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/department-actions.tsx:133` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Department Rename/Archive action group excluded from print; input 44px/36px; custom ConfirmDialog/discard/archival dependency logic retained | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/organization-actions.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/organization-actions.tsx:146` `min-h-11` (1 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/organization-actions.tsx:146` `md:min-h-9` (1 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/organization-actions.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/organization-actions.tsx:none` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/organization-actions.tsx:92` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Organization action group excluded from print, edit input 44px/36px; archival and rename dialogs retained | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/person-membership-actions.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/person-membership-actions.tsx:213, 224, 236, 252, 277, 311, 319, 347` `min-h-11` (8 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/person-membership-actions.tsx:213, 224, 236, 252, 277, 311, 319, 347` `md:min-h-9` (8 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/person-membership-actions.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/person-membership-actions.tsx:292` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/person-membership-actions.tsx:202` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Member roles/suspend/reactivate/end row actions excluded on paper, text areas and Buttons 44px/36px; permission and state guards unchanged | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/descendant-feature-rule-editor.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/descendant-feature-rule-editor.tsx:45, 54, 59, 61, 64, 65` `min-h-11` (6 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/descendant-feature-rule-editor.tsx:45, 54, 59, 61, 64, 65` `md:min-h-9` (6 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/descendant-feature-rule-editor.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/descendant-feature-rule-editor.tsx:67` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/descendant-feature-rule-editor.tsx:43` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Descendant feature rule selectors/actions excluded on paper; six breakpoint modifiers normalized to md 36px; original guarded policy actions untouched | File reviewed, no runtime or TypeScript tests |


#### `src/components/admin/student-rule-editor.tsx`

| State or property | Exact old LMS file:line value | vNext file:line value / modifier | Proof status |
|---|---|---|---|
| Phone interactive target | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/student-rule-editor.tsx:72, 76, 82, 83` `min-h-11` (4 source lines) or shared inherited target | Source token proof only; no device computed height |
| Desktop tablet target | `ui-clone-checklist.md:46-47`: 36px height/9px radius, 14px font weight 650 | `src/components/admin/student-rule-editor.tsx:72, 82, 83` `md:min-h-9` (3 source lines) | Source token proof only; full exact skin states not measured |
| Keyboard focus | `components___accessibility.scss:18-21`: solid teal 2px, offset 3px | `src/components/admin/student-rule-editor.tsx:none` explicit 3px focus links/forms where present; remaining shared Button inherits | Exact globally computed ring/disabled/hover OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: compact rows and warning/status badges | `src/components/admin/student-rule-editor.tsx:85` status and `:none` alert, table `:none` if used | Controls/guards preserved; full historical states not available |
| Print appearance | Historical authenticated PDF/print template missing | `src/components/admin/student-rule-editor.tsx:68` source print:hidden modifier(s); shared authenticated-print.css | Conservative screen→paper separation, not certified legacy print parity |
| Business action | No historical action recording in checked-in legacy styles | Student module override editing hidden on paper; Select/Checkbox/action minimums match 44px mobile and 36px desktop; ConfirmDialog remains guarded | File reviewed, no runtime or TypeScript tests |

### Whole-file scoped grep and JSX pairing source proof

| Scoped TSX file | Native button/input/select/textarea/table | Local CSS hex literals | Shared Button open/close | Print-hide markers |
|---|---|---:|---:|---:|
| `src/components/admin/tenant-domain-manager.tsx` | 0/0/0/0/0 | 0 | 4/4 | 3 |
| `src/components/admin/managed-college-subdomain.tsx` | 0/0/0/0/0 | 0 | 2/2 | 2 |
| `src/components/admin/college-edit-dialog.tsx` | 0/0/0/0/0 | 0 | 3/3 | 1 |
| `src/components/admin/college-setup-checklist.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/college-dashboard-section-failure.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/academic-setup-steps.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/department-actions.tsx` | 0/0/0/0/0 | 0 | 7/7 | 1 |
| `src/components/admin/organization-actions.tsx` | 0/0/0/0/0 | 0 | 4/4 | 1 |
| `src/components/admin/person-membership-actions.tsx` | 0/0/0/0/0 | 0 | 6/6 | 1 |
| `src/components/admin/descendant-feature-rule-editor.tsx` | 0/0/0/0/0 | 0 | 2/2 | 1 |
| `src/components/admin/student-rule-editor.tsx` | 0/0/0/0/0 | 0 | 2/2 | 1 |

Source counts obtained from complete fetched file content for **exactly these eleven paths**, not global `src` coverage. `<Button>` open/close equality is lexical evidence, not JSX compilation.

Reproduction commands, documented but **not run**:
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 'src/components/admin/tenant-domain-manager.tsx' \
 'src/components/admin/managed-college-subdomain.tsx' \
 'src/components/admin/college-edit-dialog.tsx' \
 'src/components/admin/college-setup-checklist.tsx' \
 'src/components/admin/college-dashboard-section-failure.tsx' \
 'src/components/admin/academic-setup-steps.tsx' \
 'src/components/admin/department-actions.tsx' \
 'src/components/admin/organization-actions.tsx' \
 'src/components/admin/person-membership-actions.tsx' \
 'src/components/admin/descendant-feature-rule-editor.tsx' \
 'src/components/admin/student-rule-editor.tsx'
```

**Responsive source proof:** 44px `min-h-11` is in force through 767px where set locally; `md:min-h-9` yields 36px from 768px. Flex-wrapping navigations and dialogs persist; screen-only actions use `print:hidden`. Full screen/device pixel match, state-specific hover/active/disabled visual comparison, print/PDF sample, and hosted email typography are **not verified**. Do not tick G4 or G5. No app, compile, tests, lint or CI run.

## Replacement chat-6 continued — report links, safe CSV, platform action and grouped tabs

- [x] **Source remediation only** — 14 full TSX files: `src/components/admin/admin-dashboard-actions.tsx`, `src/components/admin/tenant-settings-editor.tsx`, `src/components/admin/admin-scoped-live-search.tsx`, `src/components/admin/college-closing-quizzes-card.tsx`, `src/components/admin/super-admin-platform-block-action.tsx`, `src/components/admin/learner-module-access-drawer.tsx`, `src/components/admin/super-admin-legacy-group-tabs.tsx`, `src/components/admin/college-branding-preview.tsx`, `src/components/admin/super-admin-placement-oversight-nav.tsx`, `src/components/admin/super-admin-learning-filter-fields.tsx`, `src/components/admin/super-admin-today-board.tsx`, `src/components/admin/super-admin-people-csv-control.tsx`, `src/components/admin/tenant-directory-csv-control.tsx`, `src/components/admin/admin-scoped-read-page.tsx`.
  - `src/components/admin/admin-dashboard-actions.tsx`: Quick Actions cards preserve route and hover; keyboard focus now follows elevated 2px/2px old-LMS card treatment with supporting halo.
  - `src/components/admin/tenant-settings-editor.tsx`: Tenant configuration fields align 44px/36px; entire confidential override editor excluded from paper output, grouped key/status and high-impact confirmation preserved.
  - `src/components/admin/admin-scoped-live-search.tsx`: Debounced Super Admin directory search uses 44px phone/36px tablet input; search editor hidden in print.
  - `src/components/admin/college-closing-quizzes-card.tsx`: Quizzes closing list remains printable while navigation CTA uses 2px/3px teal keyboard outline and hides on paper.
  - `src/components/admin/super-admin-platform-block-action.tsx`: Native window.confirm replaced with shared ConfirmDialog for global account block/reactivate; same reason guard and request, 44px/36px Button, paper action hidden.
  - `src/components/admin/learner-module-access-drawer.tsx`: Student module access search input and recheck/close Buttons sized, trace link uses 2px/3px teal outline; original trace reader, drawer content and server permissions unchanged.
  - `src/components/admin/super-admin-legacy-group-tabs.tsx`: Grouped Super Admin account tabs excluded in paper view; Tabs component retained without custom element skin.
  - `src/components/admin/college-branding-preview.tsx`: Brand preview email, phone, terms and privacy links use 44px/36px targets and teal 2px/3px focus, remain legible in print.
  - `src/components/admin/super-admin-placement-oversight-nav.tsx`: Repaired previously undefined `active`/`items` helpers and unimported `Link` code in placement oversight nav; route-aware native Tabs, default-open for additional active reports, and print hide.
  - `src/components/admin/super-admin-learning-filter-fields.tsx`: Learning filter Course/Batch selects retain chosen value and 44px/36px responsive size.
  - `src/components/admin/super-admin-today-board.tsx`: Today metrics six-card links use elevated legacy keyboard focus (teal 2px/2px plus shared halo) while counts/empty evidence intact.
  - `src/components/admin/super-admin-people-csv-control.tsx`: Super Admin filtered people CSV uses 44px/36px shared Button, print-hidden wrapper, and try/finally Blob anchor removal with delayed revocation.
  - `src/components/admin/tenant-directory-csv-control.tsx`: Tenant directory CSV controls hidden on paper and anchor cleaned via try/finally with delayed revocation.
  - `src/components/admin/admin-scoped-read-page.tsx`: Shared read directory inputs/selects and Filter/Refresh are 44px phone/36px tablet; details links teal 2px/3px, read-only rows still print but per-row actions do not.
- [ ] **Next exact file:** `src/components/admin/college-branding-preview.tsx` is source-checked; continue with `src/components/admin/tenant-domain-manager.tsx` if concurrent revisions land, otherwise the next open administrative report `src/components/admin/super-admin-hr-accounts.tsx`. Remaining G4/G5 category-level tasks still blocked on complete historical PDFs/provider-hosted email HTML and global/responsive screenshots.

**Historical style reference values:** `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214`: ≥44px mobile targets to width 767px; `docs/design/ui-clone-checklist.md:46-47`: desktop button 36px, 9px radius, text 14px/650; `docs/design/legacy-styles/components___accessibility.scss:18-21`: generic 2px solid teal outline +3px offset; `components___accessibility.scss:25-35`: elevated card outline 2px/offset 2px with outer halo. No original authenticated print/PDF/email templates checked in. Shared `src/components/ui/*` remains unmodified.

### Per-source legacy property/value comparison tables

#### `src/components/admin/admin-dashboard-actions.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/admin-dashboard-actions.tsx:none` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/admin-dashboard-actions.tsx:none` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/admin-dashboard-actions.tsx:none` generic 3px links; `:36` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/admin-dashboard-actions.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/admin-dashboard-actions.tsx:none` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Quick Actions cards preserve route and hover; keyboard focus now follows elevated 2px/2px old-LMS card treatment with supporting halo | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/tenant-settings-editor.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/tenant-settings-editor.tsx:61, 67, 75` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/tenant-settings-editor.tsx:61, 67, 75` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/tenant-settings-editor.tsx:89, 97` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/tenant-settings-editor.tsx:none` error, `:95` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/tenant-settings-editor.tsx:48` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Tenant configuration fields align 44px/36px; entire confidential override editor excluded from paper output, grouped key/status and high-impact confirmation preserved | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/admin-scoped-live-search.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/admin-scoped-live-search.tsx:23` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/admin-scoped-live-search.tsx:23` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/admin-scoped-live-search.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/admin-scoped-live-search.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/admin-scoped-live-search.tsx:19` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Debounced Super Admin directory search uses 44px phone/36px tablet input; search editor hidden in print | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/college-closing-quizzes-card.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/college-closing-quizzes-card.tsx:11` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/college-closing-quizzes-card.tsx:11` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/college-closing-quizzes-card.tsx:11` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/college-closing-quizzes-card.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/college-closing-quizzes-card.tsx:11` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Quizzes closing list remains printable while navigation CTA uses 2px/3px teal keyboard outline and hides on paper | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/super-admin-platform-block-action.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/super-admin-platform-block-action.tsx:39, 42` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/super-admin-platform-block-action.tsx:39, 42` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/super-admin-platform-block-action.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/super-admin-platform-block-action.tsx:51` error, `:52` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/super-admin-platform-block-action.tsx:34` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Native window.confirm replaced with shared ConfirmDialog for global account block/reactivate; same reason guard and request, 44px/36px Button, paper action hidden | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/learner-module-access-drawer.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/learner-module-access-drawer.tsx:59, 67, 79, 100, 105` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/learner-module-access-drawer.tsx:59, 79, 100, 105` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/learner-module-access-drawer.tsx:105` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/learner-module-access-drawer.tsx:72` error, `:61` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/learner-module-access-drawer.tsx:55` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Student module access search input and recheck/close Buttons sized, trace link uses 2px/3px teal outline; original trace reader, drawer content and server permissions unchanged | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/super-admin-legacy-group-tabs.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/super-admin-legacy-group-tabs.tsx:none` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/super-admin-legacy-group-tabs.tsx:none` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/super-admin-legacy-group-tabs.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/super-admin-legacy-group-tabs.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/super-admin-legacy-group-tabs.tsx:14` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Grouped Super Admin account tabs excluded in paper view; Tabs component retained without custom element skin | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/college-branding-preview.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/college-branding-preview.tsx:199, 211, 223, 232` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/college-branding-preview.tsx:199, 211, 223, 232` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/college-branding-preview.tsx:199, 211, 223, 232` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/college-branding-preview.tsx:none` error, `:239` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/college-branding-preview.tsx:none` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Brand preview email, phone, terms and privacy links use 44px/36px targets and teal 2px/3px focus, remain legible in print | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/super-admin-placement-oversight-nav.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/super-admin-placement-oversight-nav.tsx:none` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/super-admin-placement-oversight-nav.tsx:none` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/super-admin-placement-oversight-nav.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/super-admin-placement-oversight-nav.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/super-admin-placement-oversight-nav.tsx:25` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Repaired previously undefined `active`/`items` helpers and unimported `Link` code in placement oversight nav; route-aware native Tabs, default-open for additional active reports, and print hide | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/super-admin-learning-filter-fields.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/super-admin-learning-filter-fields.tsx:7` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/super-admin-learning-filter-fields.tsx:7` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/super-admin-learning-filter-fields.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/super-admin-learning-filter-fields.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/super-admin-learning-filter-fields.tsx:none` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Learning filter Course/Batch selects retain chosen value and 44px/36px responsive size | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/super-admin-today-board.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/super-admin-today-board.tsx:none` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/super-admin-today-board.tsx:none` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/super-admin-today-board.tsx:none` generic 3px links; `:16` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/super-admin-today-board.tsx:none` error, `:10` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/super-admin-today-board.tsx:none` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Today metrics six-card links use elevated legacy keyboard focus (teal 2px/2px plus shared halo) while counts/empty evidence intact | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/super-admin-people-csv-control.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/super-admin-people-csv-control.tsx:25` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/super-admin-people-csv-control.tsx:25` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/super-admin-people-csv-control.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/super-admin-people-csv-control.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/super-admin-people-csv-control.tsx:24` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Super Admin filtered people CSV uses 44px/36px shared Button, print-hidden wrapper, and try/finally Blob anchor removal with delayed revocation | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/tenant-directory-csv-control.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/tenant-directory-csv-control.tsx:22` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/tenant-directory-csv-control.tsx:22` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/tenant-directory-csv-control.tsx:none` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/tenant-directory-csv-control.tsx:none` error, `:none` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/tenant-directory-csv-control.tsx:22` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Tenant directory CSV controls hidden on paper and anchor cleaned via try/finally with delayed revocation | File fetched and compared post-commit; **no application or TypeScript run** |


#### `src/components/admin/admin-scoped-read-page.tsx`

| Property/state | Old LMS file:line & value | vNext file:line & source property | Verification |
|---|---|---|---|
| Mobile action/field | `pages___admin-list-pages.scss:8,193-214`: 44px minimum until 767px | `src/components/admin/admin-scoped-read-page.tsx:94, 103, 109, 114, 119, 126, 132, 138, 147 (+8 more)` `min-h-11` if locally declared | Source min-height match; actual computed hit box not measured |
| Tablet/desktop | `ui-clone-checklist.md:46-47`: 36px height, 9px radius, font 14px/650 | `src/components/admin/admin-scoped-read-page.tsx:94, 103, 109, 114, 119, 126, 132, 138, 147 (+8 more)` `md:min-h-9` if locally declared | Source minimum match; inherited shared control may differ |
| Focus/hover | `components___accessibility.scss:18-21`: teal 2px/3px; `:25-35` elevated card teal 2px/2px+halo | `src/components/admin/admin-scoped-read-page.tsx:191, 192` generic 3px links; `:none` card 2px; shared Button defaults elsewhere | Source-focused props; active/disabled/computed hover and all permutations still OPEN |
| Error/loading/empty | `old-lms-pages.md:9`: hairline table, status and notices | `src/components/admin/admin-scoped-read-page.tsx:none` error, `:70, 84, 171, 181` status, `:none` DataTable if any | Existing per-screen states untouched or made semantic; pixel comparisons outstanding |
| Print/HTML emails | No checked-in old authenticated print/PDF and hosted-provider email HTML | `src/components/admin/admin-scoped-read-page.tsx:87, 159, 190, 197` print-hidden lines for interactive chrome and values where appropriate | Conservative PDF browser print separation only, not old template proof |
| Behavior/no regression | Historical trace/user sessions missing from SCSS | Shared read directory inputs/selects and Filter/Refresh are 44px phone/36px tablet; details links teal 2px/3px, read-only rows still print but per-row actions do not | File fetched and compared post-commit; **no application or TypeScript run** |

### Whole-source grep counts, JSX balance and responsive reproduction

| File | Native button/input/select/textarea/table | Hardcoded CSS hex | Shared Button open/close | Print-hidden source lines |
|---|---|---:|---:|---:|
| `src/components/admin/admin-dashboard-actions.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0 |
| `src/components/admin/tenant-settings-editor.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1 |
| `src/components/admin/admin-scoped-live-search.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/college-closing-quizzes-card.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/super-admin-platform-block-action.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1 |
| `src/components/admin/learner-module-access-drawer.tsx` | 0/0/0/0/0 | 0 | 3/3 | 1 |
| `src/components/admin/super-admin-legacy-group-tabs.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/college-branding-preview.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0 |
| `src/components/admin/super-admin-placement-oversight-nav.tsx` | 0/0/0/0/0 | 0 | 0/0 | 1 |
| `src/components/admin/super-admin-learning-filter-fields.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0 |
| `src/components/admin/super-admin-today-board.tsx` | 0/0/0/0/0 | 0 | 0/0 | 0 |
| `src/components/admin/super-admin-people-csv-control.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1 |
| `src/components/admin/tenant-directory-csv-control.tsx` | 0/0/0/0/0 | 0 | 1/1 | 1 |
| `src/components/admin/admin-scoped-read-page.tsx` | 0/0/0/0/0 | 0 | 2/2 | 4 |

The counts came from **complete GitHub file reads** for these 14 paths, not a checkout-global grep; opening/closing counts are lexical only. The `Tabs` components in the placement oversight navigation are the existing routed shared implementation, not newly handwritten raw buttons. Reproduction command (documented only, **not executed**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 'src/components/admin/admin-dashboard-actions.tsx' \
 'src/components/admin/tenant-settings-editor.tsx' \
 'src/components/admin/admin-scoped-live-search.tsx' \
 'src/components/admin/college-closing-quizzes-card.tsx' \
 'src/components/admin/super-admin-platform-block-action.tsx' \
 'src/components/admin/learner-module-access-drawer.tsx' \
 'src/components/admin/super-admin-legacy-group-tabs.tsx' \
 'src/components/admin/college-branding-preview.tsx' \
 'src/components/admin/super-admin-placement-oversight-nav.tsx' \
 'src/components/admin/super-admin-learning-filter-fields.tsx' \
 'src/components/admin/super-admin-today-board.tsx' \
 'src/components/admin/super-admin-people-csv-control.tsx' \
 'src/components/admin/tenant-directory-csv-control.tsx' \
 'src/components/admin/admin-scoped-read-page.tsx'
```

**Responsive source coverage:** CSS `min-h-11` = 44px for 0–767px and `md:min-h-9` = 36px at 768px+, per locally overridden controls. Wrapped link groups stay flex-wrapped; table/panel print exclusions do not change client behavior. The platform-wide account block now uses a shared ConfirmDialog instead of browser `window.confirm` (single confirmed mutation remains). The original code for `super-admin-placement-oversight-nav.tsx` contained undefined `active`/`items` and an unimported `Link`, corrected in the shared-Tabs consumer without changing shared UI. **No actual phone/tablet/print screenshot, browser tests, strict TypeScript, lint, CI, or native PDFs rendered. G4/G5 category items remain `[ ]`.**

## Replacement chat-6 continued — Recruiter accounts and company identity actions

- [x] **Source-complete** `src/components/admin/super-admin-hr-accounts.tsx`: Recruiter accounts: search/status/page-size filters 44px phone/36px desktop, action Buttons 44/36, CSV-style legacy pager links with teal 2px/3px focus; mobile cards avoid double print and DataTable is printable. Roles and account actions unchanged. Readback corrected one missing disabled JSX brace.
- [x] **Source-complete** `src/components/admin/super-admin-company-merge.tsx`: Company merge: native browser window.confirm replaced by shared ConfirmDialog with dangerous confirmation, server POST and eligibility checks untouched; selectors 44px/36px, mutating controls paper-hidden; success closes modal.
- [x] **Source-complete** `src/components/admin/super-admin-college-company-actions.tsx`: Scoped company create and relationship trust/archive action controls 44px/36px, create form inputs 44px/36px, mutation controls print-hidden; ConfirmDialog guards retained.
- [ ] **Next exact file:** `src/components/admin/super-admin-hr-account-dialog.tsx` — continue through its form/Select/Checkbox focus/disabled/loading states, then `src/components/admin/super-admin-hr-detail-drawer.tsx`.

Legacy references and measured values: `docs/design/legacy-styles/pages___admin-list-pages.scss:8,193-214` specifies mobile 44px minimum until 767px; `docs/design/ui-clone-checklist.md:46-47` documents desktop 36px/9px control and 14px/650 label; `docs/design/legacy-styles/components___accessibility.scss:18-21` generic keyboard focus is teal solid 2px, offset 3px. These **do not** include authenticated PDF, email or actual legacy recruiter account dialog screenshots.


#### `src/components/admin/super-admin-hr-accounts.tsx`
| State/property | Old LMS file:line exact value | vNext file:line source property | Evidence |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/super-admin-hr-accounts.tsx:614, 622, 629, 631, 657, 672, 690, 701, 714, 723 (+11 more)` `min-h-11` where locally sized | Source property only |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14px/650 | `src/components/admin/super-admin-hr-accounts.tsx:614, 622, 629, 631, 657, 672, 690, 701, 714, 723 (+11 more)` `md:min-h-9` where locally sized | Source property only |
| Keyboard focus | `components___accessibility.scss:18-21`: 2px teal, 3px offset | `src/components/admin/super-admin-hr-accounts.tsx:727, 772, 836, 852` explicit 3px focus anchor where present; inherited shared Button otherwise | Exact computed styles, all hover/disabled states OPEN |
| Loading/error/empty | `old-lms-pages.md:9`: compact hairline result/table state | `src/components/admin/super-admin-hr-accounts.tsx:813` DataTable if present, alerts `:974`, statuses `:663, 670` | Existing data/logic preserved; no runtime execution |
| Print separation | No checked-in historical email/PDF/offer print fixture | `src/components/admin/super-admin-hr-accounts.tsx:610, 657, 685, 777, 785, 799, 821` screen interaction chrome hidden, result data still available | G5 provider template and paper visual parity OPEN |
| Regression scope | No complete historical behavioral fixtures | Recruiter accounts: search/status/page-size filters 44px phone/36px desktop, action Buttons 44/36, CSV-style legacy pager links with teal 2px/3px focus; mobile cards avoid double print and DataTable is printable. Roles and account actions unchanged. Readback corrected one missing disabled JSX brace. | Static source diff/readback; no CI |


#### `src/components/admin/super-admin-company-merge.tsx`
| State/property | Old LMS file:line exact value | vNext file:line source property | Evidence |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/super-admin-company-merge.tsx:35, 41, 47` `min-h-11` where locally sized | Source property only |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14px/650 | `src/components/admin/super-admin-company-merge.tsx:35, 41, 47` `md:min-h-9` where locally sized | Source property only |
| Keyboard focus | `components___accessibility.scss:18-21`: 2px teal, 3px offset | `src/components/admin/super-admin-company-merge.tsx:none` explicit 3px focus anchor where present; inherited shared Button otherwise | Exact computed styles, all hover/disabled states OPEN |
| Loading/error/empty | `old-lms-pages.md:9`: compact hairline result/table state | `src/components/admin/super-admin-company-merge.tsx:none` DataTable if present, alerts `:55`, statuses `:56` | Existing data/logic preserved; no runtime execution |
| Print separation | No checked-in historical email/PDF/offer print fixture | `src/components/admin/super-admin-company-merge.tsx:33` screen interaction chrome hidden, result data still available | G5 provider template and paper visual parity OPEN |
| Regression scope | No complete historical behavioral fixtures | Company merge: native browser window.confirm replaced by shared ConfirmDialog with dangerous confirmation, server POST and eligibility checks untouched; selectors 44px/36px, mutating controls paper-hidden; success closes modal. | Static source diff/readback; no CI |


#### `src/components/admin/super-admin-college-company-actions.tsx`
| State/property | Old LMS file:line exact value | vNext file:line source property | Evidence |
|---|---|---|---|
| Phone hit-area | `pages___admin-list-pages.scss:8,193-214`: ≥44px at width ≤767px | `src/components/admin/super-admin-college-company-actions.tsx:31, 35, 37, 39, 42, 45, 78, 83` `min-h-11` where locally sized | Source property only |
| Tablet/desktop button | `ui-clone-checklist.md:46-47`: 36px, radius 9px, 14px/650 | `src/components/admin/super-admin-college-company-actions.tsx:31, 35, 37, 39, 42, 45, 78, 83` `md:min-h-9` where locally sized | Source property only |
| Keyboard focus | `components___accessibility.scss:18-21`: 2px teal, 3px offset | `src/components/admin/super-admin-college-company-actions.tsx:none` explicit 3px focus anchor where present; inherited shared Button otherwise | Exact computed styles, all hover/disabled states OPEN |
| Loading/error/empty | `old-lms-pages.md:9`: compact hairline result/table state | `src/components/admin/super-admin-college-company-actions.tsx:none` DataTable if present, alerts `:none`, statuses `:none` | Existing data/logic preserved; no runtime execution |
| Print separation | No checked-in historical email/PDF/offer print fixture | `src/components/admin/super-admin-college-company-actions.tsx:31, 33, 75` screen interaction chrome hidden, result data still available | G5 provider template and paper visual parity OPEN |
| Regression scope | No complete historical behavioral fixtures | Scoped company create and relationship trust/archive action controls 44px/36px, create form inputs 44px/36px, mutation controls print-hidden; ConfirmDialog guards retained. | Static source diff/readback; no CI |

### Source grep proof (complete three-file reads)

| File | Native button/input/select/textarea/table | Literal hex CSS | Shared Button open/close |
|---|---|---:|---:|
| `src/components/admin/super-admin-hr-accounts.tsx` | 0/0/0/0/0 | 0 | 13/13 |
| `src/components/admin/super-admin-company-merge.tsx` | 0/0/0/0/0 | 0 | 1/1 |
| `src/components/admin/super-admin-college-company-actions.tsx` | 0/0/0/0/0 | 0 | 5/5 |

Checkout reproduction (**not executed**):
```sh
grep -En '<(button|input|select|textarea|table)[ >]|#[[:xdigit:]]{3,8}' \
 'src/components/admin/super-admin-hr-accounts.tsx' \
 'src/components/admin/super-admin-company-merge.tsx' \
 'src/components/admin/super-admin-college-company-actions.tsx'
```

**Responsive proof:** vNext source classes use 44px `min-h-11` before 768px, `md:min-h-9` 36px at 768px and above. Recruiter list's phone cards are hidden from print while the canonical `DataTable` prints, but print cannot include filtered records not in the current page. Native company merge confirmation was deliberately converted to shared `ConfirmDialog` so it uses the old-style modal skin rather than browser chrome. Modal copy and server mutation endpoint preserved. Raw native tag, hardcoded hex, and Button pair counts cover exactly these sources only.

**Still open / no G4/G5 tick:** Complete old visual state tables, screenshot comparisons, global grep, provider-hosted HTML and actual PDF/email output. No application, TypeScript strict, lint, tests, CI or browser print executed.
