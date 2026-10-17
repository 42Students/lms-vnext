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

## Chat-16 tracker reassignment verification (source-authored; tests NOT executed)

| ID | Status | Evidence |
| --- | --- | --- |
| SA-placements-projects-104 | DONE (authored; unrun) | `src/components/tracker/tracker-report-form.tsx` + `src/hooks/use-form-draft.ts`; `tests/unit/chat16-reassigned-tracker-parity.test.ts` `SA-placements-projects-104 keeps report draft, Ctrl or Cmd Enter, similar issues and a success card` |
| SA-placements-projects-106 | DONE (authored; unrun) | `src/components/tracker/tracker-issue-bulk-actions.tsx` and Issues page: select-current-page, sequential authorized/version-checked workflow changes, partial failure IDs; `tests/unit/chat16-reassigned-tracker-parity.test.ts` `SA-placements-projects-106 selects page issues and performs authorized optimistic writes while retaining failed IDs` |
| SA-placements-projects-107 | DONE (authored; unrun) | `src/components/tracker/tracker-issue-saved-views.tsx` persisted named filter presets with apply/delete, excluding cursor state; `tests/unit/chat16-reassigned-tracker-parity.test.ts` `SA-placements-projects-107 saves, restores and deletes named views without persisting pagination cursors` |

OPEN: SA-101,103 (private screenshot storage),109,112 (theme toggle),113,114,116,117,118,119,120 (GitHub credentials),121,122. The reporter auth/access model and independent auditor findings schema require further implementation. No unverified or infrastructure-dependent gap is declared closed.
