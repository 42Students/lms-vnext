# UX route /tpo/placements/jobs/[jobId]/waitlist

- **Slice:** chat-5, middle third of /tpo, route 66/126; archetype: drive workflow.
- **Previous weakness:** phone content could inherit overflowing min-width and too-small link targets; legacy teal decorative text was insufficiently contrasted for small interactive copy.
- **Changes:** page-level mobile-safe containment, accessible deep-teal link foreground, 44px targets, and a single shell-owned main landmark where a route nested its own. All actual route labels, scoped back links, approval permissions, guardrails, and recorded results remain intact. The draft-only alias route may be a redirect; no invented page or mutation was introduced.
- **States:** pre-existing loader and authorized empty/error/read-only branches preserved. Pending, partial and no-data views must remain distinguishable from loading; no DataTable is created by this route directly. Any new DataTable must specify `empty` with exact route copy.
- **Tests:** `tests/unit/chat5-ux-tpo-middle-third.test.ts` case `UX-tpo-placements-jobs-jobid-waitlist-01`; static behavior and wording checks. Device/browser/AT and TypeScript+unit execution pending orchestrator, so do not tick the page list yet.

**Status:** page UX source pass recorded; deployment acceptance pending.
