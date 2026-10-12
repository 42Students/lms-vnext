# W01 DB-017: migration timestamp ordering correction (2026-10-12)

Registered journal sequence 0045→0046→0047→0048 had a non-monotonic `when`: 0047 originally used `1791815028762`, **earlier** than 0046 `1791844200000`. Drizzle uses migration timestamps for applying migrations to an already-initialized database, so 0047 could be skipped even though its numeric index was greater. Changed **only the journal timestamp** for 0047 to `1791846000000`, which is strictly between 0046 and 0048 (`1791847800000`). No 0047 SQL, enum policy or Drizzle snapshot is changed.

Added a fail-fast increasing-timestamp assertion to `scripts/verify-drizzle-journal.mjs` and Node regression tests covering actual journal order plus an intentionally reversed synthetic journal. This is source-level safety, not PostgreSQL evidence. Re-run on disposable DB from empty and against a database applied through 0046 to verify that 0047 runs exactly once; do not certify DATABASE from the test's existence.
