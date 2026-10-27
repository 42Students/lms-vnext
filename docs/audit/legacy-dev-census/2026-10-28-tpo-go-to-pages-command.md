# TPO palette page command and paginated bulk-selection follow-up (2026-10-28)

**Source behavior closure increment only; no Implementation Green without executed tests.** The legacy `42Students/lms2-fe@9d56bb7a347b06f242ef615c19fdc298f83329e0` command palette explicitly uses `go to <page>` to show only Pages results (TpoCommandPalette.jsx lines 8–14, 42, 61–65). The vNext global topbar previously treated those terms as record search and normal navigation label text, with no explicit go-to parsing.

The TPO topbar now recognizes explicit `go to`, lists only 17 existing vNext `/tpo/` canonical page routes, suppresses record suggestions in page mode, and opens the first matching known page on Enter. It preserves ordinary college-scoped student/recruiter/company/drive search outside this mode. No route is constructed from arbitrary user input; destination authorization stays in the normal portal.

The paged general-request bulk action now drops selected IDs that no longer appear after the queue changes or a different page is loaded; otherwise the old invisible selection could invalidate future bulk actions with no way to uncheck it.

Added source-aware unit cases in `tests/unit/tpo-go-to-pages-and-bulk-selection.test.ts`. Browser verification still required for query transitions, live suggestion cancellation, Ctrl/Cmd+K, arrow keys, Escape, mobile dialogs and current-college route permissions. No tracker status was modified.
