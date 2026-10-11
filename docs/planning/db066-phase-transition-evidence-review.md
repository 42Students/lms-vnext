# DB-066 companion audit — explicit user retirement and global phase proof

**October 12, 2026 • global DATABASE phase • independent review (no worker claim)**

This is a new **read-only source-tooling guard**. It supplements DB-065's six-worker claim and dependency audit, not replacing it. It does not register a migration, write a queue entry, contact production resources, or declare phase readiness.

## What was missing from the earlier source-only gate

1. A future-phase task in the same shared active-phase queue could be outside the gate's current-phase open-task denominator even though its state was structurally valid. Reject cross-phase entries.
2. \`RETIRED_APPROVED\` counts as closed work but had no requirement for a traceable **explicit user approval**. Fail closed unless \`retirementApproval\` contains \`approvedBy: "USER"\`, a timestamp, rationale, and approval reference.
3. \`DONE_VERIFIED\` formerly accepted a nonempty evidence array containing an authored-only test or failing command. Require at least one \`kind: "EXECUTED"\` entry with an actual command and \`exitCode: 0\`. This checks metadata consistency, **not truthfulness or PostgreSQL test execution**.
4. A previous phase could be marked \`CERTIFIED\` without a passing executed evidence object for every required gate. Reject missing, unexecuted, failed or unlinked gate metadata. Even a complete metadata set never makes this tool return readiness.

## Added artifacts

- \`scripts/db066-transition-evidence.mjs\` — read-only CLI and pure inspection API.
- \`tests/db066-transition-evidence.test.mjs\` — 12 Node regression tests, including an actual child-process CLI test with a disposable temporary *file fixture* (not a database).
- GitHub direct-to-main commits: [source](https://github.com/42Students/lms-vnext/commit/43ec1542b8eeac61047961dd4e7001be92ecb657) and [tests](https://github.com/42Students/lms-vnext/commit/30ec7960ef9ba0ec23f137c56f022fa8e3b1273e).

## Independent execution (not GitHub Actions)

Executed against exactly matching Node-source Git blob SHA fingerprints, confirmed by re-fetching GitHub \`main\` and locally running \`git hash-object\` over the test files.

~~~text
node --version
v22.16.0
node --check scripts/db066-transition-evidence.mjs
node --check tests/db066-transition-evidence.test.mjs
node --test tests/db066-transition-evidence.test.mjs
# tests: 12; pass: 12; fail: 0; skipped: 0; exit: 0
~~~

The local fixture was under \`/mnt/data/db066-work/\`, not the full repo checkout. Blob SHA identities:
- Script: \`366c22c7145426b451a7e5d4800386895a1695fd\`
- Tests: \`de691086e9ba319c8ee724da4665d8768d54a768\`

On GitHub \`main\`, a live queue/phase metadata scan found no newly introduced companion-rule failures; as the queue was changing concurrently, this is only a point-in-time source check, not a durable phase attestation.

## Running it

~~~sh
node scripts/db066-transition-evidence.mjs
node --test tests/db066-transition-evidence.test.mjs
~~~

The standalone CLI prints JSON and returns status 2 on evidence anomalies, 1 on file/JSON failures, or 0 when **its limited metadata checks** are structurally satisfied. **Zero findings means only this companion metadata check is clean.** It is never a green database verification result, never permission to promote the phase, and not a replacement for the canonical \`npm run db:verify:independent\`.

## Open acceptance gaps

- Verify every executed test and gate evidence object against its actual immutable Git revision and raw runner log. This tool cannot authenticate forged metadata or user-signoff references.
- Run numbered Drizzle migration replay from scratch on *approved disposable PostgreSQL*, verify FK/tenant/negative/race tests and source field reconciliation.
- Keep \`DATABASE\` ACTIVE until all global gates are independently and fully signed off.
- Do not change DB-065's existing DONE_VERIFIED status, migrate to API, or mark this independent companion as a newly certified database task based only on these source tests.

**Ownership:** This independent reviewer did not modify \`drizzle/**\`, \`src/db/schema/index.ts\`, any active worker checkpoint, \`phase-state.json\`, or \`work-queue.json\`. No claim was stolen.
