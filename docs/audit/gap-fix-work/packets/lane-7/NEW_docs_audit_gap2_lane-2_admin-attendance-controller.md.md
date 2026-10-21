# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-attendance-controller.md

12 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-attendance-controller.md

## G2-2-009-010  [P1] GAP  facet F04  effort S
- Legacy: LC:242-249 record includes present,attendanceStatus,markedBy/Name,markedAt
- vNext now: NC:683-728 in-row read from SSR record and session; no on-demand GET /record
- Fix: On correction open refetch exact record state with server denial/error instead of relying on potentially stale grid.

## G2-2-009-022  [P1] GAP  facet F07  effort S
- Legacy: LC:221-227 absent repository returns 503 'Attendance data is temporarily unavailable'
- vNext now: NC:207-246 no live record request per click; page SSR only
- Fix: Add error state refusing correction when fresh marker record cannot be loaded.

## G2-2-009-038  [P1] GAP  facet F12  effort S
- Legacy: LF:22 isHeld excludes sessions not started, LF:192 click only held
- vNext now: NC:538-546 disables future sessions; NS:507-510 permits pre-session admin edits by API
- Fix: Align server to UI future-session policy, or explicitly approve pre-session corrections; prevent deep-link bypass.

## G2-2-009-039  [P1] MISSING  facet F13  effort S
- Legacy: LF:241-245 skeleton, error Retry record disables corrections
- vNext now: NC:621-741 Drawer uses cached target, no record loading state
- Fix: Add detail fetch skeleton/error and hard-disable correction until verified.

## G2-2-009-044  [P1] GAP  facet F14  effort S
- Legacy: LF:456-463 multi-session cell CSV n/m
- vNext now: NC:301-306 flattens multiple sessions slash of P/A/N instead of n/m
- Fix: Export aggregate attended/marked ratio identical to displayed legacy grid.

## G2-2-009-063  [P1] GAP  facet F23  effort S
- Legacy: LF:238-278 one modal with radio reason and loading/error states
- vNext now: NC:621-741 drawer, five direct buttons and no live record read
- Fix: Restore live record read/verification before allowing writes and exact modal UI.

## G2-2-009-020  [P2] GAP  facet F07  effort S
- Legacy: LC:113-125 exact invalid startDate/endDate and invalid interval errors
- vNext now: NP:51 'Unable to load attendance' generic invalid filters
- Fix: Show date-specific validation messages on any date-range client.

## G2-2-009-019  [P3] GAP  facet F07  effort S
- Legacy: LC:103,144,214,288,330 'collegeId must be a positive integer'
- vNext now: NP:42 missing scope state; NR:25-39 API errors
- Fix: Map invalid tenant scope to safe same error semantic.

## G2-2-009-021  [P3] GAP  facet F07  effort S
- Legacy: LC:291-294 exact invalid status reason error
- vNext now: NS:48-61 Zod enum unknown status; NR:38 error formatter
- Fix: Provide exact invalid reason error to admin.

## G2-2-009-023  [P3] GAP  facet F07  effort S
- Legacy: LC:318-320 Failed to mark absent, LC:350-352 Failed to mark present
- vNext now: NC:282-285 generic 'Attendance correction failed. Check your connection and retry.'
- Fix: Restore operation-specific failure copy.

## G2-2-009-024  [P3] GAP  facet F08  effort S
- Legacy: LC:311 'Marked absent', LC:343 'Marked present'
- vNext now: NC:278 'Attendance corrected for [student] — [session]'
- Fix: Keep action-specific success wording or document combined toast.

## G2-2-009-025  [P3] GAP  facet F08  effort S
- Legacy: LF:89 success `Attendance corrected for NAME — LABEL`
- vNext now: NC:278 nearly same with target.session.title (no time)
- Fix: Include chosen session timestamp in success acknowledgement.
