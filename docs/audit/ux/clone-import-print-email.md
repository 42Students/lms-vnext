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

## Next file and unverified work
**Next:** `src/app/(authenticated)/layout.tsx` — G5 authenticated print integration and a source-backed print checklist; then continue the unsearched native-button work queue. Keep G4/G5 unticked until full value/state/responsive proof exists.
