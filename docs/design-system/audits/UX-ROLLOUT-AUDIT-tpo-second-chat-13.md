# UX ROLLOUT CROSS-AUDIT — /tpo middle third (chat-13)

**Audit date:** 18 October 2026 (IST)  
**Reviewer:** chat-13, author under audit: chat-5  
**Exact scope:** routes 43–84 inclusive (42/126) from `docs/orchestrator/ui-ux/pages-tpo.md`.  
**Baseline:** `main` at `f342bee2862f7d539ff1da4bf8d70cbf46110c71`; remediation on `chatgpt/chat-13-b`.  
**Standards:** signed-off `docs/design-system/UX-PLAYBOOK.md`, 21 checks of `docs/design-system/UX-AUDIT-RUBRIC.md`, 10 UX excellence criteria, both `docs/audit/legacy-copy-*.md` catalogs, author page notes and `tests/unit/chat5-ux-tpo-middle-third.test.ts`.

## Scope and page-by-page source review

Every row was opened and inspected for service/role/college-scope guards, exact visible labels, phone/desktop table and form structure, link destinations, page states, and authored test evidence. The recorded findings include child components behind these pages, not merely their server wrappers. "Reviewed" does **not** mean the actual 320/360/390px browser screenshot or screen reader has passed.

| Route order | Page | Primary archetype | Findings / source disposition |
|---:|---|---|---|
| 43 | `/tpo/placements/jobs/[jobId]/applicants/[applicationId]` | Detail/directory | C13-026 |
| 44 | `/tpo/placements/jobs/[jobId]/applications-export` | Detail/directory | C13-008, C13-026 |
| 45 | `/tpo/placements/jobs/[jobId]/cancel-preview` | Form/wizard | C13-011, C13-026 |
| 46 | `/tpo/placements/jobs/[jobId]/candidate-schedule` | Detail/directory | C13-026 |
| 47 | `/tpo/placements/jobs/[jobId]/change-requests` | Detail/directory | Reviewed; no recorded source defect |
| 48 | `/tpo/placements/jobs/[jobId]/close-preview` | Form/wizard | C13-009, C13-026 |
| 49 | `/tpo/placements/jobs/[jobId]/closeout` | Form/wizard | C13-026 |
| 50 | `/tpo/placements/jobs/[jobId]/discussion` | Detail/directory | Reviewed; no recorded source defect |
| 51 | `/tpo/placements/jobs/[jobId]/drive-day` | Detail/directory | Reviewed; no recorded source defect |
| 52 | `/tpo/placements/jobs/[jobId]/edit` | Form/wizard | C13-026 |
| 53 | `/tpo/placements/jobs/[jobId]/extend-deadline` | Form/wizard | C13-026 |
| 54 | `/tpo/placements/jobs/[jobId]/interview-slots` | Detail/directory | Reviewed; no recorded source defect |
| 55 | `/tpo/placements/jobs/[jobId]/joining` | Decision/evidence | C13-021, C13-026 |
| 56 | `/tpo/placements/jobs/[jobId]/letters` | Decision/evidence | C13-001, C13-026 |
| 57 | `/tpo/placements/jobs/[jobId]/offers` | Decision/evidence | Reviewed; no recorded source defect |
| 58 | `/tpo/placements/jobs/[jobId]/offers/[offerId]` | Decision/evidence | Reviewed; no recorded source defect |
| 59 | `/tpo/placements/jobs/[jobId]/rounds` | Round/detail | C13-005 |
| 60 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results` | Round/detail | C13-010, C13-016, C13-017, C13-024, C13-026 |
| 61 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots` | Round/detail | C13-020 |
| 62 | `/tpo/placements/jobs/[jobId]/selections` | Decision/evidence | C13-019, C13-022 |
| 63 | `/tpo/placements/jobs/[jobId]/share-audit` | Company-share detail | C13-002 |
| 64 | `/tpo/placements/jobs/[jobId]/share-preview` | Company-share detail | C13-004, C13-018, C13-026 |
| 65 | `/tpo/placements/jobs/[jobId]/shortlist` | Decision/evidence | C13-003, C13-026 |
| 66 | `/tpo/placements/jobs/[jobId]/waitlist` | Decision/evidence | C13-015 |
| 67 | `/tpo/placements/lifecycle` | Operations | C13-023, C13-026 |
| 68 | `/tpo/placements/new` | Form/wizard | C13-026 |
| 69 | `/tpo/placements/new/draft` | Form/wizard | C13-026 |
| 70 | `/tpo/placements/overview` | Operations | C13-006 |
| 71 | `/tpo/placements/recorded-outside` | Operations | Reviewed; no recorded source defect |
| 72 | `/tpo/placements/schedule-conflicts` | Operations | C13-026 |
| 73 | `/tpo/profile` | Detail/directory | C13-026 |
| 74 | `/tpo/recruiters` | Recruiter CRM | C13-025, C13-027, C13-026 |
| 75 | `/tpo/recruiters/[leadId]` | Recruiter CRM | Reviewed; no recorded source defect |
| 76 | `/tpo/recruiters/campaigns` | Campaign directory | C13-007, C13-026 |
| 77 | `/tpo/recruiters/campaigns/[batchId]` | Campaign directory | Reviewed; no recorded source defect |
| 78 | `/tpo/recruiters/campaigns/drafts/[campaignId]` | Campaign form/detail | C13-013, C13-014 |
| 79 | `/tpo/recruiters/campaigns/new` | Campaign form/detail | Reviewed; no recorded source defect |
| 80 | `/tpo/recruiters/campaigns/preview` | Campaign form/detail | C13-026 |
| 81 | `/tpo/reports` | Report | C13-026 |
| 82 | `/tpo/reports/accreditation` | Report | C13-026 |
| 83 | `/tpo/reports/after-college` | Report | C13-012 |
| 84 | `/tpo/reports/branch-season` | Report | C13-026 |

## Findings, severity, exact source evidence, required fix and disposition

File:line anchors below refer to the **pre-fix baseline** at `f342bee`, because the remediation intentionally changes line numbers. A component shared by multiple audited pages is attached to the first relevant route.

| ID | Page | Severity | Evidence (pre-fix) | Failure and why it matters | Required remediation / status |
|---|---|---|---|---|---|
| C13-001 | `/tpo/placements/jobs/[jobId]/letters` | **MAJOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx:49` | 42rem offer-letter evidence grid only scrolled on phones. | Replaced with accessible DataTable, truthful Unavailable evidence, legacy empty copy. **FIXED on chat-13 branch.** |
| C13-002 | `/tpo/placements/jobs/[jobId]/share-audit` | **MAJOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx:50` | External-share history was desktop-only and hid audit evidence on phones. | Shared DataTable, all Link/Action/UTC timestamp columns and filter state. **FIXED on chat-13 branch.** |
| C13-003 | `/tpo/placements/jobs/[jobId]/shortlist` | **MAJOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx:79` | 38rem table forced horizontal mobile scrolling; timestamp and row evidence not reachable. | Shared phone cards via DataTable, IST decision time and explicit empty. **FIXED on chat-13 branch.** |
| C13-004 | `/tpo/placements/jobs/[jobId]/share-preview` | **MAJOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx:87` | Separate mobile and desktop candidate DOM trees duplicated sensitive recruiter-visible fields. | Single DataTable, explicit filtered empty and preserved share control. **FIXED on chat-13 branch.** |
| C13-005 | `/tpo/placements/jobs/[jobId]/rounds` | **MAJOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx:89` | External assessment links opened new tabs with no fallback and short targets. | Same-tab assessment and meeting links with 44px touch sizing. **FIXED on chat-13 branch.** |
| C13-006 | `/tpo/placements/overview` | **MAJOR** | `src/app/(authenticated)/tpo/placements/overview/page.tsx:26` | Primary navigation had 36px targets. | Raised targets to 44px, retained New opportunity workflow. **FIXED on chat-13 branch.** |
| C13-007 | `/tpo/recruiters/campaigns` | **MINOR** | `src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx:32` | Campaign text/link controls lacked consistent phone target and semantic typography. | Restyled links and primary fill foreground to token contract; no renamed copy. **FIXED on chat-13 branch.** |
| C13-008 | `/tpo/placements/jobs/[jobId]/applications-export` | **MINOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx:60` | Multiple pages mixed equivalent primary-foreground token spelling and small link styles. | Aligned primary token usage across 12 audited page files; --lms-on-primary already dark, so this is consistency, not a claimed contrast blocker. **FIXED on chat-13 branch.** |
| C13-009 | `/tpo/placements/jobs/[jobId]/close-preview` | **BLOCKER** | `src/components/placements/tpo-drive-close-preview-form.tsx:10` | Irreversible drive closure used window.confirm; backend codes could leak. | Focus-managed ConfirmDialog, preserved impact version guard and friendly failure. **FIXED on chat-13 branch.** |
| C13-010 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results` | **MAJOR** | `src/components/placements/tpo-round-result-entry-form.tsx:19` | Audited result stage used browser confirm; 40px inputs, no safe focus return. | ConfirmDialog, pending guard, readable errors and 44px targets. **FIXED on chat-13 branch.** |
| C13-011 | `/tpo/placements/jobs/[jobId]/cancel-preview` | **MAJOR** | `src/components/placements/tpo-drive-cancel-form.tsx:73` | Cancellation reason presets were under 44px and unreadable teal. | 44px preset buttons and readable neutral text; retained explicit reviewed checkbox. **FIXED on chat-13 branch.** |
| C13-012 | `/tpo/reports/after-college` | **MAJOR** | `src/app/(authenticated)/tpo/reports/after-college/page.tsx:60` | 300 student rows mounted at once without navigable pagination. | 25-row route pagination retaining batch/branch URL filters and whole CSV export. **FIXED on chat-13 branch.** |
| C13-013 | `/tpo/recruiters/campaigns/drafts/[campaignId]` | **MAJOR** | `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx:42` | Up to 500 recipient rows rendered in one long DOM. | 25-row Pagination with recipient count/cap preserved. **FIXED on chat-13 branch.** |
| C13-014 | `/tpo/recruiters/campaigns/drafts/[campaignId]` | **BLOCKER** | `src/components/tpo/tpo-campaign-send-control.tsx:26` | Mass irreversible recruiter email used browser confirm without safe keyboard focus. | Shared ConfirmDialog with irreversible consequence and busy guard. **FIXED on chat-13 branch.** |
| C13-015 | `/tpo/placements/jobs/[jobId]/waitlist` | **BLOCKER** | `src/components/placements/tpo-waitlist-promotion-control.tsx:12` | Real offer release used browser confirm; waitlist ranking desktop-only. | Shared focus-safe confirmation plus DataTable, preserve expectedPreviewToken/seat check. **FIXED on chat-13 branch.** |
| C13-016 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results` | **MAJOR** | `src/components/placements/tpo-round-results-import.tsx:99` | Result-file staging confirmation used window.confirm and short inputs. | ConfirmDialog with consequence and 44px controls, preserve reviewed skips. **FIXED on chat-13 branch.** |
| C13-017 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results` | **MAJOR** | `src/components/placements/tpo-bulk-round-result-recorder.tsx:94` | Partial-success bulk staging relied on native confirm, 40px controls. | Focus-managed two-step confirmation, 25-person cap and failure disclosure. **FIXED on chat-13 branch.** |
| C13-018 | `/tpo/placements/jobs/[jobId]/share-preview` | **BLOCKER** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx:87` | Revoking active external company share used browser confirm; small buttons. | Focus-managed revoke ConfirmDialog, guarded mutation and 44px controls. **FIXED on chat-13 branch.** |
| C13-019 | `/tpo/placements/jobs/[jobId]/selections` | **BLOCKER** | `src/components/placements/tpo-drive-selection-manager.tsx:31` | Official offer release used window.confirm; hand-built dialog lacked native trap and recovery; selection grid desktop-only. | Native shared Dialog, separate release ConfirmDialog, DataTable, keep CAS expectedRecordedAt. **FIXED on chat-13 branch.** |
| C13-020 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots` | **BLOCKER** | `src/components/placements/tpo-interview-slot-planner.tsx:62` | Destructive slot clearing, room reassignment and booked cancellation lacked accessible confirmation; raw response object leaked in success. | Three shared ConfirmDialog branches, scoped action snapshot, friendly status and 44px controls. **FIXED on chat-13 branch.** |
| C13-021 | `/tpo/placements/jobs/[jobId]/joining` | **MAJOR** | `src/components/placements/tpo-joining-update-form.tsx:36` | Audited joining and correction flow used window.confirm and undersized submit. | Two-step ConfirmDialog, guard, 44px form fields, preserve correction reason. **FIXED on chat-13 branch.** |
| C13-022 | `/tpo/placements/jobs/[jobId]/selections` | **MAJOR** | `src/components/placements/tpo-selection-import.tsx:24` | Staged 100-row selection import used browser confirmation and backend issue text. | ConfirmDialog, honest partial success and refresh instruction. **FIXED on chat-13 branch.** |
| C13-023 | `/tpo/placements/lifecycle` | **MAJOR** | `src/components/placements/tpo-drive-act-on-panel.tsx:62` | Bulk close/cancel could bypass focus-safe confirmation; retries were 40px. | ConfirmDialog covers normal and retry, preserves per-drive CAS impact preview. **FIXED on chat-13 branch.** |
| C13-024 | `/tpo/placements/jobs/[jobId]/rounds/[roundId]/results` | **MINOR** | `src/components/placements/tpo-round-apply-control.tsx:45` | Inline preview mislabelled aria-modal=false dialog and surfaced raw backend errors. | Changed to labelled region, friendly failure and usable export targets. **FIXED on chat-13 branch.** |
| C13-025 | `/tpo/recruiters` | **MAJOR** | `src/components/tpo/recruiter-leads-workspace.tsx:433` | Recruiter board/invite/draft used native confirms, custom form dialog and many 40px inputs. | Shared Dialog and ConfirmDialog with guarded mutation/draft loss, 44px controls. **FIXED on chat-13 branch.** |
| C13-026 | `/tpo/placements/jobs/[jobId]/applicants/[applicationId]` | **MAJOR** | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/loading.tsx:1` | 24 of 42 route loading boundaries were indefinite pulse/aria-busy without slow-load recovery. | All 24 changed to GracefulPageLoading retaining existing accessible labels, reduced motion and 12s retry; other 18 already bounded. **FIXED on chat-13 branch.** |
| C13-027 | `/tpo/recruiters` | **MAJOR** | `src/components/tpo/recruiter-leads-workspace.tsx:926` | Company matrix and 16-column recruiter roster only horizontal-scroll tables; actions and filters hard to operate on phone. | Both replaced with single responsive DataTable, accessible bulk selection and preserved selected columns/actions. **FIXED on chat-13 branch.** |

## 21-point rubric + 10-point excellence adjudication

| Rubric | Audit observation | Source outcome |
|---|---|---|
| A1–A4 Completeness and states | All 42 routes, author notes, route loading/error fallbacks and page models inspected; 24 indefinite loading states discovered. | Remediated C13-026. Original route-specific empty/stale/data boundaries retained. |
| B5 Palette/contrast | Checked canonical teal `#26bac7` and `--lms-on-primary: #1a1d21`. **`text-on-primary` was already a contrast-safe dark token**, not white. Some pages inconsistently spelled primary text. | Semantic alignment C13-008, not a fabricated contrast violation. |
| B6 Geometry | Confirmed 40px and 36px controls in account, interview, selection and legacy custom forms. | 44px controls repaired in the recorded components. |
| B7 Exact legacy wording/IA | Existing sidebars, page headers, form actions, notification semantics, status vocabulary, query parameters and route structure checked. | No intentional legacy label rename; newly introduced explanatory text confined to safeguards/empty/feedback. Full pixel-copy parity requires browser/legacy snapshot. |
| B8–B9 Shared API/compatibility | `DataTable` requires `empty`; `ConfirmDialog` uses native focus-trapped `Dialog`; `GracefulPageLoading` provides timeout. Call sites were reviewed before substitution. | Props use declared interfaces; strict TypeScript **not executed**. |
| B10 Browser APIs | Native `window.confirm` found in potentially irreversible placement / email / recruiter components; false modal ARIA found in inline preview. | Remediated C13-009/010/014–025; adjacent originally scoped components reviewed. |
| C11–C12 Phone tables and sheets | Wide-only letter/audit/shortlist/selection/CRM tables, duplicated sensitive card+table trees and 16-column recruiter grid. | Replaced with shared DataTable and explicit empty text. Complex trace matrices get sticky resolution heading; actual device check outstanding. |
| C13 WebView | `target="_blank"` for assessments lacked same-tab fallback; fake modal controls and file flows inspected. | Target removed C13-005; inherited shared native Dialog / link patterns. Actual WebView back/file availability pending. |
| C14 Network/load | 24 indefinite loading screens; client error strings could reveal server codes; long lists mount 300–500 items. | Bounded GracefulPageLoading, 25-row pages and friendly failure copy. Offline/speed throttling not run. |
| D15–D16 Accessibility | Native browser confirmations, wrong inline `role=dialog`, manual focus traps, 40px controls, missing field-level error associations. | High-severity dialog and target issues addressed. **Residual MINOR**: inherited forms still often use wrapper labels and form-level alerts rather than first-invalid-field focus/aria-describedby; requires orchestrator accessibility validation. |
| E17 Strict TS, regressions | Kept role-scoped server access, existing API CAS/preview tokens, mutation POST/PUT boundaries and conditional confirmation; added source assertions. | No TS, lint, unit or integration run in this lane. No test deletion or weakening. |
| E18–E19 Performance and refs | 300 rows in after-college, 500 campaign recipient rows, CRM duplicate DOMs. | Page windows to 25 and single responsive row DOM. Verify pagination/CSV semantics in integration. |
| F20–F21 Anti-drift | Chat-5’s original route tests mainly asserted source presence/non-presence and not actual keyboard, focus, race, tenant boundaries. | Added `tests/unit/chat13-ux-cross-audit-tpo.test.ts` and `...-loading.test.ts` covering high-risk contracts. Still source-level tests; recommend 320px keyboard/WebView integration cases. |

**Ten excellence dimensions:** hierarchy and legacy text preserved; responsive table compositing repaired; loading/empty/error feedback improved; form validation and destructive confirmation tightened; sorting/filter and pagination maintained or enhanced; focus-managed overlays reused; async success/partial-failure states preserved; semantic ARIA and 44px targets improved; styling continues LMS tokens and en-IN/IST; duplicate DOM/overlong lists eliminated. **All ten require device-level acceptance, none claimed empirically passed.**

## Completed code remediation and tests

- **Fix IDs C13-001 to C13-027** are referenced in `[chat-13]` commits on the chat-13 branch. Most serious examples: actual offer release, joining outcome correction, external-link revocation, 25-candidate bulk result staging and mass campaign send use focus-managed confirmation rather than `window.confirm`.
- **42/42 source routes reviewed; 42/42 author notes present;** the original 42 chat-5 `UX-tpo-<page>-01` source checks were preserved. Additional unique cross-audit assertions were written in `tests/unit/chat13-ux-cross-audit-tpo.test.ts` and `tests/unit/chat13-ux-cross-audit-tpo-loading.test.ts`.
- **24/24 found indefinite route loaders** changed to shared bounded graceful loader while **18/42** already had graceful recovery. Loading labels remained unchanged when present. The response adds no unauthorized test-data records.
- No DB migrations, auth/permission-policy changes, production operations or user-visible role/nav renames.

## Counts and verdict

| Result | Count |
|---|---:|
| Routes in this cross-audit | **42** |
| Findings | **27** |
| BLOCKER | **6** |
| MAJOR | **18** |
| MINOR | **3** |
| NIT | **0** |
| BLOCKER fixed in source | **6** |
| MAJOR fixed in source | **18** |
| Route loading boundaries upgraded | **24** |
| Author route tests retained | **42** |
| Browser / CI / screen reader runs | **0** |

**Source remediation verdict: PASS WITH FIXES — all 6 BLOCKER and 18 MAJOR source findings have authored fixes on `chatgpt/chat-13-b`.**  
**Deployment/acceptance verdict: FAIL (unverified)** until strict TypeScript, lint, unit, 320/360/390px device screenshots, keyboard/SR/WebView, network throttling and tenant-scope integration pass. Static source repair is not executable QA; maintain this distinction.

### Three most significant unverified risks
1. Nested destructive confirmation dialogs and the recruiter create form: test focus trapping, Escape, restoration and Android/iOS software-keyboard overlap on **320/360/390px**, especially when unsaved form data is present.
2. Concurrent state changes: simulate stalled POST/PUT, timeouts, stale preview versions, partial bulk success and already-sent campaigns; verify no duplicate offer/notification and no incorrect optimistic success across **different colleges**.
3. `DataTable` on mobile: check all hidden secondary fields and edit actions remain reachable and legible, no outer page horizontal scroll; verify screen-reader column/row names and the paginated CSV export against the original complete dataset.

_Hand off to orchestrator for actual test execution and accept/reject of source fixes. Cross-auditor did not run or invent browser, CI or accessibility results._
