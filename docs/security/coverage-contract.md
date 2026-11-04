# 42LMS vNext — Security Coverage Contract

**Established:** 2026-11-04  
**Classification:** Baseline assessment and measurable security-verification requirements. **Not** an executed audit, live assurance dashboard, alternate task tracker, or security certification.  
**Canonical work/status system:** [docs/tracker.json](../tracker.json). This document only defines measurements and evidence. [Program](README.md) · [control catalogue](control-catalog.md) · [adversarial matrix](acceptance-matrix.md) · [original technical audit](../audit/security/2026-11-04-auth-authorization-tenant-hardening.md).

## Executive verdict

The 26-domain blueprint and 493-item catalogue are **comprehensive at the level of the source material**, but completeness of the *running application* is not established. Requirements preservation is not implementation coverage; route discovery is not proof of endpoint authorization; a code-level guard is not proof of object/tenant ownership; policy presence is not proof of effective production RLS; a test authored is not a test executed.

The most important improvement is to make this a **bidirectional evidence traceability system**:

```text
External benchmark (ASVS 5.0 requirement, NIST identity control, API Top 10 scenario)
   ↔ threat, asset, entry point and security control SEC-XX-YYY
   ↔ code and deployed infrastructure/database/storage policy
   ↔ exact API method / data table / role-resource relationship / privileged action
   ↔ positive and adversarial test with zero-side-effect assertion
   ↔ executed result at exact SHA + environment + runtime configuration evidence
   ↔ independent reviewer + canonical tracker decision
```

For changes, run both directions: a new method/table/role/worker must find controls and tests, and each important control must link to one or more concrete operations/tables/configuration claims. Anything unmapped is **UNKNOWN**, never implicitly secure.

## Dated baseline: what is known, not conjectured

| Measure | Last documented evidence | Verified coverage claim | What remains unknown |
|---|---|---|---|
| Source-blueprint domains | 26 sections preserved and numbered | **26/26 documented** | Whether additional app-specific threats sit outside the original blueprint |
| Explicit control requirements | 473 source checklist bullets + 19 role/module table obligations + 1 explicit horizontal-access guarantee | **493/493 catalogued, unique IDs** | Actual implementation/test/deployed-evidence status of each |
| Individually linked implementation/test evidence **inside the catalogue** | Catalogue is intentionally requirement text without per-control evidence links | **0/493 linked there** | Real controls may already be implemented and tested elsewhere; do not report 0% implementation |
| API route files | 1,001 files in prior identified-SHA census | Historic discovery only | Current latest `main` total |
| Exported API methods | 1,322 methods in prior census | Historic method discovery only | Current method-by-method object/tenant coverage |
| Fully object/tenant security-reviewed methods | Previous technical audit explicitly labeled all 1,322 **UNREVIEWED** | **0/1,322 documented as completed at that baseline** | Subsequent audit work by other chats; do not claim this is latest |
| Methods without direct session-call evidence | 143 in prior census | **Triage candidates, not confirmed vulnerable** | Indirect guards and deliberately public/webhook exceptions |
| Unsafe methods without direct origin-call evidence | 36 in prior census | **Triage candidates, not confirmed vulnerable** | Other CSRF/signature mechanisms and legitimate exceptions |
| Role families | Learner, Faculty, Mentor, TPO, Recruiter, College Admin, Super Admin | **7/7 scope contracts written** | Enumerated role × permission × operation × relationship runtime tests |
| PostgreSQL RLS and runtime principals | Historical source review and some catalog-check tooling | **Production enforcement not certified** | Live table count, ancestry map, policies, app DB effective role and privileges |
| Security CI | Existing audit cites selected exact-SHA passing auth and PG suites | Scoped passed boundaries only | Current HEAD full-scope CI/branch protection, independent test coverage |
| Independent assessment, recovery and secret rotation | Requirements specified | **No full certification evidence in reviewed docs** | Actual external reports, live drills and provider-side revocation records |

Do not produce an overall “percentage secure” from these heterogeneous measures. Security is not a sum of checklist points. A single exploitable critical tenant-read bypass blocks launch even if hundreds of unrelated controls pass.

## Ten coverage axes to instrument

For each metric, freeze the exact source/environment revision, discover the **actual denominator**, preserve justified `NOT_APPLICABLE` with reviewer approval, and count `VERIFIED` only with current passing evidence. Report `UNKNOWN`, `FAILED`, `IN_PROGRESS`, `NOT_APPLICABLE` separately; never drop unknowns from denominators.

| Axis | Denominator (discovered) | Numerator (only verified) | Critical target |
|---|---|---|---|
| **1. External standards** | Applicable ASVS 5.0 L2 and designated L3 requirement IDs, NIST auth controls and OWASP API risk cases | Explicit mapped implementation + test + reviewer | Every applicable requirement dispositioned; no critical unmapped L2/L3 |
| **2. Internal controls** | 493 SEC IDs plus approved appended IDs | Control linked to owner, code/config, applicable surfaces, tests and evidence | 100% traced; all P0 controls proven |
| **3. API methods** | Every exported HTTP method on exact HEAD, including worker/webhook/public routes | Classified, object/tenant/field reviewed, positive/negative runtime tests or reviewed exemption | **100% classified and reviewed**; no uncovered privileged method |
| **4. Data stores and tenants** | Every persisted table/view/function/materialized view, cache, search index, file namespace and private export stream | Documented authoritative ownership, effective DB/storage policy and SQL/adversarial proof | **100% ownership classified**; no unknown private object boundary |
| **5. Role/permission/resource** | Every role × actionable permission × resource class × tenant/company relationship × relevant lifecycle state | Authorized positive and unauthorized negative cases including role switching | **100% critical combinations**, including same-college horizontal checks |
| **6. Privileged operations** | All high-impact actor/tenant, role, factor, grant, export, system and destructive operations | Fresh authentication, strong MFA where required, independent approval if required, scoped audit | **100% step-up and authorization** before release |
| **7. Integrations/async** | All webhooks, providers, scheduled tasks, queues, storage workers, signed URLs and internal service identities | Trusted messages and tenant ancestry, replay and grant-revocation tests | **100% high-risk entry points and effects** |
| **8. Secrets and supply chain** | All production secrets, build systems, dependencies and deployed identities | Rotated/revoked if suspect, least privilege, history scans and enforced gating | No known exposed active prod credentials; critical supply-chain risks resolved |
| **9. Operational detection/recovery** | All material attack scenarios, alert playbooks, recovery dependencies and production boundaries | Tested alerts, containment, restoration and response owners | Every critical scenario has a tested response |
| **10. Independent assurance** | Agreed external assessment scope across all privileged and tenant paths | Findings addressed, independently retested and accepted | Zero unresolved critical findings; high-risk exceptions formally governed |

### Formal external mapping is mandatory

- **OWASP ASVS 5.0.0:** Import the official structured requirement IDs from [the OWASP ASVS release](https://asvs.owasp.org/downloads/). Determine L2 applicability per vNext, plus selected L3 for high-impact operations. Map each to internal controls, code, tests and reviewer or an explicit supported `NOT_APPLICABLE` rationale. **Do not** claim ASVS L2 by citing ASVS in the plan.
- **NIST SP 800-63B-4:** Document chosen AAL and authenticators by role/risk, phishing-resistant options, replay resistance, recovery and reauthentication. Email/SMS OTP alone is not phishing-resistant. Avoid claiming AAL3 from OTP-based checks.
- **OWASP API Security Top 10 2023:** Cover API1 BOLA, API2 authentication, API3 object-property authorization, API4 resource consumption, API5 function-level authorization, API6 business flow abuse, API7 SSRF, API8 misconfiguration, API9 inventory and API10 unsafe external API use.
- Add OWASP SAMM and NIST CSF 2.0 maturity/governance as separately assessed operational capabilities, not substitutes for executable product authorization.

## What must be added to the current plan for robust completeness

1. **Threat and asset register:** enumerate learning/assessment/placement/identity assets, personal data categories, principals, trust boundaries, data flows, tenant ancestry, file sharing and third-party processors. Rank blast radius and abuse paths. Link each scenario to exact controls.
2. **Machine-readable control-to-surface map:** stable `SEC-xx-yyy`, ASVS ID, priority, service owner, actor/tenant/resource operation, code/config, test IDs, exact evidence refs, applicability. Store the map as evidence input, **not another status tracker**. The canonical tracker remains authoritative for ownership and closure.
3. **Full endpoint closure contract:** AST census plus explicit per-method guard/object lineage/field review; write tests for unsafe methods and high-risk reads, including secondary data flows through search, counts, exports and caching. Review exceptions, don't just match function names.
4. **Complete database and egress census:** classify table ownership including parent lineage, database functions, storage buckets, jobs, search, cache, reports and analytics. A table with no direct `collegeId` may still be tenant-owned.
5. **Risk-based attack suite:** two organizations, at least three colleges, two unrelated same-college users, multiple roles/memberships, two recruiters/companies, expired grants, archived tenants, concurrency/race scenarios. Verify denials **and zero effects**. Add approval/consent/release timing and bulk field-level cases.
6. **Formal privileged action catalogue:** not merely “MFA for admins.” Itemize each operation requiring recent proof, stronger authenticator, separation of duties, audit trail and revocation behavior. Include recovery and break-glass.
7. **Build and production boundaries:** enforce rather than merely define branch protection, CODEOWNERS, required CI, restricted deploy identity, production runtime DB identity, network and secret controls.
8. **Verified operations:** test alerts, incident containment and restores; evidence of key revocation and production configuration; independent security review and retest.
9. **Drift prevention:** fail CI for *new* unclassified methods/tables/policies/secrets; add incremental tests with tracked owners to close legacy gaps. Re-run risk suites whenever trust boundaries change.
10. **Release decision record:** independent security sign-off at a pinned SHA, approved deployed configuration, open/closed findings and explicit time-limited exceptions. No broad security percentage, no blanket “banking-grade” label.

## Coverage accounting rules

The first scorecard should use these distinct values, not a blended percentage:

```text
Requirement catalogue: documented / total
Applicable ASVS requirements: mapped + reviewed / applicable total
Security-control evidence: verified / applicable total; unknown and failed reported
API classification: classified methods / discovered methods
API authorization verification: reviewed + executed relevant negatives / applicable methods
Database ownership: classified objects / persisted objects
Effective RLS: verified protected objects / RLS-applicable objects
Role permission scenarios: passed required scenarios / enumerated scenarios
Privileged step-up: verified high-impact operations / discovered high-impact operations
Integrations: verified identities + replay checks + tenant guards / relevant integrations
Secrets: known-active exposed production secrets (absolute count)
CI enforcement: required protected checks in force / mandatory checks
External issues: unresolved critical; unresolved high; retested/closed
Operational: response drills and restore evidence current / required drills
```

**Report four independent rates:** inventory coverage, design/review coverage, executed behavioral coverage, and deployed/operational coverage. All rates require a visible denominator and evidence timestamp. Published documentation coverage **must never be presented as runtime security posture**.

Recommended display labels per item: `UNKNOWN`, `NOT_APPLICABLE` (justification+review), `PLANNED`, `CODED_UNVERIFIED`, `FAILED`, `TEST_VERIFIED_EXACT_SHA`, `DEPLOYED_VERIFIED`, `INDEPENDENTLY_REVIEWED`. These are **reporting evidence levels**, not a second task-status database.

### Release thresholds

- **Zero unresolved exploitable critical risks**, including cross-tenant read/write, same-tenant unrelated-user private data exposure, privilege escalation, leaked active production credentials and unsafe admin recovery.
- **100% of methods classified and reviewed**, with a recorded owner, justified exceptions, and executed relevant negative tests for security-sensitive paths.
- **100% of protected data stores/tables classified**, with verified defense mechanism; no unknown tenant ancestry for private data. All RLS-applicable tables must have effective policies and runtime-role tests or a reviewed documented alternative boundary with explicit security acceptance.
- **100% of P0 controls and privileged operations** verified with exact-SHA and deployed evidence as relevant; other applicable L2 requirements must be dispositioned, not silently ignored.
- **All seven account families and high-impact cross-role flows** covered by authorization and tenant boundary tests; no unauthorized side effects.
- **Required CI and branch/deployment enforcement actually active**; secret and vulnerability scanners operating; operational response and recovery drills validated.
- **Independent critical-path review** performed; material findings retested; risk owner accepts any narrowly defined noncritical residual risks.

## Where to start measuring now

1. Regenerate the current API method census on exact `main` and compare the 1,322-method dated baseline.
2. Capture authorized PostgreSQL catalogs to enumerate table+RLS privilege denominators. **Do not** claim RLS coverage before this.
3. Define the internal resource and role action catalogue from current code; record approved public, worker and webhook exceptions.
4. Map the most critical applicable ASVS L2/L3 requirements to existing `SEC-` IDs and real code/CI evidence.
5. Create a minimal report for all ten axes with honest UNKNOWNs and no arbitrary scores. Tie assignments and closure back to canonical `docs/tracker.json`.
6. Freeze an evidence packet for each critical boundary and release commit; require external review for launch.

## Change-control and ownership

The source archive is immutable historical text. The 493 SEC IDs are durable requirement identifiers. The [tracker integration plan](tracker-integration.md) documents the validation changes necessary before security-specific RELEASE tasks can be recorded in the one active tracker; do not insert unrecognized IDs or fake `done:true`. Let concurrently running security audits continue, but require exact SHA, non-overlapping files and evidence reconciliation. Do not assume the other chat has closed any critical work until its verified result is recorded.

**Bottom line:** comprehensive blueprint ≠ proven complete coverage. The added measurement/traceability rules turn the blueprint into a verifiable security engineering program without fabricating an implementation percentage.