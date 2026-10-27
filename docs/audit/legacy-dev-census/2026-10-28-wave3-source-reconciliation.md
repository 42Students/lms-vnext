# Legacy frontend source discovery — wave 3 (2026-10-28)

**Evidence, not a second tracker or page-closure decision.** The official task tracker remains `docs/tracker.json`; account/page acceptance remains `docs/parity/`. This increment does **not** assert runtime behavior, feature completeness, unique surface totals, test passes, or an Implementation Green page.

## Pinned references and reproducible method

- Legacy FE `42Students/lms2-fe@lms-dev-2026`: `9d56bb7a347b06f242ef615c19fdc298f83329e0`
- Legacy BE `42Students/lms@lms-dev-2026`: `ecb09416b107e82e5ac7d22f3bc94a85258754b3`
- Initial vNext comparisons: `42Students/lms-vnext@7974c721b163f98ced26ada834f564922d28aba5`
- Reuse: wave 1 (64 sources), wave 2 (72 sources) and the post-wave-2 284-candidate frontier. Wave 3 reads **112 additional distinct** files; no overlap with those 136, zero read failures, zero source-SHA mismatches.
- Eight JSON batches `2026-10-28-import-reachability-wave3-{a..h}.json` record pinned file SHA, per-line candidate JSX/interaction/overlay signals, import specifiers and tree-backed destinations. The parser is a *line-oriented static signal collector*, not an AST, so multiline imports, portals and computed runtime branches still need separate verification.
- Derived file `2026-10-28-derived-import-frontier-post-wave3.json` is a source-worklist calculation, not a product denominator.

## Reconciliation of import-source candidates

| Measure | Verified static discovery count |
|---|---:|
| Previous inspected descendants | 136 |
| Newly inspected wave-3 files | 112 |
| Distinct inspected descendants represented | 248 |
| Wave-3 candidate sources that contain UI JSX (after manual correction) | 100 |
| Nonvisual interaction hooks / other helpers | 1 / 11 |
| Tree-resolved local imports extracted from wave 3 | 292 |
| Old wave-2 candidates still pending | 172 |
| Newly discovered UI-folder JS/TS imports | 18 |
| **Current unexplored UI-folder import candidates** | **190** |

Of 112 wave-3 file reads, all matched the historical frontier SHA. Static signals and candidate classifications are neither verified unique surfaces nor exhaustive discovery. The 18 added targets include `TemplateLibrary.jsx`, `EmailDetail.jsx`, `CourseTeachersPanel.jsx`, `HomeEditDrawer.js`, `JobDetailContent.jsx`, `leftpanel.js`, `MarketingHeader.jsx`, `MarketingFooter.jsx`, `preview.js` and a sidebar index. The derived JSON preserves all 18 exact paths and source SHAs. An additional 136 imported code/asset edges were excluded from the **UI-folder candidate denominator**, not declared unimportant for action/service parity.

## Concrete interaction contracts requiring reconciliation

These are *source-evidenced checks* against corresponding page families, **not alleged missing features**.

| Owning family | Source evidence | vNext evidence known at this checkpoint | Required next test |
|---|---|---|---|
| TPO / student requests | Legacy `src/components/tpo/RequestsPanel.js:L24-L30` names seven request kinds and preset rejection reasons; `L62-L70` describes effects; `L195-L270` handles pending, error, confirmation and proof-sensitive bulk skipping; `L330-L390` includes decided-by/date/reason columns. | `src/app/(authenticated)/tpo/students/requests/page.tsx` has queue/filter/mobile states and `TpoRequestDecisionControl` (read at `7974c721`). The latter has guarded POST, confirmation, rejection reasons, optimistic revision and error handling. | Verify type-name semantic mapping (`WITHDRAWAL` vs `APPLICATION_WITHDRAWAL` etc.), request payload disclosure, per-type side effects, student notification, proof-sensitive bulk policy and historical decision fields with real scoped fixtures; do not infer absent or complete from different names. |
| TPO / data grid and selected rows | Legacy `src/components/tpo/grid/TpoGrid.jsx:L32-L51` describes filter/search context and `L89-L107` clearing hidden selections; `L232-L274` AG Grid keyboard/selection operations. | Consolidated vNext account pages have alternative table/list layouts, e.g. the TPO requests route includes a mobile list and desktop table. | Reconcile each family using grid: selection after filters, shift selection, export, sorting, page transitions, accessibility and destructive bulk action confirmation. A different table library is not itself a regression. |
| TPO / batch decisions and rules | Legacy `src/components/tpo/batches/BatchRulesTab.jsx`, `DecidePanel.jsx`, `EligibilityGrid.jsx` are separate nested UI modules; `src/components/tpo/students/StudentSidePanel.jsx` adds contextual actions. | vNext `src/app/(authenticated)/tpo/batches/page.tsx` imports cohort eligibility, journey, recent actions and undo services. | Run role/college-scoped cohort fixtures through reset/inherit, mass decisions, invalid inputs, stale outcomes, undo and side-panel links; map any missing child contract into existing TPO family. |
| Super Admin / module hierarchy | Legacy `src/pages/superadmin/sections/ModuleAccess.js:L92-L131` distinguishes college module state and placement-cell eligibility, while `L165-L184` guards asynchronous history against college switching. | vNext `src/app/(authenticated)/admin/features/[collegeId]/page.tsx` and `src/components/admin/descendant-feature-rule-editor.tsx` exist; the latter explains inherit/on/off/lock and sends scoped writes. | Verify parent lock precedence, nested role/tenant scope, stale history on college switch, disabled module behavior, audit trail and exact negative permissions. |
| Super Admin / people and tenant administration | Legacy `src/pages/superadmin/sections/CollegeBranding.js`, `CollegeSignIn.js`, `CollegeSubdomain.js`, `ManageCollegeDrawer.js`, `RecruiterAccounts.js`, `InterviewForm.js`, `InterviewEditForm.js` and `InterviewFeedbackForm.js` contain JSX controls and conditional editing. | Corresponding vNext administration should be mapped from actual authorized routes; names alone are insufficient. | Trace opening triggers, guard differences, save/discard/error paths, and provider/college scoping for these nested interfaces. |
| Faculty / coursework review | Legacy `src/pages/Dashboard/course/syllabus/viewSubmissionsModal.jsx`, `src/components/Quiz/quizpanel.js`, `src/components/Global/Offcanvas/Syallabus/videoform.js` and `src/components/Global/RichTextEditor/RichTextEditor.jsx` contain independent UI descendants. | Existing Faculty specs describe vNext grading/attachment and video flows as partial; no new acceptance proof was run. | Reconcile assignment submission review, quiz modes, lesson video upload/preview, validation/error/keyboard states and delegated service contracts. |
| Shared UI / global state | Legacy `src/components/Common/NetworkStatusBanner.jsx:L38-L68` renders offline/reconnected alerts, and `src/components/Dropdowns/Notification/NotifivationDropdown.js`, `src/components/Global/MobileMenuDrawer/MobileMenuDrawer.js` and `SuperAdminMobileMenuDrawer.js` contain role-responsive controls. | No equivalent vNext global network-state runtime path was certified in this pass. | Follow `_app` providers and vNext root shells for offline/reconnected, mobile nav focus/escape, notifications and permission-aware deep links. |

### Important classifier correction

`NetworkStatusBanner.jsx` was initially classified as a non-UI helper because its JSX tag is split over lines (`<div` alone at L42). Direct reading found `role={offline ? "alert" : "status"}` at L44 and `<Alert` at L56; wave-3-f records the correction. A one-line regex match must not become a silent UI-coverage exclusion.

### Evidence boundaries and exact next starting point

- All 112 fetches are source reads only. No app, backend, PostgreSQL, Jest/Vitest or Playwright test was executed here; no CI success is asserted.
- No tracker phase/task Boolean and no Implementation/Design/Release Green were changed.
- Import graph growth remains finite: next inspect the **18 newly discovered child modules**, then rank the remaining **172 prior candidates** by interactive risk. High-risk preexisting candidates still include `TenantsHub.js`, `VerifyQueue.jsx`, `AdminUsers.js`-related descendants, TPO outreach/team editors and operational tracker drawers.
- Once imports are classified, the next gate is *end-to-end* source handler → FE service → BE controller/auth/service → tenant-aware state/effect → real vNext handler/storage/test, with all seven accounts and global/provider interactions represented. Disposition must be recorded in the owning existing parity family; an old route count or source-file count is not acceptable closure evidence.
