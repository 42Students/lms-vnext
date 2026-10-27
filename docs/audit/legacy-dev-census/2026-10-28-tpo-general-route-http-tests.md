# TPO general review HTTP route verification — 2026-10-28

Introduced `tests/unit/tpo-general-requests-route-http.test.ts` as a handler-invocation suite using the real GET route and real Zod parser, while replacing only authentication, authoritative service, and error transport dependencies with controlled mocks. It asserts private no-store responses and parsed defaults; validated page, size, status, kind and q; rejection of duplicate and unknown query fields (especially caller-supplied collegeId and userId), invalid bounds and single-character probes; and fail-closed behavior when authentication or persisted TPO service permission fails.

This test does not replace PostgreSQL, property testing or browser E2E; real authorization and tenant-scope remain enforced by the existing service and must be verified under CI's database suite. It improves regression detection for the newly introduced HTTP filter contract, rather than marking any page Green.
