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

## Rules page hostile-filter boundary (chat-11 follow-up)

| Surface | Checked contract | Test | Runtime remainder |
|---|---|---|---|
| `parseTpoRulesPageParams`, `getTpoPlacementRulesSettings`, `/tpo/settings/rules` | Absent page defaults to 1; only canonical 1–10000 decimal accepted, no arrays, duplicate page, unknown college/user keys, hex/exponent/whitespace; invalid returns friendly clear-filter state **before** job-policy reads. Service also rejects noncanonical input without coercion | `tests/unit/chat11-tpo-rules-pagination-adversarial.test.ts` — TPO-settings-audit-RULES-PAGE-01; `e01d3c3`, `661618d`, `f01868f`, `b746ba5` | HTTP/browser back-forward on invalid filter and role change |

## Preparation policy editor — lost response and inactive catalog safeguards

| Export/page | Checked behaviour | Test | Pending |
|---|---|---|---|
| `getTpoPrepSelectionState`, `TpoPrepReadinessEditor` | Selected courses missing from live active same-college catalog are surfaced rather than dropped, no save until resolved; 0–40 unique choices, finite integer threshold, dirty check against last saved policy, ref latch before React state, conflict preserves edits, successful response updates CAS token | `tests/unit/chat11-tpo-prep-editor-lost-response.test.ts` — TPO-settings-audit-PREP-UI-03, commits `5bbd2b6`, `16f726d`, `bba8201`, `4a56e13`, `5371c42` | Browser rapid-click/slow network, DB stale token replay |

## College notice settings evidence (2026-10-18)

| Service/UI | Implemented contract | Test | Pending |
|---|---|---|---|
| `tpoStudentNoticesOverview`, `/tpo/settings/notices`, `listTpoPlacementAnnouncements` | Status card uses true college-scoped notices instead of the signed-in officer's author-only history; counts distinguish exact values from at-least totals when page-capped; absent relation says unavailable, not zero or delivered | `tests/unit/chat11-tpo-notices-college-count.test.ts` — TPO-settings-audit-NOTICES-04; commits `9b953eb`, `e7e6f25`, `61e31bd` | PostgreSQL 101/102 notices, notices by multiple TPOs, live sender audience E2E |

## Recipient-safe notification history after session revocation

| Export | Added integrity contract | Regression | Still pending |
|---|---|---|---|
| `getTpoMyNotifications` | Own-user, same-college, same-organization filters apply independently to count and paginated rows; after preferences read the service rechecks active persisted TPO (not merely College Admin placements.manage) in transaction-held SHARE locks before responding, including to a revoked/disabled user | `tests/unit/chat11-tpo-private-notifications-revocation.test.ts` — TPO-settings-audit-NOTIFY-READ-05, commits `cb7b636`, `ee28856` | Two-session PG role revocation; mixed-college recipient integration |

## Personal preference editor — last-saved CAS token (chat-11)

| Export/route | Behavioural requirement | Regression | Remaining |
|---|---|---|---|
| `TpoMyNotificationPreferencesEditor`, `saveMyTpoNotificationPreferences` | Five exact own-account switches and no caller-selected user/college; no-op retry avoids duplicate audit, successful response updates local saved baseline and optimistic token so two sequential saves work, synchronous click lock and safe errors remain | `tests/unit/chat11-tpo-personal-preferences-editor-cas.test.ts` — TPO-settings-audit-PREF-UI-06, commits `2230087`, `41f1463` | Browser sequential-save slow revalidation and cross-session PostgreSQL CAS |

## Archived department prevention in preparation assignment

| Export | Behaviour and negative cases | Test evidence | Runtime remainder |
|---|---|---|---|
| `listTpoPrepCourses`, `readTpoLearnerPrepOutcomes` | An archived department is excluded from active college preparation choices and from learner published-content readiness evidence; missing eligible published content is UNAVAILABLE, not NEEDS_PREP or READY; stored selections absent from active catalog remain unresolved for correction | `tests/unit/chat11-tpo-prep-archived-catalog.test.ts` — TPO-settings-audit-PREP-CATALOG-07, commits `a329efb`, `a483080`, `5a42456` | PostgreSQL archived department / old offering, role and course completion integration |

## Personal preference HTTP adversarial coverage

| API | Behavioural test | Evidence | Remaining |
|---|---|---|---|
| `PUT /api/placements/tpo/my-notification-preferences` | Actual mocked HTTP route rejects foreign origin before actor lookup, invalid JSON/media type (400), streamed oversized body (413), maps stale 409 and storage unavailable 503; successful own-account response private no-store; denied session mapped through central error boundary; strict service model separately denies any `userId`/`collegeId` keys | `tests/unit/chat11-tpo-preferences-http-security.test.ts` — TPO-settings-audit-PREF-HTTP-08, commit `20f4314`; plus `chat11-tpo-personal-preferences-editor-cas.test.ts` | Real PostgreSQL RLS-equivalent cross-tenant and expired session tests |

**PREP-CATALOG-07 transaction supplement:** `setTpoPrepReadiness` now checks the locked college's ACTIVE status and revalidates every requested UUID against ACTIVE courses inside a non-archived department of the authorized college. The previous catalog-only filter was insufficient because a direct HTTP client could still save retired academic course IDs. `tests/unit/chat11-tpo-prep-archived-catalog.test.ts` includes the locked mutation ordering test; commits `aa6a9a5` and `06d33d1`. PostgreSQL remains unexecuted.

## Recruiter grant mutations after officer role revocation

| Endpoint/service | Added invariant | Test | Pending |
|---|---|---|---|
| `changeTpoRecruiterGrant` (GRANT, EXTEND, REVOKE, already-active no-op) | A request-scoped TPO may have become a College Admin after preflight; college `placements.manage` alone cannot authorize this TPO-only workflow. Transaction now reconstructs persisted actor, requires exact TPO role and matching selected college/organization **before** first settings-row insert, grant lookup, optimistic version check or audit | `tests/unit/chat11-tpo-recruiter-grant-live-role.test.ts` — TPO-settings-audit-GRANT-REVOCATION-09; commits `132e0a4`, `a9336c3` | Real dual-session revocation and concurrent grant/extend/revoke PG tests |

## Current-role authorization for settings reads — 2026-10-18

| Settings surface | Contract | Gap-named test | Remaining |
|---|---|---|---|
| `getTpoCommunicationSettings` | A private email signature, notification delivery choices, recruiter grant period and readiness threshold are fetched **inside** a transaction that first validates an ACTIVE college and persisted `placements.manage` actor. Role changes after request preflight do not permit a successful sensitive read based only on request snapshot. | `tests/unit/chat11-tpo-communication-read-revocation.test.ts` — `TPO-settings-audit-COMM-READ-10` | Real revoked-role PostgreSQL race and college deactivation test |
| `getTpoJobTypes`, `getTpoBlockedDates`, `getTpoPrepReadiness`, `listTpoPrepCourses` | Every configured/absent-table read re-authorizes the persisted actor and ACTIVE college before returning saved choices or readiness course catalog; college scoping and archived department exclusion retained. | `tests/unit/chat11-tpo-settings-config-read-revocation.test.ts` — `TPO-settings-audit-CONFIG-READ-11` | Real role-revocation interleaving and database race E2E |

Cloud typecheck, unit, PostgreSQL and browser checks are pending; these are source/contract regressions only.

## Long-running learner course-progress read authorization

| Service | Threat / corrected contract | Test | Pending |
|---|---|---|---|
| `readTpoLearnerPrepOutcomes` | A persisted TPO/College Admin membership may be revoked after enrolment/content/progress joins start. Before returning READY, NEEDS_PREP, UNCONFIGURED or UNAVAILABLE, the service validates the active college and persisted `placements.manage` actor inside a transaction holding SHARE locks. Empty-roster path still validates the officer through its initial persisted actor lookup. Same-college learner/enrollment pair, active identities and 5000-row cap are preserved. | `tests/unit/chat11-tpo-prep-long-read-role-revocation.test.ts` — `TPO-settings-audit-PREP-ROLE-12` | Cloud CI + genuine role-revocation/read race and 5000 learner scale |

## Current ACTIVE college through write and label-read transactions

| Service | Added protection | Regression | Runtime gap |
|---|---|---|---|
| Five `tpo-job-type-write-service.ts` mutations | Read ACTIVE college under `for update` before persisted officer guard and any setting read, no-op, CAS, activity event. No mutation or success from stale tab after college archival. | `tests/unit/chat11-tpo-job-type-archived-college.test.ts` — TPO-settings-audit-23; `2e9247b`, `904b90d` | Actual concurrent tenant archive / write test |
| `createBlockedDate`, `deleteBlockedDate`, `removeBlockedRange` | Same ACTIVE college lifecycle gate for schedule block creation/removal, including no-op and CAS conflicts | `tests/unit/chat11-tpo-settings-archived-college-safety.test.ts` — TPO-settings-audit-43; `e03b354`, `bbd346a` | PostgreSQL date-range/archival race test |
| `saveTpoOutcomeLabels`, `readTpoOutcomeLabels` | Saved labels and versions cannot be edited or read after archived college/role removal; writes use ACTIVE college `for update`, reads hold college `for share` and persisted permission until label data is fetched | Same test — TPO-settings-audit-OUTCOME-CAS-01; `a39921a`, `8ed5e99`, `bbd346a` | Concurrent read/archive/role revocation E2E |

**Status:** source changes and tests authored; tests/TypeScript/PostgreSQL/browser not executed in this lane.

## TPO-settings-audit-R04 — server-persisted saved audit views (new)

| Export / boundary | Verified source contract | Named test | Execution needed |
|---|---|---|---|
| `tpoAuditSavedFiltersSchema`, `tpoAuditSavedViewCommandSchema`, `tpoAuditStoredView`, `tpoAuditSavedViewHref` | Strict audit-only filter shapes, safe UTC/IST date strings, canonical query serialization, invalid tenant/user fields rejected, optimistic revisions and malformed persisted JSON denied | `tests/unit/chat11-final-TPO-settings-audit-R04.test.ts` — `TPO-settings-audit-R04` | Vitest |
| `listTpoAuditSavedViews`, `changeTpoAuditSavedView` | Existing `placement_tpo_saved_views` with `scope='AUDIT'`, exact owner user/college partition, ACTIVE college row lock, persisted TPO-only role, 12-view/5-pin limits, create, rename, delete, pin, open/last-used; tokened CAS prevents stale cross-device updates, metadata-only immutable audit | Same named test (model+source), `tests/unit/chat11-tpo-audit-saved-view-route.test.ts`; commits `f909c18`, `7386eb6`, `437e7c0` | Concurrent PostgreSQL two-session audit view tests and DB migration readiness |
| `GET/POST /api/placements/tpo/audit/saved-views` | GET no-store rejects forged query tenant IDs; POST checks same-origin and actor before bounded JSON, no caller-selected college/user, 409 stale/limits, 404 missing, 503 storage, no raw provider details | `tests/unit/chat11-tpo-audit-saved-view-route.test.ts` seven `TPO-settings-audit-R04` Next route cases; `0e1c13f`, `bbbb979` | Real authenticated HTTP and 400/401/403 route E2E |
| `TpoAuditSavedViews` and `/tpo/audit` | Server-owned views sync between signed-in devices, replaces local-only persistence; asynchronous GET/mutation reconciliation, no blind create retry after lost response, clear errors, preserved keyboard-sized buttons, exact saved-view actions and truthful storage unavailable state | `tests/unit/chat11-final-TPO-settings-audit-R04.test.ts`, `71b56b3`, `017b5bb`, `70a3bac`, `db71584` | Browser double-click, offline/failed storage, cross-device conflicts |

**Disposal:** Original `TPO-settings-audit-R04` missing server persisted saved views is now source-implemented on this branch, rather than browser-only. PostgreSQL, Vitest and browser acceptance are not claimed as run.

## Owner no-CI queue pass — persisted college lifecycle and preparation assignment idempotence

| Export | Scope, state and failure behaviour now present | Existing test evidence / remaining acceptance |
|---|---|---|
| `saveMyTpoNotificationPreferences` | Locks ACTIVE college and persisted exact TPO role before insert/no-op, CAS and event; rejects suspended/archived tenant with NOT_READY; no cross-user writes | `tests/unit/chat11-tpo-personal-preferences-editor-cas.test.ts`; add PostgreSQL simultaneous role-revoke/first-write test |
| `updateTpoCommunicationSettings` | Transaction locks ACTIVE college before live role, CAS and optional delivery/email settings; archived college cannot accept stale-tab writes | `tests/unit/chat11-tpo-communication-read-revocation.test.ts` (read), add DB write/archive race |
| `getTpoPlacementSeasonSettings`, `getTpoPlacementRulesSettings` | Delivery-boundary persisted TPO-only `placements.manage` plus ACTIVE college SHARE lock, after parallel rules/job/count queries | Previous season/settings page evidence in `docs/audit/acceptance/tpo-settings-audit-verification.md`; add revoked-user concurrent read test |
| `getTpoPlacementTeam`, `getTpoTrustedCompanies` | Results checked against persisted TPO-or-College Admin placement-cell role and ACTIVE college at response boundary after multi-table async reads | Source exists in `tpo-settings-people-service.ts`; add database suspended-officer and wrong-college joins test |
| `getTpoMyNotifications` | Personal notification total/unread/filtered rows and saved preferences also require the same ACTIVE selected college and organization at late persisted TPO check | Existing personal-notification route/actor tests; add concurrent tenant archive test |
| `listTpoPrepCourseOptions` | Active department/course/offering catalog is reauthorized under persisted TPO and active college after results load | Source `tpo-prep-assignment-service.ts`, add PostgreSQL catalog/archive regression |
| `assignTpoPrepCourse` | Active tenant UPDATE lock, current TPO identity, actual active learner cohort, due-date recheck within transaction, set-based ON CONFLICT DO NOTHING; activity and notifications only for newly inserted assignments, accurate assigned/duplicate/skipped counts, retry creates no phantom events | Existing TPO assignment tests remain, add PostgreSQL concurrent duplicate and 0-new-assignments audit tests |
| `listOwnTpoPrepAssignments` | Learner-only college/courses facts, bounded to 100; persisted active LEARNER/college check after data reads | Add revocation-in-flight and historical archived-offering access test |

Owner directive honored: no CI re-run or repairs of old failing test list; these are implemented source changes with explicit remaining behavioral/DB coverage, not test-pass certification.

| `summarizeTpoPrepAssignment` — `tpo-prep-assignment-result-model.ts` | Pure authoritative `INSERT RETURNING` classifier preserves client-selected ordering and distinguishes new, already assigned and ineligible records without inventing work on retries | `tests/unit/chat11-tpo-prep-assignment-retry-receipts.test.ts`: PREP-ASSIGN-RETRY-01/02/03 happy/partial, duplicate retry, zero eligible/empty | API and PostgreSQL atomic insert/notices remain unexecuted |

| `assignTpoPrepCourse` due/target final safety | Target offering course and *cohort program* must both remain active and same-college; archived foreign target cohort prevented for catalog and write via `activeCollegeOfferingCohort`; late due timestamp checked in transaction; named DB constraint `tpo_prep_due_after_assigned_ck` maps to friendly `DUE_DATE_INVALID` if clock crosses insertion. | `tests/unit/chat11-tpo-prep-assignment-retry-receipts.test.ts` — PREP-ASSIGN-COHORT-04 source witness, PREP-ASSIGN-RETRY-01/02/03 pure behavior | Real PG clock-boundary and archive-race test pending |
| Pure settings, notice, team and trusted-company exports | `orderTpoSettingsSeasons`, `summarizeTpoSettingsSeasons`, `tpoSettingOrigin`, `formatTpoEligibilityThreshold`, `parseTpoRulesPageParams`, `parseTpoMyNotificationsParams`, `resolveTpoNotificationPreferences`, `safeTpoNotificationLabel`, `tpoNotificationReadStatus`, `tpoMyNotificationsHref`, `buildTpoTeamRoster`, `summarizeTpoTeam`, `buildTpoTrustedCompanies`, `buildTpoTrustedDomains` — sorting/counts, exact resource privacy, role dedupe, trust-domain explicitness, malformed pagination, default fallbacks | `tests/unit/chat11-tpo-settings-pure-model-coverage.test.ts` 8 cases; `chat11-tpo-settings-write-model-matrix.test.ts` six section/pref/CAS/prep-policy cases | CI intentionally deferred by owner |

## 2026-10-19 — personal team preferences: persisted role and retry proof

| Export / route | Behavioural evidence | Test | Remaining |
|---|---|---|---|
| `tpoTeamPreferenceActionSchema`, `planTpoThreadPreferenceChange` — `src/modules/placements/tpo-team-preference-state-model.ts` | Strict UUID/action, no caller-selected user or college, no default-row writes for FOLLOW/UNMUTE, MUTE retry preserves timestamp, independent following and muted state | `tests/unit/chat11-tpo-team-preferences-guard-and-retries.test.ts` — TPO-settings-audit-PREF-TEAM-01 | Real PostgreSQL two-session race and route/keyboard test |
| `getTpoTeamThreadPreferences`, `updateTpoTeamThreadPreferences` — `src/modules/placements/tpo-team-preferences-service.ts` | Persisted active TPO/College Admin team role rechecked *inside transaction* in addition to `placements.manage` permission, college/thread/membership exact scope, no-op returns before upsert | Same named test (pure behaviour and structural authorization assertion) | Real role-revocation in-flight, wrong-college thread, and exact activity/notification policy |

No Vitest, TypeScript, PostgreSQL or browser execution was performed. `TPO-settings-audit-23` remains OPEN: the `placement_jobs_employment_type_ck` database constraint admits only FULL_TIME/INTERNSHIP/CONTRACT, so the college-local custom catalogue is not yet an authoritative drive type, filter or reporting dimension. Do **not** label it DONE or pretend custom placed-counting policies affect offers until migration, historical-drive preservation, reporting and publish guards land together.

## Notices and custom job-type last-active UI — 2026-10-19

| ID | Export / UI | Source behaviour | Test | Unresolved |
|---|---|---|---|---|
| TPO-settings-audit-NOTICES-COUNT-02 | `tpoStudentNoticesOverview` | Source failure or invalid aggregate remains unavailable rather than displaying invented zero; exact count and lower-bound `hasMore` count keep `MAX_SAFE_INTEGER` safe. | `tests/unit/chat11-tpo-notice-count-integrity.test.ts` | Notice delivery/read receipt aggregation and provider status |
| TPO-settings-audit-23 (partial) | `TpoJobTypesEditor`, `setTpoJobTypeActive` | Client no longer disables the **last custom type** when built-ins remain active. Server is authoritative for the combined built-in+custom at-least-one-visible rule, CAS and college/role scope. | `tests/unit/chat11-tpo-job-type-last-custom-visibility.test.ts` | **OPEN**: custom type is not yet used by drive forms, eligibility filters, offers or reports; needs migration and historical typing before closure |

No test execution claimed. The job-type integration must not be marked DONE based on this narrower UI correction.
