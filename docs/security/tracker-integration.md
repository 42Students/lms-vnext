# Security Program → Canonical Tracker Integration

**Date:** 2026-11-04  
**Status:** Design for a future validated tracker-schema change. This document is **not** an additional live tracker and does not mark any security control done.

## Why this exists

The single canonical task status source for vNext is [docs/tracker.json](../tracker.json). The existing file declares a `RELEASE` phase, but currently has **81 DATABASE, 10 API and 10 UI tasks and zero RELEASE tasks** (101 total at inspection on 2026-11-04). The `scripts/tracker.mjs::inspectTracker` loop recognizes only `DB-###`, `API-##` and `UI-##` identifiers. Adding `SEC-...` or `REL-SEC-...` objects to `tasks` without updating that validator causes `DUPLICATE_OR_INVALID_TASK_ID`. This is a project integration constraint, not an excuse to lose the security requirements.

The [control catalogue](control-catalog.md) is a complete **requirements index** (493 controls in 26 domains). It intentionally contains no owner, done, picked, or acceptance status. The [program](README.md) and [acceptance matrix](acceptance-matrix.md) define the scope and proofs. **Only** the canonical tracker should record execution and closure.

## Safe migration proposal

1. Pin main SHA; run the existing tracker inspection and snapshot its current errors, task IDs, phase totals and execution milestone structure.
2. Extend `scripts/tracker.mjs` with explicit `REL-SEC-01` ... `REL-SEC-10` recognition as `phase: RELEASE`, or choose a consistently validated RELEASE package naming pattern. **Do not loosen checks for existing DB/API/UI tasks.**
3. Validate unique IDs, title, boolean done, valid dependency list and no cycles. For RELEASE tasks require separately verified code, executed negative tests, deployed-config evidence where relevant and independent review; a saved checklist or authored test cannot satisfy the acceptance gate.
4. Choose the correct milestone representation. If `execution.milestones` is expanded, enforce exact-ID join and no silent auto-complete. If RELEASE deliberately has different evidence fields, test that schema explicitly. Keep `phaseOrder` unchanged.
5. Add **10 umbrella RELEASE packages** shown below, all initially **done:false** with no fake acceptance evidence. These may be split into auditable smaller canonical tasks by an authorized change, but do not create a parallel tracker elsewhere.
6. Connect each package to exact `SEC-<domain>-<ordinal>` controls. Fail coverage validation if any catalogue control is missing or assigned to no package; intentional shared controls may belong to more than one.
7. Add validator tests: existing 101 tasks unchanged; RELEASE task accepted with required fields; missing/duplicate ID rejected; invalid dependency rejected; no evidence/failed test cannot mark done; cross-program dependencies validated; all 493 controls covered; releasing with P0 blockers open rejected.
8. Only after an exact-SHA tracker validation pass, update `docs/tracker.json` through concurrency-safe SHA-checked write. Avoid auto-changing `currentPhase` while UI work is ongoing.
9. Give the existing security-audit chat and other lanes the new IDs and explicit file ownership; document actual commits and test outcomes in canonical acceptance evidence, not this page.

## Suggested canonical work packages

| Future package | Program | Requirement domains | Primary acceptance |
|---|---|---|---|
| REL-SEC-01 | SP-01 Identity & Access | SEC-01, 02, 03, 04, 26 | Seven-role policy isolation; secure sessions, admin MFA, step-up and revoked-role tests |
| REL-SEC-02 | SP-02 Tenant Isolation | SEC-05, 13, 14 | Cross-college, cross-org and same-college ownership test matrix across modules |
| REL-SEC-03 | SP-03 PostgreSQL | SEC-06, 07 | Real runtime-role catalog, RLS `USING`/`WITH CHECK`, integration and pool isolation |
| REL-SEC-04 | SP-04 API & Browser | SEC-08, 12 | 100% method classification and negative object, CSRF, output and XSS tests |
| REL-SEC-05 | SP-05 Secrets, Storage & Privacy | SEC-09, 10, 11, 22 | Rotation proof, protected student data/files, private exports, retention |
| REL-SEC-06 | SP-06 Integrations & Workers | SEC-15, 16 | Signed/replay-safe webhooks, SSRF protection, tenant-isolated least-privilege jobs |
| REL-SEC-07 | SP-07 Cloud & Supply Chain | SEC-17, 18 | Protected main, safe CI credentials, scans, network identities and deploy gates |
| REL-SEC-08 | SP-08 Detection & Resilience | SEC-19, 20, 21 | Audit logs, tested alerts/incidents, isolation/backup/restore drills |
| REL-SEC-09 | SP-09 Verification | SEC-23, 24 | Comprehensive restricted-database attack tests, external assessment and retest |
| REL-SEC-10 | SP-10 Governance | SEC-25, plus cross-cutting | Risk/exception ownership, continuing access reviews and measurable assurance |

**Dependency suggestions, not inserted live:** Identity, tenant, DB, API, secrets, workers, infrastructure and detection work can proceed in parallel after their source/baseline dependencies are verified. Independent assessment depends on all critical implementation packages; final continuous-assurance signoff depends on verified controls and operational ownership. Cross-boundary tests must not be delayed until UI parity.

## Closure receipt (proposed)

```json
{
  "id": "REL-SEC-03",
  "phase": "RELEASE",
  "title": "PostgreSQL RLS and runtime-principal security",
  "done": false,
  "dependsOn": [],
  "securityProgram": "SP-03",
  "securityControlFamilies": ["SEC-06", "SEC-07"],
  "acceptanceCriteria": [
    "Tenant table/ownership matrix and privileged-role inventory reviewed",
    "Restricted-runtime SQL SELECT/INSERT/UPDATE/DELETE tests pass",
    "RLS/pool/rollback deployed configuration independently verified"
  ]
}
```

This object is **illustrative and must not be inserted until the tracker schema supports it**. For actual closure, require acceptedAt + exact-SHA test/CI proof and protected external evidence references. Sensitive PostgreSQL catalog dumps, secret rotation receipts and student records stay outside Git.

## Immediate human/agent handoff

A new worker should select a specific *unreviewed* control range and find an existing genuinely matching canonical task, if available. Otherwise, work on clearly isolated implementation/test files while arranging the above canonical tracker extension. Never claim that the entire security program is covered by `API-10 done:true`; the previous API parity acceptance and full current adversarial production-security certification are different claims.

**Do not change the source blueprint archive to reflect progress.** Dated findings belong in the existing technical audit, requirement wording in the catalogue, and execution truth in the canonical tracker.