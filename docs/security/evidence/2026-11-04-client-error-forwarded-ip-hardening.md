# Browser-error telemetry: forwarded-IP trust hardening (2026-11-04)

**Scope:** only `POST /api/client-errors` and its optional secondary IP quota.  
**Canonical tracker:** `docs/tracker.json` remains authoritative; this dated packet is implementation evidence, not a status tracker or release sign-off.  
**Catalogue links:** SEC-17-013 (proxy header trust), SEC-08-015 (endpoint abuse limits), SEC-19-021 (privacy/minimization). These controls are **not closed** by this slice.

## Observed defect and change

Prior to this batch, when `TRUSTED_CLIENT_IP_HEADERS=true`, telemetry preferred `X-Real-IP` and otherwise took the *first* `X-Forwarded-For` hop. That position can be supplied by an untrusted caller. An attacker could choose the alleged IP used for telemetry's secondary per-IP budget. This did not by itself bypass the existing authenticated per-user quota.

The endpoint now uses `trustedClientErrorIp`, which reuses the shared authentication IP parser: it reads the **second-to-last hop** of the configured Google load-balancer chain, checks the rightmost proxy hop, canonicalizes IPv4/IPv6, and ignores both `X-Real-IP` and any spoofed leading values. Malformed, oversized, missing and single-hop chains produce `null`, omitting the optional IP quota while retaining the server-authenticated per-user quota. The trust feature remains disabled unless the deployment explicitly sets `TRUSTED_CLIENT_IP_HEADERS=true`.

### Commits on main

- `79aa9fef796b83dc15993141870079fe25f29cb6` — independent optional telemetry-IP parser.
- `ab8af1f4035899d3dfa964a73ab7ea025d6ec9a1` — route now uses the shared parser instead of caller-supplied header precedence.
- `3cb74089b7a4d649e71fe46c18ef456285883579` — six regression cases covering disabled trust, spoofed leading hops, forged `X-Real-IP`, missing/single-hop ingress, malformed hops, canonical IPv6 and large headers (nine individual assertions).

## Verification and limits

- **Executed:** nine isolated Node 22 cases using TypeScript-transpiled copies of the touched pure parser and the existing shared IP selection algorithm; **9/9 passed**. This is a developer smoke test, **not a repository Vitest run** or signed CI evidence.
- **Authored, not verified in repository CI:** `tests/unit/client-error-ip-security.test.ts`. The companion existing `tests/unit/auth-ip-rate-limit.test.ts` was not rerun. No complete `npm ci`, `npm run typecheck`, browser or deployed HTTP verification is claimed.
- **Required next proof:** on current `main`, run `npx vitest run tests/unit/client-error-ip-security.test.ts tests/unit/auth-ip-rate-limit.test.ts` plus TypeScript and affected CI, retaining an exact run URL.
- **Deployment prerequisite:** verify, using real ingress configuration and a staging request capture, that the application cannot be reached directly, that the load balancer appends the expected two trusted XFF hops, and that any extra ingress does not rewrite that chain. Without that network trust boundary, even right-side header parsing is not authoritative.
- **Residual:** rate buckets are process-local, so a shared edge/distributed limiter is still needed for multi-replica protection. The per-user quota is independent of client IP.

**Release verdict for this slice: PARTIAL source hardening, not production certified.**


---

## 2026-11-04 continuation: quota exhaustion, credential redaction and direct HTTP checks

This continuation extends the same browser-error diagnostic boundary, rather than starting a new security status tracker. The canonical state remains in `docs/tracker.json` and **none of SEC-17-013, SEC-08-015 or SEC-19-021 is independently VERIFIED** by this work.

### Implementation delivered on `main`

| Commit | Scope |
| --- | --- |
| `eb2450c1e3180eb056135671ee6c25d3f336210c` | Preserve the 5,000 live telemetry quota buckets instead of evicting a still-active user on saturation; expire buckets on a bounded sweep; keep per-user quota stable |
| `134561a252fa39569fb6458b386e448130c9ada4` | Six regressions for saturation, known-user fairness, TTL expiry, invalid inputs, and deterministic reset |
| `c5fa3af7785dc7c1b8de24aff953be2b2d45b7db` | New path-scoped security workflow for spoofed-IP, saturation and existing limiter cases |
| `20801f6b8deb0b5083100cd54c71b38d0060cc8c` | Redact short provider secrets under prefixed environment/header names |
| `90fededb2e603de73dfc566380aea229f0b071da` | Short-credential leakage regression fixtures |
| `37206972a006b9ddade9946415897adaa8039971` | Extend telemetry workflow to exercise credential masking |
| `56628bb4552a6516d3213d37350e8793375567cb` | Redact credential fields before generic long-token matching |
| `368c8123ebab26bbaa172521c2b13b9d597a145b` | Regression for long credential *names* carrying short values |
| `e3da1b74b57c5f2a258f4c2ecedb9ba3eef14f0b` | Correct matching precedence to scrub Bearer/Basic credentials before named fields |
| `dae8a6843b66058d25ae06bbed8925cdbf73a163` | Six direct HTTP security cases: origin, anonymous denial, extra identity fields, body limit, private-log redaction, and rotating-IP quota evasion |
| `a3e666cbffd15d5778d5a4cec52bd769615e74be` | Extend focused workflow to cover direct HTTP route protections |

**Notable regression discovered and corrected during local smoke:** an initial matching order left a short `Authorization: Basic` credential visible after consuming the header name. This was fixed at `e3da1b7` before this evidence update.

### Actual execution evidence and blockers

- **Local isolated Node 22 smoke, not a repository test run:** 15/15 synthetic credential-pattern fixtures passed following the precedence correction; 10,006/10,006 assertions passed on the pure quota algorithm. These smoke reproductions were manually mirrored from the edited implementation; they **do not certify Vitest, source import resolution, production ingress or the fully integrated route**.
- **GitHub workflow run:** [41834348763](https://github.com/42Students/lms-vnext/actions/runs/41834348763) on `a3e666cbffd15d5778d5a4cec52bd769615e74be` returned **failure**. The telemetry job returned no step summaries and the log artifact was unavailable (`BlobNotFound`); the run provides **zero passing test evidence**. Its cause remains unconfirmed; no test failure was observed or ruled out.
- Run `npx vitest run tests/unit/client-error-ip-security.test.ts tests/unit/client-error-rate-security.test.ts tests/unit/client-error-http-security.test.ts tests/unit/client-log-credential-redaction-security.test.ts tests/unit/graceful-client-error.test.ts tests/unit/chat16-graceful-redaction-r8.test.ts tests/unit/auth-ip-rate-limit.test.ts`, then TypeScript, lint and affected CI at an exact head SHA on a working runner.
- Validate live proxy-header provenance and multi-replica shared-edge rate controls separately; no code-only test establishes either.
- Review redaction behavior under real redacted provider errors without collecting actual secrets. Keep no plaintext credentials in CI artifacts.
- Preserve broader security-program coverage and independent review requirements. This slice is **CODE COMMITTED / EXECUTED REPOSITORY TESTS BLOCKED**, not a completed security control or release signoff.
