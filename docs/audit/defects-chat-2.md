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

## Test-contract repairs — not feature removals

Shared `Dialog`, `Input`, and `DataTable` components replaced hand-written dialog focus handlers, raw `<input>` tags, and duplicate mobile/desktop roster markup. Several older source-assertion tests demanded removed implementation details even though the new shared components implement the same controls. Their assertions now verify shared native modal focus/Escape restoration, accessible titles, responsive company row data, report metrics and read-only email behavior. No test case was deleted.

Files updated: `chat2-company-memory-gap-parity.test.ts`, `chat2-company-trust-and-navigation.test.ts`, `chat2-engage-open-gap-decisions.test.ts`, `chat2-tpo-lead-modal-source.test.ts`, `chat2-tpo-recruiter-leads-copy.test.ts`, `chat2-final-sprint-recruiter-profile-company.test.ts`.

## Outstanding validation / risk

- Cloud typecheck/unit suite, browser journeys, PostgreSQL fixtures and migration tests have **not run** in this connector-only workspace. The above are repository edits, not release certification.
- Full service/route/page function-by-function ledger remains incomplete; especially cross-writer races, DB rollback, notification dedupe, tenant/role matrix, public links and campaigns must be exercised before release.
- Other lane-owned generic entries included under the CI `chat-2` bucket require coordination; no tests were weakened or deleted.
