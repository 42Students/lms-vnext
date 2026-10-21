# Work packet (wave 2): edit src/app/(authenticated)/tpo/more/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l11-u017-tpo-more.md

## G2-11-017-030  [P2] GAP  facet F13  effort M
- Legacy: Counts start zero, failure leaves all links visible with Retry (more.js:52-65,76-110).
- vNext now: SSR route spinner and full-page route error only (more/loading.tsx:1-5; more/error.tsx:6-11).
- Fix: Split navigational loading/error from nonblocking badge-fetch failure.
