# chat-11 — TPO settings and college setup export-by-export coverage

Scope: 21 settings, course preparation, private notices, team/company configuration, audit views and policy modules. Each row identifies a real exported function and a committed regression test; **source tests are not equivalent to PostgreSQL behavior**. Tests have not been run under the owner no-CI directive. Read `docs/audit/coverage/tpo-settings-ledger.md` for defects and database work still needed.

| Export (one function per row) | Contract / cases tested | Test evidence | Runtime gap |
|---|---|---|---|
| `getTpoPlacementSeasonSettings` | tenant TPO and live season list; late persisted role guard | `tests/unit/chat11-tpo-settings-route-surfaces.test.ts`; `chat11-tpo-settings-pure-model-coverage.test.ts` | Role revocation during season DB query |
| `getTpoPlacementRulesSettings` | same-college filtered jobs, pagination bound, current role before response | `tests/unit/chat11-tpo-rules-pagination-adversarial.test.ts` | Count/list snapshot consistency |
| `getTpoPlacementTeam` | active college TPO, coordinator role from assignment, row dedupe, late role | `tests/unit/chat11-tpo-people-read-adversarial.test.ts`; `chat11-tpo-settings-pure-model-coverage.test.ts` | PostgreSQL multi-tenant coordinator enrollment |
| `getTpoTrustedCompanies` | company trust cannot imply domain allowlist, role/college guards | `tests/unit/chat11-tpo-people-read-adversarial.test.ts`; `chat11-tpo-settings-pure-model-coverage.test.ts` | Archived company domain race |
| `getTpoCommunicationSettings` | private no-store fields and persisted role after college SHARE lock | `tests/unit/chat11-tpo-communication-read-revocation.test.ts` | DB session revoke/read race |
| `updateTpoCommunicationSettings` | strict section schema, active college, CAS and exact no-op, audit | `tests/unit/chat11-tpo-communication-adversarial.test.ts`; `chat11-tpo-settings-write-model-matrix.test.ts` | Parallel first write and same-token conflicting updates |
| `getTpoMyNotifications` | own-recipient and own-college events, bounded private fields, active tenant | `tests/unit/chat11-tpo-private-notifications-revocation.test.ts` | PostgreSQL simultaneous membership removal |
| `saveMyTpoNotificationPreferences` | exact TPO role, caller cannot choose user/college, CAS, idempotent no-audit retry | `tests/unit/chat11-tpo-preferences-write-adversarial.test.ts`; `chat11-tpo-settings-write-model-matrix.test.ts` | Real concurrent two-device update |
| `listTpoPrepCourseOptions` | ACTIVE offering/course, non-archived department, correct cohort hierarchy, persisted TPO | `tests/unit/chat11-tpo-prep-assignment-retry-receipts.test.ts` PREP-ASSIGN-COHORT-04 | Archived academic hierarchy in PG |
| `assignTpoPrepCourse` | up to 100 unique students, active college/cohort, due-date, atomic insert, new-only notice/activity | `tests/unit/chat11-tpo-prep-assignment-retry-receipts.test.ts` | Concurrent duplicates, activity dedupe and FK rollback |
| `listOwnTpoPrepAssignments` | self active learner/current college, bounded 100, late role check | `tests/unit/chat11-tpo-prep-scope-adversarial.test.ts` | Suspended learner during slow query |
| `summarizeTpoPrepAssignment` | partial success, zero-new retry, ineligible and empty receipt, stable selection order | `tests/unit/chat11-tpo-prep-assignment-retry-receipts.test.ts` PREP-ASSIGN-RETRY-01/02/03 | Pure model behavior authored, not run |
| `readTpoLearnerPrepOutcomes` | learner/cohort enrolled pair, published active content, no fabricated readiness, final TPO permission | `tests/unit/chat11-tpo-prep-long-read-role-revocation.test.ts`; `chat11-final-TPO-settings-audit-41.test.ts` | Real PG 5000 learners and revocation |
| `setTpoPrepReadiness` | strict scoped/active course UUIDs, CAS, durable policy and audit | `tests/unit/chat11-tpo-prep-write-adversarial.test.ts` | Direct archived-course mutation |
| `getTpoJobTypes` | filtered college job types, no foreign row, current role before response | `tests/unit/chat11-tpo-settings-config-read-revocation.test.ts` | PG read archive race |
| `getTpoBlockedDates` | private college calendar, no foreign date, active college read | `tests/unit/chat11-tpo-settings-config-read-revocation.test.ts` | PG active/archived race |
| `getTpoPrepReadiness` | returns explicit stored config or truthful unavailable, no GET write | `tests/unit/chat11-tpo-settings-config-read-revocation.test.ts` | PG old migration missing-table |
| `listTpoPrepCourses` | only active courses under non-archived same-college departments | `tests/unit/chat11-tpo-prep-archived-catalog.test.ts` | PG archived parent |
| `createTpoJobType` | exact college scoped create, builtin reserved, unique/cap, active tenant and audit | `tests/unit/chat11-tpo-job-type-archived-college.test.ts` | Job/drive/report consumption pending |
| `setTpoJobTypeActive` | active custom only, no last active disabled, CAS retry | `tests/unit/chat11-tpo-job-type-cas-retries.test.ts` | Double-submit PG race |
| `renameTpoJobType` | duplicate label and stale token; builtin protected, college scope | `tests/unit/chat11-tpo-job-type-transaction-authorization.test.ts` | PG concurrent names |
| `setTpoBuiltinJobTypeActive` | 5 builtin defaults and persisted overrides, last active rule, role/tenant scope | `tests/unit/chat11-tpo-job-type-archived-college.test.ts` | Cross-table usage and selection |
| `setTpoJobTypeCountsAsPlaced` | only custom, immutable builtins, CAS/audit | `tests/unit/chat11-tpo-job-type-transaction-authorization.test.ts` | Report and placed-outcome recomputation |
| `createBlockedDate` | range 90 days, future-only, no duplicates, current TPO permission, audit | `tests/unit/chat11-tpo-blocked-date-transaction-auth.test.ts` | PG duplicate overlapping ranges |
| `deleteBlockedDate` | exact scoped date, expectedVersion CAS, event | `tests/unit/chat11-tpo-settings-archived-college-safety.test.ts` | Concurrent archive/removal |
| `removeBlockedRange` | exact count, all matching stored row versions, atomic multi-delete | `tests/unit/chat11-tpo-settings-archived-college-safety.test.ts` | Real row lock and failure rollback |
| `readTpoOutcomeLabels` | validated custom label entries only, private scoped current role | `tests/unit/chat11-tpo-settings-archived-college-safety.test.ts` | Corrupt stored JSON handling |
| `saveTpoOutcomeLabels` | builtin name reserved, duplicate names, current-role, CAS, no-op retry/audit | `tests/unit/chat11-tpo-outcome-labels-adversarial.test.ts` | Concurrent two admins |
| `listTpoAuditSavedViews` | server-persisted AUDIT scope, exact college+actor, pin and recency | `tests/unit/chat11-final-TPO-settings-audit-R04.test.ts` | Cross-device PG/browser |
| `changeTpoAuditSavedView` | create/rename/pin/open/delete, 12 total/5 pinned, current TPO, stale revision and audit | `tests/unit/chat11-tpo-audit-saved-view-route.test.ts` | Parallel cross-device edit |
| `changeTpoSeason` | season active/closed transition and latest optimistic version | `tests/unit/chat11-tpo-settings-route-boundary.test.ts` | PG season change and double-submit |
| `changeTpoRules` | constrained placed-offer event, confirmed CAS and audit | `tests/unit/chat11-final-TPO-settings-audit-11.test.ts` | Downstream offer dashboard recompute |
| `getTpoPlacementBranding` | correctly scoped/read-only persisted brand settings | `tests/unit/chat11-tpo-settings-route-surfaces.test.ts` | Public branding URL lifecycle |

## Pure configuration and notification model functions

| Export | Direct behavioral witness | Test |
|---|---|---|
| `orderTpoSettingsSeasons` | ACTIVE first, stable ordered, input unchanged | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `summarizeTpoSettingsSeasons` | ACTIVE/CLOSED count including empty | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `tpoSettingOrigin` | SOURCE_DEFAULT vs PERSISTED | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `formatTpoEligibilityThreshold` | numeric hundredths and null | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `parseTpoRulesPageParams` | canonical bounded scalar decimal only | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `parseTpoMyNotificationsParams` | strict view/page/size, no repeated/foreign keys | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `resolveTpoNotificationPreferences` | UNAVAILABLE vs default vs recorded copy | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `safeTpoNotificationLabel` | fixed enum names, no free-text leaks | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `tpoNotificationReadStatus` | null unread and date read | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `tpoMyNotificationsHref` | canonical saved filters links | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `buildTpoTeamRoster` | current active-role only, no fictitious coordinator | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `summarizeTpoTeam` | distinct role and dated-duties counts | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `buildTpoTrustedCompanies` | sorted explicit company flags | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `buildTpoTrustedDomains` | explicit dated allowlist, normalize/deduplicate | `chat11-tpo-settings-pure-model-coverage.test.ts` |
| `tpoCommunicationChanges` | 5 discriminated update sections | `chat11-tpo-settings-write-model-matrix.test.ts` |
| `tpoCommunicationUpdateAlreadyApplied` | exact section equality, changed field rejects | `chat11-tpo-settings-write-model-matrix.test.ts` |
| `tpoNotificationPreferenceValues` | caller version removed, exact flags | `chat11-tpo-settings-write-model-matrix.test.ts` |
| `tpoNotificationPreferencesMatch` | all five switches compared | `chat11-tpo-settings-write-model-matrix.test.ts` |
| `tpoPrepReadinessSamePolicy` | equal policy accepts, reordered/changed rejects | `chat11-tpo-settings-write-model-matrix.test.ts` |

## API and page group remainder

Existing per-handler cases cover `/api/placements/tpo/settings/...` via `tests/unit/chat11-tpo-settings-route-boundary.test.ts`, `chat11-tpo-communication-route-adversarial.test.ts`, `chat11-tpo-preferences-http-security.test.ts`, and `chat11-tpo-audit-saved-view-route.test.ts`. However this is **not** yet a complete route-by-route PostgreSQL authentication/no-write matrix, or a page-by-page phone/loading/error coverage matrix. Do not interpret the table as a CI pass or complete ledger certification.
