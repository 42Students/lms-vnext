# TPO / Requests and Verification — chat-12 verification

Base source `main` at `a56fd84fdbe4e2c9bc11758b290d1f1845cac991`. These are authored, unrun tests; orchestrator execution is required for final acceptance.

| ID | Status | Evidence (source; test name contains gap ID) |
|---|---|---|
| TPO-requests-verification-02 | DONE | `src/components/placements/tpo-request-decision-control.tsx`, `src/modules/placements/tpo-request-decision-copy.ts`; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-02` |
| TPO-requests-verification-03 | DONE | `tpo-request-decision-control.tsx`: reason chips, disabled invalid reject, exact toast; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-03` |
| TPO-requests-verification-04 | DONE | `src/modules/placements/request-service.ts`: learner notification in decision transaction; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-04` |
| TPO-requests-verification-09 | DONE | `src/app/(authenticated)/tpo/requests/page.tsx`: roll, branch, after college and placed; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-09` |
| TPO-requests-verification-10 | DONE | `src/app/(authenticated)/tpo/requests/page.tsx`: decision actor, date, reason; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-10` |
| TPO-requests-verification-14 | DONE | `tpo/requests/page.tsx`, `src/components/tpo/tpo-student-nudge-panel.tsx`: targeted request messsaging; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-14` |
| TPO-requests-verification-17 | PARTIAL (legacy period tabs still require implementation) | `tpo/requests/page.tsx`: legacy subtitle, waiting status and empty copy; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-17` |

| TPO-requests-verification-25 | DONE | Sequential review and progress in `TpoVerificationPanel.tsx`; `tests/unit/chat12-tpo-verification-workflows.test.ts` — `TPO-requests-verification-25` |
| TPO-requests-verification-28 | DONE | TPO review outcome feedback; `tests/unit/chat12-tpo-verification-workflows.test.ts` — `TPO-requests-verification-28` |

TPO-requests-verification-25: sequential review uses an immutable page snapshot so refetching after each decision never skips the next student; same named test covers the edge case.
TPO-requests-verification-28: result toast now includes the verified section (Education or Identity).

| TPO-requests-verification-22 | OPEN (partial implementation) | Student roll, per-section marksheet counts, attention and decided actor/reason on authorized queue; `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-22` |
| TPO-requests-verification-23 | DONE | College-wide grouped counts independent of page size, oldest Waiting first, counts rendered in tab; `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-23` |
| TPO-requests-verification-24 | OPEN (partial implementation) | Server scoped filters and updates-to-verified-details shortcut; `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-24` |
| TPO-requests-verification-26 | OPEN (partial implementation) | Tenant-checked bulk verify/send-back with proof and reason guard (intentional 20-row safety cap); `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-26` |
| TPO-requests-verification-29 | OPEN (partial implementation) | Drawer history, education table, private document links, roll, and masked-number explanation; `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-29` |
| TPO-requests-verification-30 | DONE | Existing notification-copy used by profile-verification transaction writer; exact legacy learner text; `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-30` |
| TPO-requests-verification-32 | DONE | Registered TPO export route covers Waiting/Sent back/Verified with authorized page iteration; `tests/unit/chat12-verification-round2.test.ts` test `TPO-requests-verification-32` |

| TPO-requests-verification-18 | DONE | Requests page now has loading, recoverable friendly error screen and Retry; `tests/unit/chat12-graceful-tpo.test.ts` test `TPO-requests-verification-18` |

| TPO-requests-verification-15 | DONE | CSV deliberately bounded at 5,000 authorized filtered requests (owner-approved safer vNext design); reason, what asked and decision, formula escaped; `tests/unit/chat12-tpo-journey-export.test.ts` test `TPO-requests-verification-15` |

TPO-requests-verification-15 / -32: exports use guarded downloads, so HTML or JSON failures cannot be downloaded as CSV. `tests/unit/chat12-tpo-safe-export.test.ts` tests contain both IDs.

**Source-only partials remain OPEN:** TPO-requests-verification-22 (full grid/saved views), 24 (server-side proof filter and all shortcuts), 26 (bulk whole-view parity), 29 (full inline changed-values and private proof parity). The tests cover only the documented implemented subset.

| TPO-requests-verification-R01 | DONE | TPO approval of withdrawal declines ISSUED offers transactionally, with durable offer status-history, while still refusing ACCEPTED placements; creation also permits ISSUED; `tests/unit/chat12-offer-withdrawal.test.ts` tests contain `TPO-requests-verification-R01` (PostgreSQL acceptance not run) |

TPO-requests-verification-R01: decision dialog maps the known placed-offer refusal to exact legacy guidance without displaying the backend error code; the form remains open. Same named test covers the message.

| TPO-requests-verification-02 | DONE (friendly-error adoption; other audit subitems remain as previously recorded) | decision modal uses friendlyApiError through apiFetch and retains input on failure; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `TPO-requests-verification-02` |
| TPO-requests-verification-03 | DONE (friendly-error adoption; other audit subitems remain as previously recorded) | rejection reason retained with user-friendly network and conflict failures; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `TPO-requests-verification-03` |
| TPO-requests-verification-R01 | DONE (friendly-error adoption; other audit subitems remain as previously recorded) | known accepted-offer refusal retains exact legacy instruction without showing raw code; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `TPO-requests-verification-R01` |
| TPO-requests-verification-25 | DONE (friendly-error adoption; other audit subitems remain as previously recorded) | verification drawer read/decide uses guarded JSON and safe 409 reload; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `TPO-requests-verification-25` |
| TPO-requests-verification-28 | DONE (friendly-error adoption; other audit subitems remain as previously recorded) | verification failure never exposes a raw server code; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `TPO-requests-verification-28` |
| TPO-requests-verification-29 | DONE (friendly-error adoption; other audit subitems remain as previously recorded) | protected private review detail fetch has guarded HTML and network failures; `tests/unit/chat12-round3-requests-api-fetch.test.ts` named test `TPO-requests-verification-29` |
