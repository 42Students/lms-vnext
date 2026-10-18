# Chat-6 Projects breaker findings — IIT Dharwad

Scope: adversarial client and permission review. This is a supplemental lane defect record; `docs/audit/projects-defects.md` remains owned by chat-14.

| ID | Severity | Defect and evidence | Fix | Validation remaining |
|---|---|---|---|---|
| PROJ-BREAK-resilience-16 | S2 | Final delivery save, submit and project evaluation previously displayed arbitrary `Error.message`; when a dependency rejects unexpectedly, developer/provider text could appear to the user. Submit callback could also act after a later readiness change while a confirmation was already open. | `src/components/projects/project-final-delivery-controls.tsx`: show only shared friendly network/API errors or two explicit local recovery messages; recheck `canSubmitDraft` for both click and confirmation. | Behavioural browser probes for unexpected throws, expired session, stale-tab submit and unready project |
| PROJ-BREAK-reviews-17 | S2 | Review action used React `pending` state alone. Two rapid confirmation events before rerender could dispatch duplicate review mutations. | Added synchronous `reviewInFlight` ref lock, reset in `finally` on success and failure. | Authenticated double-click/slow-network role journey and persisted notification dedupe |
| PROJ-BREAK-evaluation-18 | S2 | Scoring form checked validation but not an in-flight ref; parallel submits could duplicate evaluation requests before React disabled the button. | Added synchronous `evaluationInFlight` lock, reset in `finally`, retaining all entered rubric rows after failure. | PostgreSQL same-submission race and rubric uniqueness rollback test |
| SA-academics-people-101 | S2 | Batch Super Admin faculty assignments could fetch foreign delivery/faculty identities before checking a selected platform-admin scope, and permit stale actor roles from an earlier request context. | `src/modules/courses/teaching-assignment-batch-service.ts` now verifies the exact selected admin college before lookups, locks sorted delivery rows, rechecks tenant/section/period/faculty membership and persisted platform permission inside one transaction. | Real multi-admin, cross-college and revoke-while-saving integration checks |

Behaviour and source-contract coverage authored: `tests/unit/chat6-proj-break-final-delivery-errors-16.test.ts` (approved errors, raw-throw redaction, session/conflict/outage), `tests/unit/chat6-proj-break-final-delivery-flight-17-18.test.ts` (synchronous lock placement, finally release, editable rubric preservation). These are pending the owner's consolidated test gate; no local execution claimed.

Source code authored; owner priority postpones CI, browser and database execution until the final consolidated gate. Do not treat these findings as runtime-certified.
