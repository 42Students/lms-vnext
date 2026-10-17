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
| TPO-requests-verification-17 | DONE | `tpo/requests/page.tsx`: legacy subtitle, waiting status and empty copy; `tests/unit/chat12-tpo-requests-verification.test.ts` — `TPO-requests-verification-17` |

| TPO-requests-verification-25 | DONE | Sequential review and progress in `TpoVerificationPanel.tsx`; `tests/unit/chat12-tpo-verification-workflows.test.ts` — `TPO-requests-verification-25` |
| TPO-requests-verification-28 | DONE | TPO review outcome feedback; `tests/unit/chat12-tpo-verification-workflows.test.ts` — `TPO-requests-verification-28` |

TPO-requests-verification-25: sequential review uses an immutable page snapshot so refetching after each decision never skips the next student; same named test covers the edge case.\n