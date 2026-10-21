# Lane chat-20 — cross-lane handoffs

- `src/modules/placements/tpo-drive-deadline-service.ts` and its client deadline-extension form | G2-2-016-091 | Consume `tpoDriveDeadlineErrorMessage(decision)` from `tpo-drive-deadline-model.ts` and return/render distinct actionable error messages instead of folding IN_PAST/NOT_LATER/INVALID_DATE into generic `PLACEMENT_JOB_INVALID_DEADLINE`. Keep existing permission/CAS safeguards.
- `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx` | G2-14-025-025 | Read the redirected `added=1` query value and render accessible success feedback (currently API returns count in JSON and redirect query; view does not surface it).
- `src/components/ui/toast.tsx` | G2-12-022-024 | Provide optional per-toast duration so unchanged-stage info can remain exactly 8 seconds; shared component currently chooses 4.5–15 s from reading length. Do not alter the provider from lane-20.
