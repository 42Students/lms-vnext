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

### Chat-16 SA-placements-projects-114 linked live log triage (authored, provider unverified)

| SA-placements-projects-114 | DONE (source; integration pending) | `tracker-cloud-logs.ts` matches redacted live errors against persisted Known Error signatures by canonical hash and environment only when DB10 Log Alerts is verified; `tracker-live-logs-explorer.tsx` opens matched detail or prompts before muting/unmuting via authorized origin-checked PATCH; `known-errors-workspace.tsx` adds permalink targets. `tests/unit/chat16-tracker-known-error-link-round4.test.ts` — SA-placements-projects-114. No raw samples or account identities returned by this mapping. |

## Chat-16 provider-independent Telegram digest preview

| SA-placements-projects-116 | PARTIAL (delivery integration gated) | `src/components/tracker/tracker-telegram-manual-panel.tsx` permits read-only daily digest preview with regressions, fixed/muted counts and deploy metadata without Telegram credentials. Test `tests/unit/chat16-telegram-preview-graceful-r5.test.ts` → `SA-placements-projects-116 previews digest offline while disabling only sends`. Both send/test buttons remain disabled without bot/chat configuration; actual Telegram transport needs configured provider and integration validation. Source test authored; no CI executed. |

## Chat-16 infrastructure-safe decisions and filters

| SA-placements-projects-103 | NOT-A-GAP (intentional secure alternative; uploads still unavailable) | The unscanned, paste-anywhere screenshot behavior is not appropriate for tenant-specific reports. `src/components/tracker/tracker-report-form.tsx` instead accepts a shareable evidence URL, warns against publicly sharing private screenshots and keeps report errors friendly; `src/modules/bug-tracker/report-input-model.ts` rejects non-http(s) schemes. `tests/unit/chat16-tracker-evidence-decision-r6.test.ts` contains SA-placements-projects-103 validation and privacy tests. Private signed/scanned first-party image uploads remain a separately gated future feature and are **not** claimed implemented. |
| SA-placements-projects-113 | DONE (source, provider-required at runtime) | Validated and bounded live Cloud Logging Explorer: `src/app/api/tracker/live-logs/route.ts` accepts only whitelisted time-window, page cursor, query and severity fields; `tracker-live-logs-explorer.tsx` now offers ERROR/WARNING selectors, limited paging and redacted exports. `tests/unit/chat16-tracker-live-log-severity-r6.test.ts` includes SA-placements-projects-113. Workload Identity/Cloud Logging IAM must be configured to exercise live provider reads; no false empty result is presented when not configured. |
| SA-placements-projects-116 | DONE (source, Telegram delivery unverified) | `tracker-telegram-manual-panel.tsx` and origin-checked `logs/manual-alert/route.ts` support read-only digest preview, rate-limited Send test alert / Send to Telegram now. Missing bot/chat credentials disable sending, not reading. `tests/unit/chat16-telegram-preview-graceful-r5.test.ts` includes SA-placements-projects-116. Real provider credentials remain a deployment prerequisite, not a simulated delivery success. |

## Chat-16 source-availability findings

| SA-placements-projects-120 | BLOCKED (GitHub import source unavailable; read-only alternative implemented) | `src/modules/bug-tracker/independent-audit-findings-service.ts` now reads only genuine `audit_finding_syncs` rows, and `src/app/(authenticated)/tracker/audit-findings/page.tsx` displays last sync, imported and refused counts if recorded, otherwise explicitly says no import is configured. `tests/unit/chat16-tracker-findings-sync-r6.test.ts` → `SA-placements-projects-120 shows only persisted sync history, never synthetic GitHub sync success`. The referenced `42Students/lms-findings` repository returned GitHub 404 using the current connector, and no verified import credentials/schema feed were provided. No `Sync now` mutation was faked or claimed successful. |
