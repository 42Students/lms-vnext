# TPO general-request kind and learner search, count parity (2026-10-28)

The officer's general-request queue now supports server-side filtering by one of six typed request kinds and exact-literal text matching on learner display name or request reason. Search requires at least two characters and is capped at 100. A Find action controls when to query; typing alone does not repeatedly send private requests. Status/kind/search changes reset page, clear old rows and invalidate open decisions.

The count query and paged results now share identical college, membership and user joins as well as the filtered predicate. Previously a request with a missing membership or user could inflate pagination totals despite being absent from results. Both calls revalidate the TPO actor and tenant before reading, use bounded pages and reject caller-supplied college IDs, duplicate or unknown filters.

Escaped SQL LIKE wildcard input prevents raw % and _ patterns matching unrelated student identities. Added `tests/unit/tpo-general-request-review-filters.test.ts` plus queue-paging assertions.

Accept only after CI typecheck/unit, tenant-negative PostgreSQL and browser tests. No global tracker status changed.
