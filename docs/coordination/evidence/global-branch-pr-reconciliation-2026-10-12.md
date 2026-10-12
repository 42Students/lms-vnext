# LMS vNext global branch/PR recovery audit — 2026-10-12

**Scope:** all 105 GitHub branch refs and 87 PR records observed for `42Students/lms-vnext`. **Frozen Git tree comparison baseline:** `c58ebf927d08c669b0e9f52f000b124dd9e32d6f`. **Updated main before this report:** `143701f31419da960642349a262d925cd65def93`. **Global phase:** DATABASE ACTIVE; later phases locked.

This is a **Git source-preservation audit**, not a native Node test run, migration replay or a claim of full semantic parity. GitHub does not expose unsaved changes inside inaccessible old ChatGPT chats; only commits, branches and PRs are covered. No branches were deleted, force-updated or recreated. Main's newer security, tenant and schema changes take precedence over old branch file contents.

## Inventory and result

- **105 branch names enumerated** (100 + 5), and recursive blob trees compared to a frozen main snapshot for 104 straightforward refs. The old slash-named `work/remaining-2026-10-04` was inspected through its exact PR head commit `c69e3449adc4a04685cc1ea838e0deccfbeb9e56`. The 105-tree audit checks **path and blob presence**, not that distinct blobs have equivalent behavior.
- **87 PRs:** 69 `MERGED`, 17 `CLOSED_UNMERGED`, 1 `OPEN` (#1). The formerly open draft #84 is now correctly CLOSED_UNMERGED after checking all five branch blobs **identical** to current main. Do not make an empty duplicate merge commit.
- **Two selective direct-main recovery commits, six file paths:** `e880ef1bcf6c6d4fa1591700e4956b864736fde9` (Chat 2, three missing DB01 tenant DNS diagnostics contract/staging/test files from closed #57); `143701f31419da960642349a262d925cd65def93` (Chat 5, 79-field DB03 snapshot witness, historical eligibility evidence and a current test correction from closed #55). Both preserve original contributor attribution. Neither registered a migration, activated API/UI, or asserts PostgreSQL acceptance.
- **Chat 6 predecessor work:** earlier committed audit `docs/coordination/evidence/chat-06-branch-pr-reconciliation-2026-10-11.md` checked 18 W06 + 20 DB008 + 2 DB10 predecessor branches and confirmed five missing historical file names are deliberate replacements, not orphaned features.

## PR disposition — all 17 closed without merging

| PR | Source status / current treatment |
| --- | --- |
| #84 | All five file blobs already identical to main; closed duplicate after SHA audit, original branch retained |
| #73 | Tenant domain tombstone staging reflected on main through later, safer source; no historical branch replay |
| #66 | Superseded by merged #68 |
| #65 | DB01 tenant/identity witness package has subsequently been brought into main; PostgreSQL still unexecuted |
| #64 | Old auth cross-host stage superseded by later keyed-MAC/current-domain handoff source; do not restore weaker shape |
| #61 | Device/handoff predecessor was selectively superseded; old tests assert literal `code_hash` and `session_key_hash` while current designs use keyed `code_mac` and `credential_digest` |
| #58 | Superseded by merged #60 |
| #57 | Three missing, unregistered DNS diagnostics staging/test/docs paths now recovered verbatim in `e880ef1` |
| #56 | Stale predecessor of #57; no duplicate import |
| #55 | Active elective program eligibility already on main; two missing audit/witness docs recovered and source-test head assumption repaired in `143701f` |
| #45 | Superseded by merged #46 |
| #41 | Superseded by merged #42 |
| #13 | DB10 original draft superseded by canonical merged #15 |
| #11 | DB09 original WIP; selectively included in canonical merged #16/#20 and subsequent DB09 hardening, not wholesale |
| #10 | Competing DB09 draft transferred to canonical DB09 ownership |
| #9 | DB08 draft intentionally superseded by canonical current DB08 integration |
| #3 | Historical DB04 WIP; source-only groundwork selectively integrated via merged #17 and later DB04 work, not safe to replay stale migration tree |

These are **reconciliation dispositions**, not proofs that every old implementation variant has identical runtime behavior. If a later parity audit identifies a truly missing user job, port the *specific behavior and tests* against current source rather than merging an obsolete branch.

## One remaining open PR

**#1 — `work/remaining-2026-10-04` (draft; do not merge as-is).** PR has 18 changed paths and was founded approximately 3,015 commits behind the frozen main compare. The exact old PR head tree has just **two path names absent on current main**:

- `drizzle/0029_placements_p10_requests.sql` — old numbered migration; current journal already has 0029 and beyond; Chat 1-only migration ownership, high-risk duplicate history;
- `tests/integration/placements-p10-requests.test.ts` — old scenario code; must be reconciled against modern placement request service, current schema and the active DATABASE phase before reusing.

The other 16 changed-file paths exist on main, but path presence alone is not a behavioral equivalence claim. The old draft explicitly says not to merge manually. Preserve PR/branch as provenance; no auto-merge, no rebase over production main.

## Remaining branch-file groups not suitable for automatic merge

| Source branch/family | Historical tree absence versus frozen main | Why not wholesale merge |
| --- | --- | --- |
| `db08-placement-policy-outcomes-2026` | 20 standalone staging/schema/placement-service/test paths | Older alternate DB08 architecture, 280-field preliminary ledger only 68 mapped/0 runtime proven, schema and code depend on old names. Compare user jobs and port verified missing behavior into canonical DB08 without duplicating Drizzle objects. |
| `w05-db09-messaging-20261010` | Seven old TPO/HR message routes/components/test paths | UI/API surfaces from older branch; phase API/UI locked, DB09 collaboration schema unregistered and tenancy/security contracts subsequently hardened. Review in API/UI wave against current DB09 source. |
| `db04-main-integration-2026` | `src/modules/system/scheduled-job-lease.ts` | Compare with current DB10 scheduled-lease staging/adapter before porting; avoid duplicated runtime job authority. |
| early Chat 2 cross-host/device branches | Historical auth handoff docs/tests | Old hashes/field expectations conflict with current stronger HMAC and enrollment-scope contracts; old tests would regress valid staging. |
| early Chat 2 DNS diagnostics branches | Three original staged paths | Resolved by selective source import `e880ef1` (no live migration or verified semantics). |
| Chat 5 DB03 program-oracle branch | Two 79-field source evidence paths | Resolved by selective import `143701f`; real PostgreSQL and semester/year acceptance remain pending. |
| `academics-schema-gen`, `academics-a2-schema-gen` | Two old GitHub Actions generation workflow paths | CI intentionally disabled due billing; current single-writer migration journal cannot be safely regenerated from stale workflows. |
| Chat 1/3/6 older DB02/DB05 branches | Consolidated or removed `db02-semester-room-contract-staging.sql`, `db02-academic-parent-enrollment-tenant-guards.draft.sql`, `db05-course-parent-integrity.draft.sql`, older discussions test/schema paths | Superseded and intentionally deleted, as documented in Chat 6 reconciliation. Keep canonical staged SQL and register only via Chat 1. |

Retained historical branch refs may differ in dozens of *existing* file blobs because main advanced; **a divergent branch is not a list of missing features**. Do not replace any current main file with an older branch copy simply because its SHA is different.

## Recovery verification actually performed

- Exact branch→main blob equality: all 5 PR #84 changed files match; no duplicate PR merge.
- DB01 diagnostics: all 3 imported source blobs independently fetched from main with original SHA after `e880ef1`.
- DB03 source witness: frozen snapshot `drizzle/meta/0040_snapshot.json` and DB03 crosswalk match the provenance SHAs in imported 79-field JSON; 79/79 read-only V8 source-shape assertions passed, **not native Node or PostgreSQL**.
- DB03 test correction: no longer assumes `0040` is `journal.entries.at(-1)` after migrations 0041/0042; one additional source witness test was added. Neither the full native Node suite nor PostgreSQL migration replay was executed during this reconciliation.
- CI Actions intentionally not invoked because of billing.

## Closure and next owner actions

1. **Chat 1 / migrations:** reconcile the canonical, current DB02/DB04/DB08/DB09 source layers and run a real disposable PostgreSQL zero-to-head replay. Do not import PR #1 migration 0029 or any superseded DB02/DB05 draft.
2. **DB01 current owner (Chat 5):** consider recovered DNS diagnostic evidence from #57 as a candidate under DB-004, not a completed field; decide final product/Drizzle writer integration, test lifecycle and privacy.
3. **DB03 original author (Chat 5):** preserve recovered 79-field source witness and run current Node/PG acceptance before any DONE_VERIFIED status.
4. **DB08/DB09 owners:** later perform feature-level parity comparison for the distinct older 20 DB08 and 7 DB09 messaging file paths, rather than merging their complete branches.
5. **Keep PR #1 as an explicitly unsafe historical reference** until its old 0029 migration/test conflicts are fully reconciled; do not mark it merged or silently close it based solely on path presence.

**DATABASE remains ACTIVE; API/UI/RELEASE remain LOCKED.** Source recovery is not a task closure, PostgreSQL proof, or authorization to ship.
