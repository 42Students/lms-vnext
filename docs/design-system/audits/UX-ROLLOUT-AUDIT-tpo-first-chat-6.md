# Independent UX rollout cross-audit — /tpo first third (chat-6)

**Baseline:** `8b40a824d9b85284254f2cc7536146047e2bd251` (origin/main at start). **Audit scope:** first 42 of 126 routes in `docs/orchestrator/ui-ux/pages-tpo.md` (chat-12 authored). **Author:** independent lane chat-6. **Signed-off contracts:** `docs/design-system/UX-PLAYBOOK.md`, `UX-AUDIT-RUBRIC.md`, UX excellence brief, legacy-copy-B.

## Method, evidence and limits

Inspected all 42 route entry sources (in list order) and the actual delegated shared and feature components for the highest-risk grids, batch decisions/imports, composer dialogs, follow-up calendar, company memory and applicant review. Reviewed author handoff and per-route notes and inspected existing source-contract tests. Checked the 21 audit rubric items and ten excellence criteria as source contracts: tokens/contrast, hierarchy, route/legacy copy, responsive reachability, interactive mobile targets, empty/loading/errors, forms, confirmation/drafts/duplicate writes, dialog keyboard/Back, URL state, auth/tenancy, performance and WebView. The current tool does not execute browser widths, WebView or Vitest; these remain unverified, and source inspection is not a claim of visual proof. Checked new repairs via source inspection only.

## First-third route coverage (all 42)

| # | Route | Archetype | Source evidence | Finding IDs |
|---:|---|---|---|---|
| 1 | `/tpo` | Redirect | `src/app/(authenticated)/tpo/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 2 | `/tpo/announcements` | Dashboard / navigation | `src/app/(authenticated)/tpo/announcements/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 3 | `/tpo/audit` | Audit / directory | `src/app/(authenticated)/tpo/audit/page.tsx:1` | `M01`, `M22` |
| 4 | `/tpo/audit/actors` | Audit / directory | `src/app/(authenticated)/tpo/audit/actors/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 5 | `/tpo/batches` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 6 | `/tpo/batches/[batchId]` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx:1` | `M13`, `M15` |
| 7 | `/tpo/batches/[batchId]/classes` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx:1` | `B02`, `B07` |
| 8 | `/tpo/batches/[batchId]/history` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 9 | `/tpo/batches/[batchId]/invitation-prep` | Redirect | `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 10 | `/tpo/batches/[batchId]/nudge-prep` | Redirect | `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 11 | `/tpo/batches/[batchId]/registrations` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 12 | `/tpo/batches/[batchId]/registrations/[membershipId]/history` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 13 | `/tpo/batches/[batchId]/reminder-prep` | Redirect | `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 14 | `/tpo/batches/[batchId]/rules` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx:1` | `M03` |
| 15 | `/tpo/batches/[batchId]/students` | Directory / detail / form | `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx:1` | `B10`, `B11`, `B12`, `M02`, `M05`, `M06`, `M07`, `M08` |
| 16 | `/tpo/calendar` | Calendar / schedule | `src/app/(authenticated)/tpo/calendar/page.tsx:1` | `B01`, `M10`, `M19` |
| 17 | `/tpo/calendar/export` | Calendar / schedule | `src/app/(authenticated)/tpo/calendar/export/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 18 | `/tpo/calendar/interviews` | Calendar / schedule | `src/app/(authenticated)/tpo/calendar/interviews/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 19 | `/tpo/calendar/rounds` | Calendar / schedule | `src/app/(authenticated)/tpo/calendar/rounds/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 20 | `/tpo/companies` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/page.tsx:1` | `M11` |
| 21 | `/tpo/companies/[companyId]` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 22 | `/tpo/companies/[companyId]/contact-log` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 23 | `/tpo/companies/[companyId]/feedback` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx:1` | `M16` |
| 24 | `/tpo/companies/[companyId]/manage` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 25 | `/tpo/companies/[companyId]/people` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 26 | `/tpo/companies/archived` | Directory / detail / form | `src/app/(authenticated)/tpo/companies/archived/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 27 | `/tpo/drive-day` | Calendar / schedule | `src/app/(authenticated)/tpo/drive-day/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 28 | `/tpo/drive-day/[roundId]` | Calendar / schedule | `src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 29 | `/tpo/drive-day/[roundId]/no-shows` | Calendar / schedule | `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 30 | `/tpo/find` | Dashboard / navigation | `src/app/(authenticated)/tpo/find/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 31 | `/tpo/follow-ups` | Calendar / schedule | `src/app/(authenticated)/tpo/follow-ups/page.tsx:1` | `B03`, `B08`, `M20` |
| 32 | `/tpo/home` | Dashboard / navigation | `src/app/(authenticated)/tpo/home/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 33 | `/tpo/messages` | Inbox / thread | `src/app/(authenticated)/tpo/messages/page.tsx:1` | `B05`, `B09`, `M23` |
| 34 | `/tpo/messages/[threadId]` | Inbox / thread | `src/app/(authenticated)/tpo/messages/[threadId]/page.tsx:1` | `M09` |
| 35 | `/tpo/messages/notifications` | Redirect | `src/app/(authenticated)/tpo/messages/notifications/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 36 | `/tpo/more` | Dashboard / navigation | `src/app/(authenticated)/tpo/more/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 37 | `/tpo/notifications` | Dashboard / navigation | `src/app/(authenticated)/tpo/notifications/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 38 | `/tpo/placements` | Redirect | `src/app/(authenticated)/tpo/placements/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 39 | `/tpo/placements/jobs/[jobId]` | Dashboard / navigation | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 40 | `/tpo/placements/jobs/[jobId]/about` | Dashboard / navigation | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 41 | `/tpo/placements/jobs/[jobId]/applicants` | Directory / detail / form | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx:1` | No discrete source defect at route entry; inherited shared checks |
| 42 | `/tpo/placements/jobs/[jobId]/applicants-pipeline` | Directory / detail / form | `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx:1` | `B04`, `B06`, `M04`, `M12`, `M14`, `M17`, `M21` |

## Actionable findings (all source-level BLOCKER/MAJOR fixes committed)

| Page | Finding ID | Severity | Evidence `file:line` | Required fix and disposition |
|---|---|---|---|---|
| `/tpo/calendar` | **B01** | **BLOCKER** | `src/components/tpo/tpo-new-followup-modal.tsx:90` | Hand-built follow-up overlay lacked reliable focus trap, Back/Escape and draft-safe navigation. **FIXED:** Replace with shared Dialog + confirmation preserving legacy text. |
| `/tpo/batches/[batchId]/classes` | **B02** | **BLOCKER** | `src/components/tpo/tpo-batch-class-decision.tsx:55` | Class decision used browser-native confirmation and exposed direct backend error body. **FIXED:** Use shared ConfirmDialog; keep confirmation consequence and friendly errors. |
| `/tpo/follow-ups` | **B03** | **BLOCKER** | `src/components/tpo/tpo-due-followup-workspace.tsx:242` | Terminal follow-up actions used browser confirms, and local datetime parsed in viewer timezone. **FIXED:** Use native-safe confirmation and explicit IST parsing. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **B04** | **BLOCKER** | `src/components/tpo/tpo-grid-filter-panel.tsx:49` | Fixed-position details masqueraded as a filter sheet without modal focus/inertness/Back. **FIXED:** Use shared BottomSheet with mobile trigger and URL-persisted filters. |
| `/tpo/messages` | **B05** | **BLOCKER** | `src/components/tpo/tpo-new-recruiter-conversation.tsx:75` | Custom role=dialog trap failed to guarantee modal focus isolation/native-app Back. **FIXED:** Use shared Dialog; retain draft storage, quick replies and errors. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **B06** | **BLOCKER** | `src/components/placements/tpo-applicant-review-drawer.tsx:25` | Hand-built applicant dialog omitted shared native WebView Back/focus-return guarantees. **FIXED:** Use shared Drawer while retaining neighbour links and review form. |
| `/tpo/batches/[batchId]/classes` | **B07** | **BLOCKER** | `src/components/tpo/tpo-batch-class-decision.tsx:21` | Class decision relied only on delayed React busy render; double-click could overlap writes. **FIXED:** Add synchronous in-flight lock released on all outcomes. |
| `/tpo/follow-ups` | **B08** | **BLOCKER** | `src/components/tpo/tpo-due-followup-workspace.tsx:75` | Audited follow-up completion/scheduling had no synchronous duplicate-write lock. **FIXED:** Guard both POST paths with one in-flight ref. |
| `/tpo/messages` | **B09** | **BLOCKER** | `src/components/tpo/tpo-new-recruiter-conversation.tsx:45` | Consecutive New message submissions could create duplicates before busy state rendered. **FIXED:** Use synchronous in-flight lock alongside existing pending UI. |
| `/tpo/batches/[batchId]/students` | **B10** | **BLOCKER** | `src/components/tpo/tpo-batch-student-saved-views.tsx:35` | Saved-view POSTs could overlap through separate controls. **FIXED:** Apply synchronous lock without dropping saved-view functionality. |
| `/tpo/batches/[batchId]/students` | **B11** | **BLOCKER** | `src/components/tpo/tpo-batch-inline-decision.tsx:54` | Reason-selection dialog was imperative HTML dialog without the shared host-Back contract. **FIXED:** Use shared Dialog preserving every legacy reason. |
| `/tpo/batches/[batchId]/students` | **B12** | **BLOCKER** | `src/components/tpo/tpo-batch-eligibility-import.tsx:90` | Import preview used an imperative 90dvh modal missing unified native-app Back and safe-area behavior. **FIXED:** Use shared Drawer, retain CSV preview/skip/acknowledge/undo. |
| `/tpo/audit` | **M01** | **MAJOR** | `src/components/tpo/tpo-audit-grid.tsx:95` | 42rem desktop audit table had no complete phone card alternative. **FIXED:** Use shared DataTable with selectable rows, conditional fields and explicit empty copy. |
| `/tpo/batches/[batchId]/students` | **M02** | **MAJOR** | `src/components/tpo/tpo-batch-student-saved-views.tsx:100` | Destructive delete action relied on window.confirm. **FIXED:** Use shared ConfirmDialog preserving the exact question and pending lock. |
| `/tpo/batches/[batchId]/rules` | **M03** | **MAJOR** | `src/components/tpo/tpo-batch-rule-editor.tsx:130` | Unsaved-changes guard relied on window.confirm and inconsistent browser Back. **FIXED:** Use native-safe ConfirmDialog and route-target capture. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **M04** | **MAJOR** | `src/components/tpo/tpo-applications-spreadsheet.tsx:58` | Deep applicant link was 40px and non-contrast-safe teal. **FIXED:** Raise to 44px and use deep-teal link token. |
| `/tpo/batches/[batchId]/students` | **M05** | **MAJOR** | `src/components/tpo/tpo-batch-inline-decision.tsx:50` | Inline decision buttons and preset options had 40px targets/low contrast. **FIXED:** 44px minimum and WCAG-safe text. |
| `/tpo/batches/[batchId]/students` | **M06** | **MAJOR** | `src/components/tpo/tpo-bulk-action-panel.tsx:183` | Bulk action controls had 40px controls and white brand text. **FIXED:** Use 44px actions and dark text on primary. |
| `/tpo/batches/[batchId]/students` | **M07** | **MAJOR** | `src/components/tpo/tpo-student-nudge-panel.tsx:56` | Student nudge choices included 36px targets. **FIXED:** Upgrade choices and form controls to 44px targets. |
| `/tpo/batches/[batchId]/students` | **M08** | **MAJOR** | `src/components/tpo/tpo-batch-eligibility-import.tsx:92` | Import preview controls and CSV links had undersized touch targets. **FIXED:** Use 44px controls while preserving CSV workflow. |
| `/tpo/messages/[threadId]` | **M09** | **MAJOR** | `src/components/tpo/tpo-recruiter-message-reply.tsx:69` | Quick-reply action had undersized target and unsafe contrast. **FIXED:** Raise target and use accessible text token. |
| `/tpo/calendar` | **M10** | **MAJOR** | `src/components/placements/placement-calendar-workspace.tsx:865` | Primary calendar actions used white text over #26bac7 and some short hit targets. **FIXED:** Use dark primary foreground and 44px targets. |
| `/tpo/companies` | **M11** | **MAJOR** | `src/components/tpo/tpo-company-memory-workspace.tsx:61` | Company memory actions/links inherited undersized targets and low-contrast teal. **FIXED:** Use deep-teal links and 44px targets. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **M12** | **MAJOR** | `src/components/placements/tpo-applicant-review-drawer.tsx:43` | Drawer's previous/next and full-detail links used non-contrast-safe primary text. **FIXED:** Use deep-teal underlined links with 44px hit areas. |
| `/tpo/batches/[batchId]` | **M13** | **MAJOR** | `src/components/tpo/tpo-batch-invitation-control.tsx:151` | Removing the registration deadline used native confirm and previously dismissed on failed save. **FIXED:** Confirm with shared dialog and keep dialog open when save fails. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **M14** | **MAJOR** | `src/components/tpo/tpo-grid-column-chooser.tsx:49` | Visible-column controls for phone spreadsheet were 40px and low contrast. **FIXED:** Raise controls to 44px with accessible brand text. |
| `/tpo/batches/[batchId]` | **M15** | **MAJOR** | `src/components/tpo/tpo-batch-workspace-tabs.tsx:17` | Shared batch tab links were 40px and used decorative teal for actionable text. **FIXED:** 44px focusable tab links and accessible deep-teal text. |
| `/tpo/companies/[companyId]/feedback` | **M16** | **MAJOR** | `src/components/placements/tpo-company-feedback-form.tsx:80` | Feedback confirmation controls had 40px hit areas and insufficient primary contrast. **FIXED:** Use 44px controls and dark primary foreground. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **M17** | **MAJOR** | `src/components/tpo/tpo-grid-filter-panel.tsx:24` | Filter chips and Clear all actions fell below 44px with unsafe link contrast. **FIXED:** Raise targets and apply deep-teal token. |
| `/tpo/calendar` | **M19** | **MAJOR** | `src/components/tpo/tpo-new-followup-modal.tsx:10` | Follow-up date/select/textarea styles rendered 14px on iOS, risking focus zoom. **FIXED:** Mobile 16px controls, desktop 14px only above sm. |
| `/tpo/follow-ups` | **M20** | **MAJOR** | `src/components/tpo/tpo-due-followup-workspace.tsx:33` | Due-followup form uses 14px input font on phones. **FIXED:** Mobile 16px inputs. |
| `/tpo/placements/jobs/[jobId]/applicants-pipeline` | **M21** | **MAJOR** | `src/components/tpo/tpo-grid-filter-panel.tsx:30` | Applicant mobile filter native selects inherited 14px font. **FIXED:** Mobile 16px selects. |
| `/tpo/audit` | **M22** | **MAJOR** | `src/components/tpo/tpo-audit-grid.tsx:65` | Audit search/filter inputs inherited small phone text and risk iOS zoom. **FIXED:** Mobile 16px inputs and full-width min-w-0. |
| `/tpo/messages` | **M23** | **MAJOR** | `src/components/tpo/tpo-new-recruiter-conversation.tsx:93` | New recruiter composer inherited 14px textarea font on phones. **FIXED:** Mobile 16px textarea. |

## Tested invariants and regression plan

- New suite: `tests/unit/UX-tpo-first-cross-audit-chat6.test.ts`, 16 checks across all 42 routes and targeted behavior. Unlike page-only substring smoke tests, it asserts specific native dialogs, synchronous mutation guards, phone row actions, preservation of original copy, and absence of retired anti-patterns.
- Preserve chat-12's existing per-route tests and notes; no existing test was deleted or weakened.
- Shared DataTable has explicit legacy-scoped empty copy; URL filter/save behavior remains in the pre-existing models. Audit-grid still preserves row selection, copy, conditional About/Detail columns and legal detail links.
- Permission gates and data-access services on these pages were left unchanged. Backend mutation authorization and same-origin guards were not broadened.

## Verdict and remaining evidence

**Source-level verdict: PASS WITH FIXES (pending independent CI/browser verification).** Findings identified: **12 BLOCKER, 22 MAJOR, 0 MINOR, 0 NIT**; code fixes authored for **12/12 BLOCKER and 22/22 MAJOR**. No known finding from the above actionable table intentionally left unresolved. These are grouped source issues, not 34 distinct routes. Scope: 42 route entries reviewed, targeted nested components inspected and fixed; this is not proof that every nested component path, tenant fixture or browser state was exhaustively executed.

**Three riskiest unverified areas:** (1) native Back/keyboard focus restoration and safe-area layouts at 320/360/390px on Android/iOS WebViews; (2) strict TypeScript/lint/unit and legacy rendering snapshots after component swaps; (3) partial/offline state, long 5,000-row import, permission-negative and same-origin integration paths in real sessions. Orchestrator must run these and retain checklist pages unchecked until passing.

**No production mutation.** Only dev lane branch, source and tests.
