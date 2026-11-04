# Security Program — Canonical Control Tracker

**Implemented:** 2026-11-04. Source of execution truth: [`docs/tracker.json`](../tracker.json), under its `security` object. This document explains the working system; **it is not a separate task or status tracker**.

The catalogue remains a frozen requirement baseline: [493 control IDs in 26 domains](control-catalog.md). The execution program groups them into **SP-01 through SP-10**. The canonical `tasks` array remains unchanged at 101 previously accepted DB/API/UI tasks. Their engineering acceptance is separate from security certification.

**Current owner direction (2026-11-05):** `currentWorkstream: SECURITY` is the active closure priority in the same canonical tracker. `currentPhase: UI` and the five historical global phase certificates are preserved as prior engineering history, **not** an instruction to keep doing UI work or claim release readiness. For every new security item, use an existing `SEC-XX-YYY` control record and update it only from scoped evidence. Never add competing dashboards, clone tasks, or mark broad controls verified because a focused CI job passes.

## Query the current numbers at any time

The CLI reads the same canonical tracker that regular project checks validate:

```bash
node scripts/tracker.mjs --security
node scripts/tracker.mjs --security-json
node scripts/tracker.mjs --closure-next  # security priority queue when currentWorkstream=SECURITY
node scripts/tracker.mjs --security-next  # explicit security queue, regardless of legacy phase
node scripts/security/control-progress.mjs --markdown
node scripts/security/control-progress.mjs --check
node scripts/tracker.mjs --check
node --test tests/security-control-progress.test.mjs
```

The human-readable command reports verified, remaining, assessed, unknown/unassessed and program-by-program counts. The JSON command exposes each program and evidence-backed control. **Nothing is counted as done just because a test exists.**

[Security control integrity workflow](https://github.com/42Students/lms-vnext/actions/workflows/security-control-progress.yml) reruns on canonical tracker, catalogue, validation-script and test changes. Its GitHub Actions **job summary** is the generated live dashboard; no manually edited dashboard counts can drift. The workflow checks the exact commit SHA and runs negative invariant tests as well as the existing project tracker validation.

## Status meanings — do not inflate completion

| Canonical state | What it means | Counted completed? |
|---|---|---|
| `UNASSESSED` | This control has not been reviewed individually; existing code may or may not cover it | No |
| `GAP_CONFIRMED` | A concrete defect/missing security guarantee has been observed with traceable proof | No |
| `PARTIAL_EVIDENCE` | A relevant implementation/test slice passes, but the entire requirement has not been established | No |
| `IMPLEMENTED_UNVERIFIED` | Implementation is believed present with exact known missing checks listed | No |
| `VERIFIED` | Control-specific positive and negative checks, configuration/runtime proof and independent review all accepted | **Yes** |
| `NOT_APPLICABLE` | An exceptional, independently approved, expiring and documented exclusion | Not completed; separately excluded |

The live denominator is always the actual catalogue count, presently **493**. The report separately shows **verified / total**, **assessed / total**, **still requiring closure**, and all six states. Never describe `UNASSESSED` as `NOT_STARTED`, `PARTIAL_EVIDENCE` as `COMPLETE`, or `VERIFIED` as global production-release approval. A focused green workflow proves only its stated scope.

## Baseline receipt

At initialization on 2026-11-04, a targeted read of source and executed security workflows justified **22 partial-evidence controls and 1 confirmed governance gap**. The remaining **470 controls are UNASSESSED**, *not* known-unimplemented. **0 controls have independent completed control certification**. The single confirmed gap is the unprotected `main` branch (SEC-18-002) observed through the GitHub branch API; other gaps may exist but are not silently invented.

Those are **initial numbers only**; use the CLI or workflow summary for all subsequent totals. The underlying focused evidence is stored alongside the relevant control in `docs/tracker.json`, and in the existing [private export](evidence/2026-11-04-private-bulk-export-hardening.md) and [recruiter ZIP/RLS](evidence/2026-11-04-recruiter-zip-ssrf-and-rls-auditor.md) receipts.

## Updating a control while working in parallel

1. Fetch the latest `main` before any write. Do not overwrite another chat's newer tracker revision; use the file's fresh GitHub blob SHA.
2. Locate the exact catalogue ID under `security.controls` in `docs/tracker.json`. The same control ID must exist exactly once, and the task description is owned by the catalogue.
3. For a tested partial slice, set `state: PARTIAL_EVIDENCE`, `assessedAt: YYYY-MM-DD`, `nextProof` (remaining independent acceptance), and an `evidence` array containing exact 40-character `commitSha`, successful executed GitHub Actions `runUrl`, and the **narrow exact scope** tested. If an actual gap is discovered, record `GAP_CONFIRMED` and its authoritative observation/evidence.
4. Only use `IMPLEMENTED_UNVERIFIED` when the remaining validations are explicitly enumerated in `remainingChecks`.
5. Only use `VERIFIED` after separately checking the entire control (not just one API): require the closure object's independent `reviewer`, `reviewUrl`, `acceptedAt`, exact `commitSha`, positive and negative test proof, deployed configuration review and `releaseEvidence`. The validator rejects unsupported completion. Production secrets, DB catalog exports and personal records must never be committed to Git.
6. Run `node scripts/tracker.mjs --check` and `node --test tests/security-control-progress.test.mjs`; inspect the workflow at the resulting SHA. Don't edit a report or hardcode percentages.
7. Where a requirement genuinely does not apply, do **not** simply remove it: `NOT_APPLICABLE` needs an approved, expiring independent exception with documented rationale. This remains separately visible.

## Assurance quality and non-negotiable gates

- A skipped/failed test, source-only claim, simulated role, or unreviewed database configuration cannot be called complete.
- Security and database evidence must cover multi-tenancy, same-tenant horizontal privacy, selected role, object owner, field, mutation side effects, revocation and deployment-specific permissions **as applicable**.
- Source and local/disposable PostgreSQL passes do not automatically certify the actual production runtime database principal or all RLS policies.
- A `security.releaseSignoff.approved` flag with open controls fails validation. Overall release also requires the [separate release gates](acceptance-matrix.md), protected `main`, independent assessment and deployment signoff.
- The program IDs SP-01…SP-10 map each of the 26 domains exactly once. All per-program counts are derived from the same 493 statuses. Cross-domain controls still need their own explicit closure.

## Future umbrella release work packages (optional, not silently inserted)

The earlier proposed `REL-SEC-01` through `REL-SEC-10` parent release tasks were **not** inserted because the original tracker task validator and milestone system allow only DB/API/UI task identities. A later explicit schema extension may add those umbrella packages, but cannot create a second status source or alter the accepted 101 original tasks. Program rollups already work now through the canonical `security` object.

**Next priority:** Audit and classify the 470 unassessed controls by exploit impact, starting with production DB principals/RLS, per-method API object authorization and branch/release enforcement. Each classification requires concrete implementation and test evidence; do not auto-close broad controls by keyword matching.
