# Security hardening continuation — committed-secret prevention

**Date:** 2026-11-04  
**Scope:** Gitleaks baseline confidentiality, mandatory new-commit scanning, full-history rescanning, and secret scanner regression tests.  
**Branch:** `42Students/lms-vnext/main`  
**Evidence level:** CODE COMMITTED + SOURCE REVIEW; **NO PASSING CI OR PRODUCTION CERTIFICATION CLAIMED**.

## Verified finding and change

The existing `.gitleaks-baseline.json` contained **121 historical generic API-key candidate records with non-redacted `Match` and `Secret` values**. These are *candidate findings*, not 121 confirmed working credentials; never print or redistribute their contents. A baseline is not a safe place to preserve candidate credential strings in the Git tree.

The existing `security-full-history-secrets.yml` triggered only when its own workflow or `scripts/security/**` changed, not when an ordinary route, UI component, deployment manifest or configuration gained a new credential. It also treated a missing report as a clean scan.

This continuation:

1. Replaced all 121 current `Match` and `Secret` fields with `REDACTED`, keeping forensic metadata/fingerprints for local review. **This cleans the current HEAD file only; old commits and cloned copies remain unchanged.**
2. Added a dedicated `Security - no new committed credentials` gate on **every pull request to main, every main push and manual dispatch**, with no `paths` filters and read-only GitHub permissions. For PR/push it scans the newly introduced Git commits, **without** a historical baseline; unknown/unavailable base SHA fails closed.
3. Added a weekly and on-demand complete-history scan, while retaining a historical baseline only for the backlog. The periodic scan checks all locally reachable Git refs/tags and fails on missing, malformed or newly discovered candidate reports.
4. Added `scripts/security/gitleaks-report-gate.mjs`: strictly validates a redacted baseline; outputs only sanitized rule IDs and counts, **never matched values, file paths or fingerprints**; fails closed on errors and overlarge reports.
5. Added `.gitleaks.toml` extending the official pinned Gitleaks default rules with narrowly scoped high-entropy provider-key assignments for ZeptoMail, Zoho, Exotel, BulkSMSApps and SendGrid. No global allowlist and no default-rule replacement.
6. Added standalone regression tests and workflow-policy tests so triggering, redaction, report failure handling and supplemental provider signatures cannot be silently weakened during later changes.

## Implementation commits

- [bd6c151](https://github.com/42Students/lms-vnext/commit/bd6c1514e541d72bdffd36282b7443388eb04298) — redact current historical baseline values
- [c91af9f](https://github.com/42Students/lms-vnext/commit/c91af9fa0514097b136286432f5de00d32a90f69) — fail-closed, redacted Gitleaks report gate
- [e95e2fd](https://github.com/42Students/lms-vnext/commit/e95e2fde6b8a8346b307c433d6906da6e0ed764f) — scanner report safety tests
- [ee9ca5b](https://github.com/42Students/lms-vnext/commit/ee9ca5b69c87ac25b98c8e1301705e4f651ae28a) — no-baseline incremental credential scan on all PRs/main pushes
- [3da4eca](https://github.com/42Students/lms-vnext/commit/3da4eca16580c25cee1c6870b11a1b4f4f331d16) — weekly full-history scan and strict missing-report handling
- [2037358](https://github.com/42Students/lms-vnext/commit/203735844b34586589ad0b38376818b7fb46dc94), [04a861d](https://github.com/42Students/lms-vnext/commit/04a861dd636c808d76112b95b76bcf9a5f1b79de), [b5a62a2](https://github.com/42Students/lms-vnext/commit/b5a62a20b2823136f8e7eb485e1b4f5330f3c1bd) — source-policy regression and CI wiring
- [eafb990](https://github.com/42Students/lms-vnext/commit/eafb990f37ba6c77ad733b3a785590b484c5445f), [53d21dc](https://github.com/42Students/lms-vnext/commit/53d21dc48f53d20b51be96b49c7881a56344d356), [767d4c9](https://github.com/42Students/lms-vnext/commit/767d4c9504cbb38a622f43478f2a25608e5d2688), [ccef61d](https://github.com/42Students/lms-vnext/commit/ccef61d632c51243d294580af7df2af446f1a0f9) — provider-specific secret signatures, enabled in both scans, with tests
- [675b201](https://github.com/42Students/lms-vnext/commit/675b201f633d811f02ca4fd40b4fde825b616644) — bound scanner report parsing and safe triage guidance

## Acceptance evidence

| Control | Evidence | Status |
| --- | --- | --- |
| Current baseline value redaction | 121 rows; zero unredacted `Match` / `Secret` fields observed by GitHub read | COMMITTED / SOURCE VERIFIED |
| Mandatory per-commit workflow registered | `security-new-commit-secrets.yml`, PR + push all paths | COMMITTED / SOURCE VERIFIED |
| Full-history weekly backstop | `security-full-history-secrets.yml`, schedule/manual + relevant push | COMMITTED / SOURCE VERIFIED |
| Provider-specific regex support | `.gitleaks.toml`, default rules preserved | COMMITTED / SOURCE VERIFIED |
| Test suite | Two Node test modules, job steps configured | **NOT EXECUTED** by confirmed Actions runner |
| GitHub run on `ee9ca5b` | [41835372466](https://github.com/42Students/lms-vnext/actions/runs/41835372466): FAILED, job with zero steps executed | INFRA/RUNNER BLOCKED; NO TEST RESULT |
| Later scan workflows | [41835890981](https://github.com/42Students/lms-vnext/actions/runs/41835890981) and [41835890744](https://github.com/42Students/lms-vnext/actions/runs/41835890744): failure conclusions; diagnose runner/billing before claiming code failure | UNVERIFIED |
| GitHub `main` protection | Branch metadata returned `protected: false` | **OPEN RELEASE BLOCKER** |
| Historical Git rewrite / cached clones | Not performed, because it requires coordinated write freeze, revoked keys and an explicitly approved rewriting plan | **OPEN SECURITY/OPERATIONS TASK** |
| Provider credential rotation and abuse audit | Requires authorized provider-side account access and private incident review | **OPEN EXTERNAL TASK** |

## Commands for a trusted checkout

```bash
node --test tests/security-gitleaks-report-gate.test.mjs tests/security-secrets-workflow-policy.test.mjs
node scripts/security/gitleaks-report-gate.mjs --validate-baseline .gitleaks-baseline.json
# Using installed pinned Gitleaks 8.30.1:
gitleaks git --config=.gitleaks.toml --redact --log-opts='HEAD~1..HEAD' --report-format=json --report-path=/tmp/local-candidate-report.json .
# Keep local reports off GitHub and out of shared logs; never paste candidate strings.
```

## Remaining operational closure — cannot be substituted by source commits

- **Rotate and revoke confirmed historical credentials** with each external provider, invalidate affected sessions/tokens, inspect provider usage and preserve incident evidence privately.
- **Coordinate and approve Git history remediation** only after stopping all parallel writers, anchoring clean references, handling forks/clones, revoking keys first, and planning rollback and downstream re-clones. A normal Git commit cannot remove older blobs.
- **Make checks required and enforce PR review for main** through GitHub branch protections/rulesets with repository administration. CI triggers alone cannot stop direct pushes when `main` is unprotected.
- **Restore real GitHub Actions execution** and attach passing exact-SHA test and scanner reports. Zero-step failed jobs provide no source validity conclusion.
- **Keep using the existing centralized security tracker** for overall progress; this document records a single security implementation lane only.

This is an improvement in detection, evidence safety, and regression controls; it is **not** a claim of zero secrets in Git history or banking-grade application-wide security.
