# Lane chat-20 — cross-lane handoffs

- `src/modules/placements/tpo-drive-deadline-service.ts` and its client deadline-extension form | G2-2-016-091 | Consume `tpoDriveDeadlineErrorMessage(decision)` from `tpo-drive-deadline-model.ts` and return/render distinct actionable error messages instead of folding IN_PAST/NOT_LATER/INVALID_DATE into generic `PLACEMENT_JOB_INVALID_DEADLINE`. Keep existing permission/CAS safeguards.
