# Chat-2 defect log — TPO journeys, placement rounds/interviews and campaigns

Scope: lane chat-2, branch `chatgpt/chat-2-b`. Severity reflects exposure if the affected helper is reached with hostile or malformed data. All fixes below are in this lane branch; cloud CI / database integration status **not yet verified**.

| ID | Severity | Gap | Defect and adversarial evidence | Fix commit | Regression test |
| --- | --- | --- | --- | --- | --- |
| CH2-001 | High | TPO-drive-workspace-44 | Exported `planInterviewDay` relied on upstream schema: a direct caller could supply huge slot counts, negative duration, or padded duplicate room names; massive allocation and double-booking risk. | `03708d0`, `52ba525` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts`: TPO-BREAK-interview-01 |
| CH2-002 | High | TPO-drive-workspace-44 | `overlappingInterviewVenue` used arithmetic comparisons that return false for NaN/invalid dates, incorrectly reporting a requested venue conflict as safe. | `a3f0882` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` |
| CH2-003 | Medium | TPO-campaigns-public-12 | Campaign template-key validation admitted sentinel `__invalid__` and arbitrary leading/trailing separators, undermining controlled-template intent. | `32d7597` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` |
| CH2-004 | High | TPO-drive-workspace-40 | Round result summarizer accepted inherited object keys (e.g. `toString`, `constructor`) using `in`, corrupting a verified outcomes-only report. | `ad92600` | `tests/unit/chat2-tpo-round-state-break-01.test.ts`: TPO-BREAK-round-01 |
| CH2-005 | Medium | TPO-drive-workspace-37 | Reorder helper coerced non-integer indices and operated ambiguously with duplicate round IDs. | `9c63441` | `tests/unit/chat2-tpo-round-state-break-01.test.ts` |
| CH2-006 | Low | TPO-campaigns-public-16 | Retryable unsubscribe failures were visible but not explicitly announced as an accessible alert. | `2790108` | `tests/unit/chat2-unsubscribe-graceful.test.ts` |
| CH2-007 | Low | TPO-inbox-team-49 | External announcement links omitted explicit `rel="noopener noreferrer"`, weakening link hardening and parity with safe outbound link contract. | `196af11` | `tests/unit/tpo-notice-safe-links-chat2.test.ts` |

| CH2-008 | High | TPO-settings-audit-55 | Same-millisecond updates could leave the exact same `updated_at` CAS token in communication settings; repeated stale tab edits might overwrite data. | `faa3c1a` | `tests/integration/chat2-tpo-settings-cas-db.test.ts` |
| CH2-009 | Critical | TPO-settings-audit-55 | Public join link REPLACE blindly rotated any newer link from an old browser tab (the form lacked optimistic identity); old-tab toggle could also disable a new link. | `34d4357`, `1d04eb7`, `bedb067`, `e0c3e06` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts`, `chat2-tpo-settings-people-break-01.test.ts` |
| CH2-010 | Medium | TPO-settings-audit-55 | Repeating identical enable/disable toggles wrote duplicate activity events; public link UI had no synchronous in-flight lock. | `a5067b2`, `32a1ba6` | New link identity and status contract tests; browser double-click test still required |
| CH2-011 | High | TPO-campaigns-public-12 | Draft signing used only an older secret alias while dispatch used the canonical secret with fallback, leading to inconsistent readiness/configuration. | `1482326` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` |
| CH2-012 | Medium | TPO-drive-workspace-44 | Slot creation/clearing and unassigned room changes/cancellations were persistent mutations without their own audit events. | `f14d201` | Source regression only; DB service integration still required |
| CH2-013 | High | TPO-drive-workspace-44 | Room collision comparisons were inconsistent across create, room-assignment and roll-range assignment. Whitespace/case/compatibility Unicode could split a logical room. | `d1ae6c6`, `9cdf249` | `tests/unit/chat2-tpo-interview-plan-break-01.test.ts` and slot DB constraints |

| CH2-014 | High | TPO-campaigns-public-16 | GET unsubscribe token preview used the old HMAC alias while POST/dispatch used canonical resolver, so a valid canonical-key campaign unsubscribe link was shown as invalid before confirmation. | `a7e17a9` | `tests/unit/chat2-unsubscribe-graceful.test.ts` (+ preview source contract pending) |
| CH2-015 | Medium | TPO-drive-workspace-44 | Interview readiness model included CANCELLED interviews and accepted NaN/noninteger windows or invalid durations, risking invented upcoming/active sessions. | `285abe3` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` |
| CH2-016 | Medium | TPO-drive-workspace-40 | Round facts status displayed inherited JS prototype members for unexpected persisted status strings. | `fd4d3f9` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` |
| CH2-017 | High | TPO-drive-workspace-40/41 | Drive Day projections counted duplicated roster application IDs or overwrote conflicting details; bulk pasted tokens could allocate unboundedly when bypassing UI limits. | `55e45f4`, `2cab016` | `tests/unit/chat2-tpo-round-model-break-02.test.ts` |

## Test-contract repairs — not feature removals

Shared `Dialog`, `Input`, and `DataTable` components replaced hand-written dialog focus handlers, raw `<input>` tags, and duplicate mobile/desktop roster markup. Several older source-assertion tests demanded removed implementation details even though the new shared components implement the same controls. Their assertions now verify shared native modal focus/Escape restoration, accessible titles, responsive company row data, report metrics and read-only email behavior. No test case was deleted.

Files updated: `chat2-company-memory-gap-parity.test.ts`, `chat2-company-trust-and-navigation.test.ts`, `chat2-engage-open-gap-decisions.test.ts`, `chat2-tpo-lead-modal-source.test.ts`, `chat2-tpo-recruiter-leads-copy.test.ts`, `chat2-final-sprint-recruiter-profile-company.test.ts`.

## Outstanding validation / risk

- Cloud typecheck/unit suite, browser journeys, PostgreSQL fixtures and migration tests have **not run** in this connector-only workspace. The above are repository edits, not release certification.
- Exported-function ledgers now exist under `docs/audit/coverage/placements-interviews-rounds-slots-chat2-ledger.md` and `docs/audit/coverage/tpo-campaigns-public-links-settings-people-chat2-ledger.md`, but their many explicit GAP/PARTIAL rows still require direct behavioral and cross-writer integration coverage.
- Other lane-owned generic entries included under the CI `chat-2` bucket require coordination; no tests were weakened or deleted.

## Additional Pass B defects (October 18)

| ID | Severity | Gap | Defect | Fix | Test |
| --- | --- | --- | --- | --- | --- |
| CH2-018 | Medium | TPO-drive-workspace-40 | UI and CSV waitlist rank input accepted scientific/hex notation through `Number(...)`, giving unintended ranks despite precise integer-only college workflows. | `7e5d555`, `07aad2d` | `chat2-ledger-round-import-and-scheduling.test.ts`, `chat2-tpo-round-csv-and-lifecycle-break-03.test.ts` |
| CH2-019 | Medium | TPO-drive-workspace-44 | Live interview countdown accepted NaN, infinite and fractional duration when helper called outside UI validation; unreliable remaining time rendered. | `8362d3f`, `5bf0bf0` | `chat2-tpo-round-csv-and-lifecycle-break-03.test.ts` |
| CH2-020 | High | PROJ-BREAK-TPO-01 | Project member read authorization checked persisted college but omitted the organization dimension of the actor membership; a malformed same-college/wrong-org context was not explicitly rejected. | `605923fd`, `7d9b13d` | `PROJ-BREAK-TPO-01.test.ts` and `PROJ-BREAK-TPO-ROLE-01.test.ts` |

**Caveat:** The suite is authored and pushed; cloud CI and PostgreSQL verification remain pending. The full all-export inventory contains explicit uncovered service functions that remain release work, not fabricated green coverage.

### Additional security defect

| ID | Severity | Gap | Defect | Fix commits | Test |
| --- | --- | --- | --- | --- | --- |
| CH2-021 | High | TPO-drive-workspace-42 | Whole-round application caught arbitrary service/SQL errors and returned their raw `error.message` in the learner-by-learner report. A simulated database error could disclose internal constraints or secrets. | `a0ccf528`, `4f2fbf0` | `tests/unit/chat2-tpo-round-state-break-01.test.ts`: TPO-BREAK-round-42 (pure error mapping); service integration still required |

## TPO access and status parameter hardening

| ID | Severity | Gap | Defect | Fix commit | Test |
| --- | --- | --- | --- | --- | --- |
| CH2-022 | Medium | TPO-settings-audit-55 | Public join-link status GET silently selected first `scope` or `companyId` and ignored injected `collegeId`; ambiguous URLs could mask attempted tenant-selector spoofing. Explicit single-scope and allowed-key enforcement now rejects these with 400 before identity lookup. | `c1ef04f` | `chat2-tpo-public-link-route-journeys-break-05.test.ts` |
| CH2-023 | Medium | TPO-settings-audit-55 | Recruiter college-grant directory previously accepted duplicated status/page filters by silently choosing the first. The merged shared `parseTpoRecruiterAccessParams` model on `main` now rejects duplicated/foreign selectors, with actionable invalid-filter recovery. | Shared model on `main`; reconciliation `ce039fe`; behavioral test `f2a4736` | `chat2-tpo-public-link-settings.test.ts` |

No CI green or database-side multi-session verification is claimed for these authored tests.

| CH2-024 | High | TPO-drive-workspace-40 | Result-import roster queries used last-write-wins `Map(applicationId,row)` on joined results: contradictory current results, emails or rolls could silently select a learner's arbitrary evidence before staging. Duplicate identical evidence is now deduplicated; conflicting evidence is excluded and not auto-staged. | `5089a4a`, `ed95eb8` | `chat2-ledger-round-import-and-scheduling.test.ts` (CI pending) |

## Additional Pass B defects (2026-10-18; pending full CI / database review)

| ID | Severity | Gap | Defect and evidence | Fix commit | Regression evidence |
| --- | --- | --- | --- | --- | --- |
| CH2-018 | High | TPO-drive-workspace-44 | Moving an assigned interview updated an individual override only if that override existed already; a first-time booking has no override, leaving the learner calendar at the old round time after a move. Slot mutations now upsert the per-learner schedule in the same transaction. | `4c8d78a` | `tests/unit/chat2-interview-transaction-contracts.test.ts`: source contract for learner override upsert |
| CH2-019 | Medium | TPO-drive-workspace-44 | Bulk roll-range room reassignment updated booked slot rooms but failed to synchronize existing learner-specific override venues. | `4c8d78a` | Same transaction source contract; PostgreSQL rollback test still required |
| CH2-020 | High | TPO-drive-workspace-42 | Whole-round approval compared the snapshot before iterating, but each subsequent result could be restaged by another actor before application; result service could apply a revised outcome that the TPO never reviewed. Optional per-row result version CAS now rechecks before and after locked read. | `d311bbc`, `db06e75` | `chat2-interview-transaction-contracts.test.ts`, existing snapshot identity tests |
| CH2-021 | Medium | TPO-drive-workspace-40/42 | Result import/whole-round approval schemas accepted any 64-character string as a supposed SHA-256 preview fingerprint. Now require canonical lowercase hex digest. | `9a61653`, `e1c71be` | `chat2-round-import-calendar-roster-hardening.test.ts`, `chat2-round-interview-boundary-hardening.test.ts` |
| CH2-022 | Medium | TPO-drive-workspace-44 | Venue-overlap helper failed to reject an existing or requested interview whose duration exceeded the supported 1440-minute limit. Such corrupt evidence must fail closed. | `5ffc911`, `5be2038` | `chat2-round-import-calendar-roster-hardening.test.ts` |

## TPO report and settings write-boundary findings (2026-10-18)

| ID | Severity | Gap | Defect and remedy | Commit(s) | Regression evidence |
| --- | --- | --- | --- | --- | --- |
| CH2-023 | Medium | UX-tpo-reports-company-01 | Visible-company CSV export used `URLSearchParams.get()` and silently accepted repeated selectors while the on-screen report rejects array-valued filters. Added repeated-param denial before workspace read; no guessing first value. | `7ef2cd2`, `b0b0cd3` | `tests/unit/chat2-tpo-company-report-security.test.ts` |
| CH2-024 | High | TPO-campaigns-public-12 | Recipient planner deduplicated email only, not CRM lead identity; the same lead with different address evidence could be included twice. Snapshot matching checked only live consent, not historical unsubscribed/bounced/not-now evidence. Both now fail closed. | `2f32dd4`, `9109b92`, `ccb79d6` | `tests/unit/chat2-campaign-recipient-snapshot-boundaries.test.ts` |
| CH2-025 | Medium | TPO-settings-audit-55 | CAS version schema accepted offset-aware ISO dates but the service compared against UTC `.toISOString()`, rejecting an equivalent token in IST. Normalize validated timestamps at Zod boundary. | `1fd83f6`, `6aef78d` | `tests/unit/chat2-settings-people-trusted-links-cas.test.ts` |
| CH2-026 | Medium | TPO-settings-audit-55 | Public join-link create/toggle and recruiter grant POST routes called unbounded `request.json()`. Reused existing 8192-byte streaming JSON boundary; same-origin remains first, mapping 400/413 without raw internals. | `4345d87`, `eaa2410`, `2ccdc26` | `tests/unit/chat2-tpo-public-link-bounded-json.test.ts` |
