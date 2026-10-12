# DB-003 Smrithi legacy-consumer evidence — execution notes

**Date:** 2026-10-12. **Purpose:** unblock the seven historical Smrithi table decisions in the original core eleven without silently dropping a daily-use legacy capability.

## Verified in this round

- Current legacy backend `42Students/lms@prod-2026` Git tree: `21bad59d4dfaf2fa11fdeaf9353327ce105697d5` (matches the frozen DB-003 evidence baseline).
- Current legacy frontend `42Students/lms2-fe@prod-2026` Git tree: `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`.
- Neither recursive Git tree contains a pathname with `smrithi` in it. **A filename search is not a consumer-content search**, and cannot justify retirement.
- New source-audit tool: `scripts/db00-smrithi-consumer-audit.mjs`; regression suite: `tests/db00-smrithi-consumer-audit.test.mjs`.
- **Actually executed:** `node --test tests/db00-smrithi-consumer-audit.test.mjs` using Node 22.16.0 against exact file blobs `7dbd410e6110bca7a01b5bdb29697cd456c8f615` and `f13e4169eaf071fc775b4583e8a640583c5c9679` (11 tests passed, 0 failed).
- **Not executed:** full real-legacy-content scan, executable PostgreSQL acceptance, and any external integration/production consumer inventory.

## Run on immutable local clones

From the `lms-vnext` repository root, with separately checked-out, clean tracked files in the legacy frontend/backend directories:

```bash
node --test tests/db00-smrithi-consumer-audit.test.mjs

node scripts/db00-smrithi-consumer-audit.mjs \
  --evidence docs/planning/db00-smrithi-source-evidence.json \
  --backend /absolute/path/to/lms \
  --backend-sha 21bad59d4dfaf2fa11fdeaf9353327ce105697d5 \
  --frontend /absolute/path/to/lms2-fe \
  --frontend-sha e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2 \
  --out /tmp/db003-smrithi-source-references.json
```

The executable verifies the pinned backend identity against the DB-003 source evidence, requires the exact frontend commit specified by the caller, rejects dirty tracked source, scans **every Git-tracked supported textual source file**, rejects tracked symlinks, scans script/native source extensions, records exact file/line and five source classifications (migration, test, documentation, generated, runtime candidate), and preserves generic `Smrithi*` references not matching the seven table names. It refuses missing, malformed or changed evidence. It does **not** fetch a source checkout itself.

### Still required to close DB-003

1. Inspect all runtime-candidate and unattributed hits by source file; resolve indirect table access and native/dynamic SQL.
2. Check current deployed API/route behavior and external integrations that are not part of either Git repository; read-only physical schema metadata may be needed.
3. For **each** of the seven tables/91 fields, record explicit product-owner `RETAIN` with tested vNext mappings **or** `RETIRE` with independent consumer evidence and sign-off. Greenfield/no data migration alone is insufficient.
4. Only then update DB-003/DB-019 dispositions. `SOURCE_SCAN_ONLY_PRODUCT_DECISION_REQUIRED` is never `DONE_VERIFIED`.

This report intentionally does not invent scan output or approve any retirement. Original core-eleven count is unchanged.
