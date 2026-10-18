# Chat-2 CI failure triage — 18 October 2026

Branch: `chatgpt/chat-2-b`; base incorporated: `main@b656dc0144f684780c1ed8055f1dec95a023007b`.

This is source-level assessment of `docs/orchestrator/unit-failures-latest.md` (CI `ff6819dd` / cloud `698eb9dd`) and `docs/orchestrator/typecheck-errors-latest.md` (CI `834983cc`). It does **not** assert Vitest/TypeScript execution or CI-green after the fixes. The main typecheck report states production typecheck PASS and lint PASS; remaining test-file TypeScript errors are in other lanes' files.

| Reported test | Action and evidence | Verification gate |
| --- | --- | --- |
| `chat2-ledger-campaign-public-link-and-settings` — dispatch provider readiness | FIXED stale source-string expectation: actual `tpo-campaign-dispatch-service.ts` uses `readZeptoMailConfig` and checks nonempty token, HTTPS endpoint, distinct OTP template, and explicit `TPO_CAMPAIGNS_READY===VERIFIED`; stronger named check preserves behavior. | Run unit test and fake-provider integration |
| `chat2-tpo-round-contracts-break-11` — single result | FIXED malformed fixture: `stagePlacementRoundResultInputSchema` requires a candidate message on non-PASS result, so an explained FAIL is legitimate and an unexplained FAIL is invalid. | Unit + transactional staging |
| `HR-BREAK-authorization-01` — live recruiter policy | FIXED test fixture that omitted user/recruiter identity. Real source requires matching `recruiter.userId === context.user.id` and central `can`; added impersonation case. | Unit + persisted grant revocation integration |
| `HR-BREAK-authorization-01` — wrong relationship/college | Same typed fixture fix; source checks matching grant before invoking central permission. | Unit |
| `PROJ-BREAK-SA-admin-pages-and-scope` — dynamic project IDs | SOURCE RECHECKED: `admin-project-section-page.tsx` and `project-workspace-readiness.tsx` delegate to `requireProjectManageAccess`; template subview validates UUID and calls `getSuperAdminTemplateSubview`; access scope contains college+organization checks. No speculative test edit. | Unit + actual route sessions |
| `PROJ-BREAK-SA-state-matrix-and-queries` — duplicate query keys | SOURCE RECHECKED: all three query parsers reject any array-valued input before query; project parser also refuses contradictory legacy/new search aliases. No speculative test edit. | Unit |
| `PROJ-BREAK-SA-unsubmitted-search` — literal SQL search | SOURCE RECHECKED: three `adminUnsubmittedLiteralSearchPattern(query.q??"")` sites, each with UUID ILIKE and selected-college predicate. No speculative test edit. | Unit + PostgreSQL wildcard test |
| `PROJ-BREAK-TPO-01` — self-reported portfolio | SOURCE RECHECKED: `tpo-students-spreadsheet.tsx` says profile projects are not verified workspace outcomes, page warns about released grades, model counts learner-owned profile entries and masks phone. No speculative test edit. | Unit |
| `UX-teach-courses-coverage-01` | SOURCE RECHECKED: route has scoped context, legacy `My Teaching Courses` heading; existing assertion appears synchronized. | Unit |
| `UX-teacher-courses-deliveryid-discussions-coverage-01` | SOURCE RECHECKED: server context and `Faculty · Course` / `Discussions` header intact. | Unit |
| `UX-teacher-courses-deliveryid-students-coverage-01` | SOURCE RECHECKED: missing IDs notFound, scoped redirect, context and `Students` heading intact. | Unit |
| `UX-teacher-notifications-coverage-01` | SOURCE RECHECKED: context, `Notifications` heading and alert role intact. | Unit |
| `UX-teacher-profile-coverage-01` | SOURCE RECHECKED: context, `Profile` heading, shortcut nav label intact. | Unit |
| `ux-admin-first-third` — colleges directory | FIXED stale empty-state expectation: page intentionally distinguishes unfiltered no-active-colleges from filtered no-match; updated test to assert conditional directly. | Unit |

Further chat-2 coverage authored on this branch: `tests/unit/chat2-interview-reschedule-security.test.ts`, `chat2-tpo-interview-round-slot-ledger.test.ts`, `chat2-tpo-people-settings-ledger.test.ts`, `chat2-tpo-last-third-auth-matrix.test.ts`. Fixed service defects: credential-bearing/insecure reschedule meeting links, unbounded rescheduling durations, and stale bulk room assignments overwriting booked interview slot state without a version compare.

**Open/release blockers:** run cloud unit/typecheck and PostgreSQL integration; resolve any freshly reported failures; exhaustively exercise all interview/round/slot write services, simultaneous writers, all 42 TPO last-third pages' browser loading/empty/error/partial/denied/mobile states, provider-side campaign dispatch/retries and public link races. No claims of complete ledger, zero failures, or deploy readiness.
