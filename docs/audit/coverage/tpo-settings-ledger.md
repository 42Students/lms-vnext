# Chat-11 TPO settings and college setup — behavioural coverage ledger

Master queue: `docs/orchestrator/queues/master-queue.md`, Pass B/chat-11 item 1. Source and tests referenced below were inspected on 2026-10-18. This is a **partial ledger**, not an assertion that every TPO-settings export is verified or that tests passed.

| Function/route | Tested behaviour and negative cases | Test evidence | Outstanding work |
|---|---|---|---|
| `TPO_SETTINGS_NAV_GROUPS`, `TpoSettingsNav` — `src/components/placements/tpo-settings-nav.tsx` | Original section labels, distinct links, sticky desktop / wrapped mobile, active `aria-current` | `tests/unit/chat11-final-TPO-settings-audit-07.test.ts` (TPO-settings-audit-07) | 320/360/390px interaction tests |
| `tpoRulesChangeSchema`, `tpoRuleBoundsValid` — `src/modules/placements/tpo-season-write-model.ts`, `tpo-rule-limits.ts` | RELEASED/ACCEPTED only, invalid values and max/min legacy bounds rejected | `tests/unit/chat11-tpo-settings-final-hardening.test.ts` (TPO-settings-audit-11) | PG concurrent version token, origin/unauth tests |
| `TpoCollegeRulesControl` | Before-React-commit double-click guard, disabled save while pending, >=44px touch controls and safe confirmation | Same TPO-settings-audit-11 case | Browser rapid-click/back-navigation |
| `getTpoJobTypes` — `tpo-configuration-read-service.ts` | College restriction and canonical settings | `tests/unit/chat11-final-TPO-settings-audit-23.test.ts` source witness | **OPEN:** drive form/filter/report consumers; no false DONE claim |
| `tpoPrepConfigSchema` — `tpo-configuration-model.ts` | Unique prep course UUIDs, maximum 40, completed threshold <= selected course count | `tests/unit/chat11-tpo-settings-final-hardening.test.ts` (TPO-settings-audit-41) | Database persistent versions |
| `deriveTpoPrepCourseOutcome` — `tpo-prep-readiness-derivation.ts` | READY, NEEDS_PREP, UNAVAILABLE, missing/duplicated/fractional course evidence, unconfigured config and impossible thresholds | Same TPO-settings-audit-41 test; `tests/unit/chat11-final-TPO-settings-audit-41.test.ts` | PG learner course enrollment/repeated publication |
| `readTpoLearnerPrepOutcomes` — `tpo-prep-readiness-derived-service.ts` | College course evidence scoped by active offering/cohort and student; no missing-progress false judgement | `tests/unit/chat11-final-TPO-settings-audit-41.test.ts` (source contract) | PostgreSQL wrong-tenant, 5000-item cap, half-loaded DB failure |
| `tpoRecruiterGrantCsv`, `tpoRecruiterGrantExportHref` | Sanitized CSV, private link and grant scope; CSV name `recruiters.csv` | `tests/unit/chat11-final-TPO-settings-audit-60.test.ts` | **OPEN:** legacy Excel parity and privacy approval for phone |
| `resolveTpoNotificationPreferences`, `TPO_NOTIFICATION_PREFERENCE_FIELDS` | Five switch defaults vs persisted vs unavailable; never pretend preferences persisted | `tests/unit/chat11-tpo-settings-final-hardening.test.ts` (TPO-settings-audit-80) | Provider-independent delivery preference enforcement |
| `TpoMyNotificationPreferencesEditor` | Async network response, same-origin PUT, ref latch, stale/401/403 safe errors, input preserved | Same TPO-settings-audit-80 test | Browser network failure and concurrent sessions |
| `/tpo/audit` and `tpoAuditRows` | Links allowlisted canonical resources, no unsafe identifier interpolated | `tests/unit/chat11-final-TPO-settings-audit-95.test.ts` (TPO-settings-audit-95) | PostgreSQL audit entity authorization |
| `TpoAuditSavedViews` | User+college-local partition, pin cap, rename, delete, open, recency ordering | `tests/unit/chat11-final-TPO-settings-audit-R04.test.ts` (TPO-settings-audit-R04) | Server multi-device view sync differs from legacy |
| `getModuleAccessOverviewMetrics` — `src/modules/module-access/admin-overview-metrics-service.ts` | Super Admin permission gate, bounded authorized-college learner and override counts | `tests/unit/chat11-final-SA-tenants-modules-R01.test.ts` (SA-tenants-modules-R01) | Real database cross-org denial, 1000+ tenant perf |

**Remaining Master Queue item 1:** Exhaustively enumerate every TPO settings, course progress, setup steps, notice settings and preference export, cover route-level 401/403/CSRF, stale versions, transaction events and notification side effects. Existing unit names above alone do not meet exhaustive coverage. Master Queue item 2 (Super Admin tenant modules, branding, sign-in, readiness) is also still incomplete. Chat-11 can author tests through GitHub, but cannot execute Vitest/TypeScript/PostgreSQL or visual browser checks here.


## Follow-up hardening on synchronized main (2026-10-18)

| Function / route | Checked invariants | Named test | Status |
|---|---|---|---|
| `TPO_SETTINGS_NAV_GROUPS` | Reinstated exact legacy `Recruiter access` label without changing route | `tests/unit/tpo-settings-primary-nav.test.ts`, TPO-settings-audit-01 | Source fixed `da8a94a`; Vitest unexecuted |
| `TpoCompanyMemoryWorkspace.retry` | Clear stale data, abort previous request, pass active AbortSignal and ignore obsolete responses | `tests/unit/tpo-company-memory-effect-retry.test.ts`, TPO-companies-21 | Test strengthened `57708c7`; Vitest unexecuted |
| `TpoStudentQuickPanel` | Client component directive first; membership-keyed private detail data; cancel in-flight request on student switch, suppressed stale resolution | `tests/unit/tpo-student-quick-panel.test.ts`, TPO-students-02 | Source and regression `3c20a80`, `995b90c`; browser E2E pending |
| `TpoMessagesPage` and shared `DataTable` | Single DOM path for phone cards and desktop table; recruiter deep link remains accessible | `tests/unit/tpo-inbox-team-round2.test.ts`, TPO-inbox-team-13 | Corrected obsolete hand-coded-card expectation `7907ef6`; browser E2E pending |
| `TpoApplicantReviewDrawer`, `TpoNoticeComposerDialog` | Shared native modal's Escape, focus return, aria name and native focus containment | `tests/unit/tpo-drive-workspace-s2-evidence-contracts.test.ts` TPO-drive-workspace-27; `tests/unit/tpo-notice-round4-verification.test.ts` TPO-inbox-team-50 | Corrected obsolete inline-dialog test witnesses `1df4e96`, `c8c7854`; keyboard E2E pending |

**Coverage limitation:** No assertion above is a full export ledger. Master-queue TPO settings/setup service coverage, cross-tenant PostgreSQL proof, notification dedupe and runtime phone accessibility remain open, and no local Vitest/TypeScript runner or PostgreSQL is accessible from this connected GitHub editing surface.


## Pass B chat-11 follow-up: versioned communication and all settings routes

| Function / route / UI | Happy path, negative and concurrency coverage | Named test / change | Still open |
|---|---|---|---|
| `tpoCommunicationChangeSchema`, `tpoCommunicationChanges` — `src/modules/placements/tpo-communication-change-model.ts` | Five supported sections, per-field min/max, unknown extra keys, stale/invalid timestamp, boolean preferences and allowed 3/6/12/24 recruiter durations | `tests/unit/chat11-tpo-communication-adversarial.test.ts`, `TPO-settings-audit-CAS-01` | API end-to-end authenticated scope |
| `tpoCommunicationUpdateAlreadyApplied`, `updateTpoCommunicationSettings` | Exact-section idempotent retried write under college lock without duplicate audit; genuinely different stale action remains 409; timestamps advance atomically | Same `CAS-01` test (pure model + service source check); change `35a54c5` | Concurrent two-session PostgreSQL and activity count |
| `TpoOptionalEmailsEditor` | Ref guard prevents two saves before re-render; saved state reflects last persisted switches, version updated; 401/403/409/503 safe errors; preserves unsaved choices | Same file `EMAIL-01`; change `2b34665` | Browser double-click, expired session, provider outage |
| `TpoPrepPercentageEditor` | Ref guard, integer 0–100, empty-number refusal, saved value/version refresh, safe 401/403/409/503 errors | Same file `PREP-02`; change `46d26c7` | PostgreSQL optimistic conflict and UI E2E |
| `TpoSmsCapEditor`, `TpoEmailSignatureEditor`, `TpoRecruiterDurationEditor` | Synchronous ref latch before React commit, schema bounds and existing source-safe error messages | Same file `DOUBLE-01`; change `ac8f4b6` | Browser and network-failure injection |
| `tpoMyNotificationsQuerySchema` | Strict decimal input; no `0x`, `1e`, sign, whitespace, invalid status, unsupported keys; canonical filter URL | `tests/unit/chat11-tpo-settings-notices-preferences.test.ts`, `NOTIFY-01`; change `5458c26` | HTTP tests with repeated URL params |
| `tpoMyNotificationsHref`, `safeTpoNotificationLabel`, `tpoNotificationReadStatus`, `resolveTpoNotificationPreferences` | Own-recipient views, fixed non-PII module subjects, unread logic, persisted/default/unavailable differentiation | Same file `NOTIFY-01` | Notification query SQL wrong-tenant and session revocation |
| `tpoStudentNoticesOverview`, `tpoStudentNoticeNavigation`, `deriveTpoPrepCourseOutcome` | Source read failures do not imply zero recipients or delivery; no false READY from missing/duplicate/bad course evidence; authoring vs inbox/preferences links kept distinct | Same file `NOTICES-01` | Full teacher/learner publication and mail/SMS integration |
| `/tpo/settings/{after-college,blocked-dates,branding,job-types,notices,notifications,prep-readiness,public-link,public-page,recruiters,rules,season,see,team,templates,trusted}` | Enumerated each server page's role-scoped reader, navigation and truthful loading/empty/unknown states; forbidden raw HTML and native confirmation | `tests/unit/chat11-tpo-settings-route-surfaces.test.ts`, `TPO-settings-audit-ROUTES-01` | Runtime rendering, page role matrix, phone sizes, network errors and final legacy parity |

These are named and scope-specific tests, but full per-export coverage of all service functions is **not yet demonstrated**. Database-backed and HTTP E2E tests need execution and additional cases before releasing IIT Dharwad.


| `updateTpoCommunicationSettings` and `assertPersistedPlatformPermission` | A user disabled, role revoked, college reassigned or membership suspended between request authentication and DB mutation fails under persisted user/role SHARE locks inside the same transaction | `tests/unit/chat11-tpo-communication-adversarial.test.ts`, `TPO-settings-audit-REVOKE-01`; `7e931c3` | Actual concurrent PostgreSQL role-revocation test |
