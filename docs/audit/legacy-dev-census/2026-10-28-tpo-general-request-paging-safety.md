# TPO general-request inbox bounded paging & refresh safety — 2026-10-28

**Implementation source change, not a completed browser/database acceptance.**

## Confirmed previous behavior

The `/api/placements/tpo/requests/general` endpoint returned at most 1,000 ordered records, pending first, and its React panel showed every returned request in one scroll container. A college with over 1,000 pending records would never see the next pending request in this queue. Once requests moved to history, there was no explicit paging or status selector. Failed refresh retained old queue data without disabling destructive actions, although the decision service's version lock still protected writes.

## Source implementation

- `listTpoGeneralRequests` now parses strictly bounded `page`, `pageSize`, `status`, first revalidates persisted TPO membership and placement manage scope, and returns tenant-scoped `{requests,total,page,pageSize,totalPages,status}`. Its count and results use the same college/status predicate; request rows stay bounded at 50 and stable ordered.
- The GET route rejects unknown and repeated query keys, sets private `no-store`, and passes only schema-validated filters. No client-supplied college ID is accepted.
- The panel defaults to **Waiting** and exposes All, Approved and Rejected history, with 25 records/page and Previous/Next. An out-of-range last page after decisions moves back to the new final page.
- A monotonic fetch generation prevents stale responses overwriting newer status/page navigation. On a fetch failure previous results are explicitly marked stale and decision controls are disabled pending a successful refresh.
- General-request bulk processing reports if its authoritative refresh fails; UI outcome receipts remain available. The legacy proof-sensitive bulk skip applies to off-campus offer evidence; attendance disputes, which accept optional proof, are not blocked by the absence of an HTTPS proof link.

## Acceptance still required

The authored `tests/unit/tpo-general-request-queue-paging.test.ts` plus updated bulk unit tests must be run, followed by TypeScript/lint, disposable PostgreSQL multi-college/large-volume (>1,000) queue tests, concurrent decision and last-page transition tests, browser filters/keyboarding and revoked-role/privacy tests. No tracker/page Implementation Green is claimed based on source-only changes. The independent release oracle and detailed parity specs remain authoritative.
