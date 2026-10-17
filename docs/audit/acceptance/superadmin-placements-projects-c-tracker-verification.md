# Super Admin tracker — chat-6 verification

| ID | Status | Evidence |
|---|---|---|

| SA-placements-projects-108 | DONE (source authored; runtime pending) | `src/components/tracker/tracker-issue-copy-actions.tsx`, `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`; `tests/unit/chat6-tracker-round3.test.ts` → `SA-placements-projects-108 issue details link safe evidence and can copy link and markdown` |
| SA-placements-projects-110 | DONE (source authored; runtime pending) | `src/components/tracker/tracker-workflow-panel.tsx`; `tests/unit/chat6-tracker-round3.test.ts` → `SA-placements-projects-110 uses legacy retest wording and persisted outcome messages` |
| SA-placements-projects-111 | DONE (source authored; runtime pending) | `src/components/tracker/tracker-workflow-panel.tsx`; `tests/unit/chat6-tracker-round3.test.ts` → `SA-placements-projects-111 commit hashes open correct GitHub repositories only when valid` |

| SA-placements-projects-105 | DONE (source authored; integration pending) | `src/modules/bug-tracker/admin-validation.ts`, `issues-query-model.ts`, `admin-service.ts`, `src/app/(authenticated)/tracker/issues/page.tsx`; `tests/unit/chat6-tracker-list-round3.test.ts` → `SA-placements-projects-105 filters reporter by literal substring with pagination and legacy labels` |

| SA-placements-projects-123 | DONE (source authored; browser document.title pending) | `src/app/(authenticated)/tracker/{page,issues/page,issues/[publicId]/page,audit-findings/page,audit-findings/[publicId]/page}.tsx`; `tests/unit/chat6-tracker-titles-round3.test.ts` → `SA-placements-projects-123 restores audit findings heading and all legacy tracker document titles`. Intentional deviation: vNext records persisted findings, not legacy GitHub sync runs, so no invented "last synced" time. |

## Round 4 — test contracts authored, not executed

| SA-placements-projects-104 | DONE (source authored; real-browser/database pending) | `src/components/tracker/tracker-report-form.tsx`, `src/hooks/use-form-draft.ts`, `src/app/api/tracker/issues/route.ts`; `tests/unit/chat6-tracker-parity-round4.test.ts` → `SA-placements-projects-104 restores saved report context and remembers selected reporter and environment`, `SA-placements-projects-104 supports shortcut submit, source-linked success and permission-scoped similar reports`. Similar matches are explicit keyword searches, not inferred fuzzy matches. |
| SA-placements-projects-112 | OPEN (partial navigation and accessibility, dark-mode switch not yet supported) | `src/components/tracker/tracker-admin-nav.tsx`; `tests/unit/chat6-tracker-parity-round4.test.ts` → `SA-placements-projects-112 exposes the legacy manager nav destinations with an accessible skip target`. Distinct Audit findings route present; Logs route still describes persistent Known Errors, not live Cloud Logging. |

## Chat-6 saved issue-list controls (named tests authored; not run)

| SA-placements-projects-106 | DONE (source verified; workflow/database pending) | `src/components/tracker/tracker-issue-bulk-actions.tsx`, `src/app/(authenticated)/tracker/issues/page.tsx`; `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts` → `SA-placements-projects-106 bulk status changes preserve per-issue version guards and partial failure reporting`. Each selected issue uses the authorized version-checked PATCH; failed IDs remain visible for retry. |
| SA-placements-projects-107 | DONE (browser-local; multi-device sync not offered) | `src/components/tracker/tracker-issue-saved-views.tsx`, `src/app/(authenticated)/tracker/issues/page.tsx`; `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts` → `SA-placements-projects-107 safely saves, applies and removes bounded browser-only filter presets`. Only filter parameters persist; no report data or credentials stored. |
