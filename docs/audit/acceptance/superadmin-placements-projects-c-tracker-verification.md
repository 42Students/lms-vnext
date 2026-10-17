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
| SA-placements-projects-112 | DONE (source authored; browser contrast/keyboard acceptance pending) | `src/components/tracker/tracker-admin-nav.tsx`, `src/components/tracker/tracker-theme-toggle.tsx`, `src/app/globals.css`; `tests/unit/chat6-tracker-theme-nav-verification.test.ts` → `SA-placements-projects-112 provides exact tracker navigation, skip link and a working keyboard-operable Light / Dark toggle`. Preference persists per browser, dark palette is scoped to tracker and reset on exit. Actual Cloud Logging page remains separately tracked as SA-placements-projects-113. |

## Chat-6 saved issue-list controls (named tests authored; not run)

| SA-placements-projects-106 | DONE (source verified; workflow/database pending) | `src/components/tracker/tracker-issue-bulk-actions.tsx`, `src/app/(authenticated)/tracker/issues/page.tsx`; `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts` → `SA-placements-projects-106 bulk status changes preserve per-issue version guards and partial failure reporting`. Each selected issue uses the authorized version-checked PATCH; failed IDs remain visible for retry. |
| SA-placements-projects-107 | DONE (browser-local; multi-device sync not offered) | `src/components/tracker/tracker-issue-saved-views.tsx`, `src/app/(authenticated)/tracker/issues/page.tsx`; `tests/unit/chat6-tracker-bulk-saved-views-verification.test.ts` → `SA-placements-projects-107 safely saves, applies and removes bounded browser-only filter presets`. Only filter parameters persist; no report data or credentials stored. |

## Provider-dependent and intentional policy dispositions

| SA-placements-projects-103 | BLOCKED | Screenshot paste/upload/remove, post-submit retry and private image preview require a provisioned private scanned object-store, scoped upload receipts and signed delivery. An unsigned object key is not equivalent evidence. |
| SA-placements-projects-113 | BLOCKED | A real multi-filter Cloud Logging explorer and pagination need a configured GCP Logging read identity/provider integration; Known Errors is a distinct durable internal view and is not represented as live Cloud Logging. |
| SA-placements-projects-120 | BLOCKED | Synchronizing `42Students/lms-findings` with last-run reconciliation/refused-file report requires verified GitHub findings-import credentials. No fake sync status or importer run was added. |
| SA-placements-projects-118 | NOT-A-GAP | Owner OD-27 reserves logs and audit findings for Super Admin; a legacy non-SA manager password gate would weaken central permissions. `src/app/(authenticated)/tracker/logs/page.tsx`; `tests/unit/chat6-tracker-log-scope-policy.test.ts` → `SA-placements-projects-118 NOT-A-GAP manager password bypass is disallowed by OD-27; log access remains Super Admin scoped`. |

| SA-placements-projects-101 | NOT-A-GAP | Owner OD-27 rejects anonymous reporter sessions and keeps audit/log data Super Admin-only. `src/app/(authenticated)/tracker/issues/page.tsx`, `docs/audit/pages/superadmin/placements-projects-c-tracker.md`; `tests/unit/chat6-tracker-intake-policy-round8.test.ts` → `SA-placements-projects-101 preserves approved authenticated reporter privacy boundary instead of anonymous listing`. Browser-only reporter access can be reconsidered separately after identity rollout. |

| SA-placements-projects-119 | DONE (independent schema registered; runtime/browser pending) | `src/db/schema/db10-audit-findings.draft.ts` (migration 0133), `src/modules/bug-tracker/independent-audit-findings-service.ts`, `src/app/(authenticated)/tracker/audit-findings/{page,[publicId]/page}.tsx`; `tests/unit/chat6-independent-audit-findings-round9.test.ts` → `SA-placements-projects-119 never substitutes bug tracker issues for independent audit findings`. Separate enable gate requires verified DB 0133. |
| SA-placements-projects-122 | DONE (source authored; real DB/browser pending) | `src/modules/bug-tracker/independent-audit-findings-model.ts`, service and board; `tests/unit/chat6-independent-audit-findings-round9.test.ts` → `SA-placements-projects-122 provides Open Release All, multi filters and bounded 50-row paging`. |

| SA-placements-projects-121 | DONE (source authored; real DB/integration pending) | `src/modules/bug-tracker/independent-finding-actions-model.ts`, `independent-audit-findings-service.ts`, `src/app/api/tracker/audit-findings/[publicId]/route.ts`, `src/components/tracker/independent-finding-actions.tsx`; `tests/unit/chat6-independent-finding-actions-round10.test.ts` → `SA-placements-projects-121 records version-checked finding edits and reason-required terminal statuses`. Includes status, severity, assignee, duplicate, fix commit and comment with immutable event rows. |

## Chat-16 incremental provider and log-contract verifications — authored tests, not executed

| ID | Disposition | Evidence |
|---|---|---|
| SA-placements-projects-109 | DONE (provider-gated UI) | Scoped read and bounded warning/error time-window around the issue in `tracker-issue-logs-panel.tsx` and `issues/[publicId]/nearby-logs/route.ts`; `chat16-mentor-tracker-contract-round2.test.ts` — SA-placements-projects-109. No false result when Cloud Logging not configured. |
| SA-placements-projects-114 | PARTIAL | Log record detail offers Copy permalink, Copy for Claude and Report this. Known Errors cards expose mute/unmute, but not all actions are bound to a selected log signature; `chat16-mentor-tracker-contract-round2.test.ts` — SA-placements-projects-114. |
| SA-placements-projects-116 | PARTIAL (delivery credentials pending) | Daily digest preview, Send to Telegram now and Send test alert use origin-guarded rate-limited route; `tracker-telegram-manual-panel.tsx` and round2 test — SA-placements-projects-116. Provider validation requires configured bot/chat in deployment. |
| SA-placements-projects-117 | DONE (provider-gated UI) | Redacted, bounded CSV and Claude markdown reports, paging and download notices in `tracker-live-logs-explorer.tsx`; round2 test — SA-placements-projects-117. Real provider access remains the SA-113 infrastructure dependency. |
