# Lane chat-18 cross-lane handoffs

- G2-5-012-095 | src/modules/placements/tpo-crm-service.ts | Add conflict-safe idempotency/version guard to moveTpoFollowup across browser tabs (currently dueAt update is guarded by doneAt IS NULL, but two simultaneous PATCH calls can both write/audit); client per-ID shared lock added to tpo-calendar-followup-actions.tsx.
- G2-17-023-021/022/024 | src/components/placements/learner-placement-offers.tsx | Read allowlisted response error code and trusted currentStatus and pass them to learnerOfferActionErrorMessage(status, code, currentStatus); currently only response.status is supplied. Preserve indistinguishable 404 for unauthorized access.
