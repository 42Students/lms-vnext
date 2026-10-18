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


| `readTpoCommunicationBody`, `TpoCommunicationBodyError`, `PATCH /api/placements/tpo/settings/communication` | 8 KiB streamed body bound even without Content-Length, safe UTF-8/JSON parsing, exact JSON media-type gate, stable 400/413 without raw payload, same-origin and separate authenticated write | `tests/unit/chat11-tpo-communication-request-body.test.ts`, `TPO-settings-audit-BODY-01` | Live chunked slow-client / timeout and HTTP 401/403 E2E |

| `getTpoMyNotifications` — `tpo-my-notifications-service.ts` | Count, status and paginated list all apply user + college + organization constraints; preference row requires user+college; GET never writes; only fixed safe module labels selected | `tests/unit/chat11-tpo-settings-notices-preferences.test.ts` — `TPO-settings-audit-NOTIFY-02` | Real DB with user having memberships in two colleges; 401/403 HTTP |

| `PATCH /api/placements/tpo/settings/communication` | Actual Next handler rejects forged origin before principal lookup, stream parsing bounds, accepts Unicode JSON and uses server-side principal, maps 400/413/409/503 and simulated auth failure without raw secrets | `tests/unit/chat11-tpo-communication-route-adversarial.test.ts` — `TPO-settings-audit-ROUTE-01` | PostgreSQL actor permission matrix and scheduled mail failure injection |


| `tpoNotificationPreferenceSaveSchema`, `tpoNotificationPreferenceValues`, `tpoNotificationPreferencesMatch` | Strict personal-switch schema, rejects caller-selected user/tenant, exact five-boolean state equality and changed-field detection | `tests/unit/chat11-tpo-preferences-write-adversarial.test.ts`, `TPO-settings-audit-PREF-01` | HTTP role tests, persisted database |
| `saveMyTpoNotificationPreferences` | College row locked, actor role rebuilt under SHARE locks, persisted TPO role required; duplicate retry before CAS returns previous version without new event; changed updates advance monotonic millisecond timestamp | Same test `PREF-01` (pure functions + source ordering) | Two simultaneous sessions and 401/403/409 PostgreSQL test |
| `tpoPrepReadinessSaveSchema`, `tpoPrepReadinessSamePolicy`, `setTpoPrepReadiness` | Unique max-40 course IDs, threshold bounds, no forged college, identical retry without second audit; active college courses scoped by department; monotonic timestamp, persisted actor inside transaction | `tests/unit/chat11-tpo-prep-write-adversarial.test.ts`, `TPO-settings-audit-PREP-CAS-01` | PostgreSQL course publication/revocation and concurrent updates |
| `tpoOutcomeLabelsAlreadyApplied`, `readTpoOutcomeLabels`, `saveTpoOutcomeLabels` | Safe stored shape, after-college label identity, no-op retry with omitted generated IDs, strict duplicate-label schema; persisted actor and college lock before CAS, monotonic versions and audit event only on changed policy | `tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts`, `TPO-settings-audit-OUTCOME-CAS-01` | PostgreSQL wrong-tenant, inactive role and concurrent rename cases |


| `PUT /api/placements/tpo/my-notification-preferences`, `PUT /api/placements/tpo/settings/outcome-labels`, `PUT /api/placements/tpo/settings/prep-readiness` | Same-origin before actor lookup; 8 KiB binary stream cap; malformed UTF-8/JSON 400, oversized 413; service gets authenticated context, no caller identity; 401/403 mapped by shared API boundary; no successful response echoes injected IDs | `tests/unit/chat11-tpo-settings-route-boundary.test.ts`, `TPO-settings-audit-BODY-02` | Live HTTP chunks, per-tenant DB scopes and browser retries |

| `tpoConfigVersionSchema`, `hasCurrentTpoConfigVersion`, `tpoJobTypeNameSchema`, `tpoBlockedDaySchema` | RFC3339 offset token, exact persisted ISO version, valid date-only including leap-day, max 40 Unicode job-title characters with combining marks, at least one alphanumeric and punctuation injection denial | `tests/unit/chat11-tpo-config-validation.test.ts`, `TPO-settings-audit-CONFIG-01` | PostgreSQL legacy persisted labels and timezone rendering |


| `tpoSettingsCollegeIdSchema`, `buildTpoTeamRoster`, `summarizeTpoTeam` | UUID validation, dedupe active TPO/College Admin and dedicated faculty/learner assignments, exclude disabled/suspended, ordered dated drive duties, honest summary counts | `tests/unit/chat11-tpo-people-read-adversarial.test.ts`, `TPO-settings-audit-PEOPLE-01` | Real PostgreSQL rows with dual roles and large roster |
| `getTpoPlacementTeam` | Checked server reader college membership/organization scope, optional tables unavailable rather than fabricated coordinator counts | Same test `PEOPLE-01` (model behavior + source access witness) | Actual HTTP role matrix and missing-table injection |
| `buildTpoTrustedCompanies`, `buildTpoTrustedDomains` | Company trust is per-college relationship flag; global primary domain is never implicitly approved; explicit domains sorted/canonicalized and deduped by earliest record | Same file `TPO-settings-audit-TRUST-01` | PostgreSQL out-of-tenant relationship check |
| `getTpoTrustedCompanies` | Explicit trusted domains queried only under the TPO's selected college, total null when table unavailable, no inferred allowlist from company primary domain | Same test `TRUST-01` (source and model) | Real database 403 + historical invalid domain migration |


| `tpoTrustedCompanyDomainSchema`, `validTpoTrustedHost` | Existing optional @ and case-folding preserved; rejects invalid label-edge hyphens, empty DNS labels, 64-character labels, email addresses, URL/userinfo/queries, free-mail and non-public host shapes | `tests/unit/chat11-tpo-trusted-domain-validation.test.ts`, `TPO-settings-audit-TRUST-02` | Migration review of existing invalid stored domains |
| `POST /api/placements/tpo/trusted-domains` | Forbid cross-origin before context, reject over-8KiB streamed JSON and malformed content, pass authenticated principal to service; duplicate/not-found 409, expired identity 403, no raw payload echo | `tests/unit/chat11-tpo-trusted-domain-route.test.ts`, `TPO-settings-audit-TRUST-03` | HTTP integration with real PG row revocation and domain conflict |

| `readTpoLearnerPrepOutcomes` | Persisted TPO authorization must pass and selected college ID must match *before* returning a successful empty roster, before loading policy or learning progress. Wrong tenant and revoked role denied rather than misleading available result | `tests/unit/chat11-tpo-prep-scope-adversarial.test.ts` — `TPO-settings-audit-PREP-SCOPE-01` | PostgreSQL cross-tenant learner IDs; course-cohort pair eligibility |


| `parseTpoRecruiterAccessParams`, `tpoRecruiterAccessQuerySchema` and `/tpo/settings/recruiters` | Reject ambiguous repeated status/page/query values, foreign ID params, scientific/hex/whitespace pages, unknown grant statuses, oversize search; load no grants before full validation, retain legacy recruiter copy and filtered canonical links | `tests/unit/chat11-tpo-settings-filter-input.test.ts`, `TPO-settings-audit-RECRUIT-04` | Authenticated HTTP render tests for same/foreign colleges |
| `parseTpoMyNotificationsParams` and `/tpo/settings/notifications` | Repeated view/page/pageSize and appended user/college IDs fail closed with clear-filters recovery; unread filters and links retained; prevent interpreting attacker-controlled first value | Same test `TPO-settings-audit-NOTIFY-03` | 401/403 and browser repeated-URL error-state tests |

| `readTpoLearnerPrepOutcomes`, `validateTpoPrepLearnerPairs`, `hasEveryScopedTpoPrepLearner` | Member/cohort request requires persisted active College Admin/TPO, exact college, active user/learner role and actual ACTIVE/COMPLETED matching academic enrollment. Reject foreign learner membership, forged cohort, duplicate identity, 5001+ learners, stale/disabled roles before progress; no cross-college inference | `tests/unit/chat11-tpo-prep-learner-scope.test.ts`, `tests/integration/chat11-tpo-prep-learner-scope.test.ts` — `TPO-settings-audit-PREP-SCOPE-02` | CI needs PostgreSQL and enrolment-history stress test |

## TPO job-type transaction authorization hardening — chat-11

| Function / mutation | Newly verified contract | Evidence | Unverified |
|---|---|---|---|
| `createTpoJobType` | Rebuild persisted TPO/College Admin authority under the active-college update lock before duplicate lookup, limit check, insert or activity event | `tests/unit/chat11-tpo-job-type-transaction-authorization.test.ts` — `TPO-settings-audit-23`; commit `7ba3174` | PostgreSQL role-revocation concurrency test |
| `setTpoJobTypeActive` | Persisted authority precedes stale check, active-choice calculation, update and audit | Same named test and commit | Cross-tenant and concurrent last-active test |
| `renameTpoJobType` | Persisted authority precedes candidate name lookup, optimistic version and rename | Same named test and commit | Rename/drive historical consumption |
| `setTpoBuiltinJobTypeActive` | Persisted authority precedes virtual built-in materialization, no-op and activity | Same named test and commit | Duplicate edit and published-drive preservation |
| `setTpoJobTypeCountsAsPlaced` | Persisted authority precedes count-as-placed edits and activity event | Same named test and commit | Downstream existing-offer/reports recalculation |

**Disposition:** This fixes one TPO-settings-audit-23 write-authorization race across five exports but **does not close** the gap's drive form/filter/report side effects or establish full behavioural, PostgreSQL or runtime coverage. Regression suite is written but not run.

## Blocked-date settings transaction boundary

| Function | Verified safety boundary | New test | Still pending |
|---|---|---|---|
| `createBlockedDate` | Revoked user / membership / placement role is checked from persisted rows under the selected-college update lock before checking existing days, inserting up to 90 and auditing | `tests/unit/chat11-tpo-blocked-date-transaction-auth.test.ts` — `TPO-settings-audit-43`; commit `1ef26ab` | Two-session PostgreSQL race, scheduling side effects (`TPO-settings-audit-44`) |
| `deleteBlockedDate` | Revalidation before version-token check, scoped delete and audit in one transaction | Same named test and commit | Repeated delete and missing row against live PG |
| `removeBlockedRange` | Revalidation before composite day/version match, scoped range delete and audit | Same named test and commit | Concurrent range delete and 90-day batch performance |

**Runtime status:** Source/test authored without executing code. The audited blocked-date UX and scheduling consumers still require separate live acceptance; this is not a full TPO settings closeout.

## Follow-up verified-source ledger: retry, Excel and tenant-read barrier

| Export / route | New contract | Unit witness | Runtime gap |
|---|---|---|---|
| `setTpoJobTypeActive`, `renameTpoJobType`, `setTpoBuiltinJobTypeActive`, `setTpoJobTypeCountsAsPlaced` | Current-state retry before optimistic conflict; monotonically increasing version timestamp, and event only for actual change | `tests/unit/chat11-tpo-job-type-cas-retries.test.ts` — TPO-settings-audit-23 | Two-session PostgreSQL CAS race; job-form and reporting effects |
| `tpoRecruiterGrantExportRows`, `tpoRecruiterGrantCsv`, `tpoRecruiterGrantXlsx`, `tpoRecruiterGrantExportHref` | Shared capped, tenant-scoped projection; CSV formula escaping and XLSX literal inline strings; original CSV URL stable, format explicit | `tests/unit/chat11-tpo-recruiter-grant-excel-export.test.ts` — TPO-settings-audit-60 | Live Excel compatibility, HTTP tenant scope and PII policy confirmation |
| `GET /api/placements/tpo/settings/recruiter-grants/export` | Unique allowlisted status/q/format query keys; no arbitrary user/college/page overrides, safe 400, no-store response and both file formats | Same TPO-settings-audit-60 test | Actual-handler 401/403 and export cap DB |
| `getModuleAccessOverviewMetrics` | Revalidate persisted active system-role inside read transaction, including empty-page response; scope all aggregates to validated visible colleges | `tests/unit/chat11-super-admin-module-metrics-revoked-role.test.ts` — SA-tenants-modules-R01 | PostgreSQL two-session revocation and 100-college stress |

**CI snapshot caveat:** The orchestrator's `unit-failures-latest.md` names three chat-11 failures from older CI `698eb9dd` although the three latest unit test assertions match present source. The two chat-11 test-type errors were corrected with explicitly typed denied-role fixtures and literal trusted-domain conflict codes (`064dca9`, `3b89c60`). New cloud CI, not inference from stale output, decides pass/fail.

| `GET /api/placements/tpo/settings/recruiter-grants/export` — actual handler | 400 on duplicate/unknown/foreign identity filters before principal lookup, signed-in tenant-scope `exportAll` contract, 200 CSV/XLSX content type and ZIP, 403 expired-session no-load | `tests/unit/chat11-tpo-recruiter-grant-export-route.test.ts` — TPO-settings-audit-60; commit `55dfab7` | Live PostgreSQL role matrix and stream abuse |
