# UX route /tpo/placements/jobs/[jobId]/rounds

- **Slice:** chat-5, middle third of /tpo, route 59/126; archetype: round / schedule workspace.
- **Previous weakness:** narrow viewports could inherit unbounded flex minimum widths, small link hit targets and low-contrast decorative teal in actionable copy; authenticated pages with a second main landmark may duplicate the shell landmark.
- **Changes:** reviewed and tightened this route's page-level spacing/containment, responsive minimum width, applicable 44px control targets and 4.5:1 deep-teal text-link colour. Corrected nested landmarks where present. The existing title, field names, help text, return destinations, role and tenant checks, mutation confirmation and server-side effects remain unchanged.
- **States:** the existing route loading boundary stays available, including shared bounded `GracefulPageLoading` on offer pages. Route-specific not-found, read-only and recorded-data empty/partial cases continue to use established server checks. No new optimistic action or silent data hiding.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` — `UX-tpo-placements-jobs-jobid-rounds-01`. Source and accessible presentation checks; browser/320px native-WebView, keyboard/screen-reader and full Vitest evidence must be supplied by orchestrator before page-list checkoff.
- **DataTable contract:** no `DataTable` is instantiated directly here; any future use must pass explicit legacy-scoped `empty` copy.

**Status:** Source update authored, runtime and device acceptance pending.
