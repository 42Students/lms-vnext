# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l19-u029-readiness-gate.md

19 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l19-u029-readiness-gate.md

## G2-19-029-016  [P1] GAP  facet F04 Status vocabulary  effort M
- Legacy: LG:158-165 `READY`, `READY_WITH_WARNINGS`, `BLOCKED` derived readyForDomainLogin and warnings
- vNext now: NM:6-9,193-199 `READY`, `NOT_READY`, `INCOMPLETE` derived FAIL/UNKNOWN counts
- Fix: Define explicit mapping between domain-login verdict and broad tenant-data verdict; do not equate legacy warnings with UNKNOWN data

## G2-19-029-017  [P1] GAP  facet F04 Success headline  effort M
- Legacy: LG:217-222 `Ready to go live` / `Students and staff can log in at this college's web address.`
- vNext now: NP:55-65 `Ready on this checklist`, emphasizes persisted evidence only
- Fix: Preserve exact old headline only for verified legacy domain-login indicator; retain vNext caution for actual live tests to avoid false assurance

## G2-19-029-018  [P1] GAP  facet F04 Warning headline  effort M
- Legacy: LG:223-228 `Can go live, but some things are missing`, login works despite warnings
- vNext now: NM:193-199 any unverified required check leads INCOMPLETE, NP:64 `Incomplete evidence`
- Fix: Render nonblocking advisory warnings independently; unknown required evidence must still prevent full readiness, not be mixed into advisory list

## G2-19-029-019  [P1] GAP  facet F04 Blocked headline  effort M
- Legacy: LG:229-234 `Not ready — login will not work` strictly for missing domain login requirements
- vNext now: NP:61-65 generic `Not ready` for any of ten mandatory records
- Fix: Never say `login will not work` when only an academic/placement record is missing; label `Login blocked` only on domain gate

## G2-19-029-020  [P1] GAP  facet F04 Legacy domain codes  effort L
- Legacy: LG:22-59 maps NO_DOMAIN/NO_PRIMARY_DOMAIN/MULTIPLE_PRIMARY_DOMAINS/NO_VERIFIED_PRIMARY_DOMAIN/PRIMARY_DOMAIN_NOT_VERIFIED/NO_VERIFIED_DOMAIN
- vNext now: NM:11-21 has only TENANT_DOMAIN check; NS:372-393 counts verified primary domains
- Fix: Preserve all distinct domain diagnostics (none, no primary, multiple primary, verification policy) in a detailed domain-check adapter

## G2-19-029-022  [P1] GAP  facet F04 Academic advisory  effort M
- Legacy: LG:66-71 EMPTY_COLLEGE_NO_ACADEMIC_DATA (no departments/faculty/students) warning; LB:224-241 adds when incomplete
- vNext now: NM:125-159 makes departments, learner enrollment and faculty each mandatory FAIL check
- Fix: Keep academic setup warnings separate from domain login verdict; owner must decide stricter full-handover gate semantics

## G2-19-029-024  [P1] GAP  facet F04 Verified domain policy  effort M
- Legacy: LB:198-212 requires verified primary only when `tenantResolutionService.isVerifiedDomainRequired()`; may warn otherwise
- vNext now: NS:372-393 and NM:174-180 always require verified primary tenant domain
- Fix: Respect deployed domain-verification policy and own-subdomain trust; clarify when a verified primary is required vs advisory

## G2-19-029-029  [P1] GAP  facet F07 Invalid payload  effort M
- Legacy: LG:174-184 requires boolean readyForDomainLogin and arrays blockers/warnings; throws `Unexpected readiness response`
- vNext now: NS:98-114 provides typed evaluation or null; NM:55-82 validates counts (null becomes UNKNOWN)
- Fix: Add runtime schema validation at external/adapter boundary for array/codes; fail closed rather than render READY from malformed data

## G2-19-029-035  [P1] GAP  facet F10 Legacy read API  effort L
- Legacy: LA:15-16 GET `/api/v1/superadmin/tenant/onboarding/readiness/{collegeId}`; LB:154-265 computes domain+branding+academic DTO
- vNext now: NS:100-114 getSuperAdminCollegeReadiness server service builds typed facts+evaluation
- Fix: Provide dual domain-login/advisory and full setup readiness DTOs or explicit contract mapping, never claim semantic equivalence for unlike outputs

## G2-19-029-036  [P1] GAP  facet F10 Missing meta  effort M
- Legacy: LB:249-259 exposes domainTotal/domainVerified/domainPrimary/requireVerifiedDomains and recommendedActions
- vNext now: NS:431-468 returns counts and per-check evidence, no equivalent policy/domain metadata view
- Fix: Add typed domain-specific counts and requireVerifiedDomains flag to compact checklist; enforce consistency with login resolution policy

## G2-19-029-037  [P1] GAP  facet F10 Domain status read  effort M
- Legacy: LB:164-169 checks active hosts, number primary/verified; notices multiple primary
- vNext now: NS:372-393 only COUNT WHERE isVerified=true and isPrimary=true
- Fix: Query active host count, primary count and verified count, distinguish multiple-primary and missing host states before deciding domain readiness

## G2-19-029-039  [P1] GAP  facet F10 Academic source  effort M
- Legacy: LB:224-241 checks any departments/faculty/students sufficient for warning
- vNext now: NS:185-350 deeply counts active departments/programs/cohorts/enrolled learners/role memberships
- Fix: Surface short legacy academic-warning rule in domain readiness and preserve rich counts on separate operational checklist

## G2-19-029-042  [P1] GAP  facet F12 Readiness gate semantics  effort M
- Legacy: LB:243 readyForDomainLogin = blockers.isEmpty, blockers from domain only LB:183-212
- vNext now: NM:193-199 NOT_READY if ANY 10 FAIL, INCOMPLETE if UNKNOWN
- Fix: Separate `domainLoginReady` and `tenantSetupComplete`; prevent label `login blocked` for failed TPO/program requirements

## G2-19-029-043  [P1] GAP  facet F12 Policy edge  effort M
- Legacy: LB:204-212 verified domain only blocker under strict requirement; missing logo never blocks LB:216-220
- vNext now: NM:174-180 verified primary always required, logo never tracked
- Fix: Encode strict-domain-policy input and optional branding explicitly; add fixture matrices strict vs lenient

## G2-19-029-044  [P1] GAP  facet F12 Unknown vs warning  effort M
- Legacy: LG:158-165 warnings permit readiness if domain login true
- vNext now: NM:55-74 null/invalid counts UNKNOWN, NM:193-199 incomplete prevents READY
- Fix: Keep legitimate advisory warnings separate from unknown required evidence, while ensuring unknown NEVER produces a ready verdict

## G2-19-029-061  [P1] GAP  facet F21 Domain verification configuration  effort M
- Legacy: LB:198-205 tenantResolutionService.isVerifiedDomainRequired central policy
- vNext now: NM:174-180 no explicit policy input, NS:372-393 persisted verified count
- Fix: Pass actual deployment verification policy into readiness evaluation; avoid hard-coded assumption about verification requirement

## G2-19-029-062  [P1] GAP  facet F22 DTO shape  effort M
- Legacy: LB:249-265 returns readyForDomainLogin, blockers[], warnings[], recommendedActions[], meta domain stats/flag
- vNext now: NS:458-468 returns {college,evaluation,supplemental}, NM:44-53 {overall,counts,checks}
- Fix: Publish explicit legacy→vNext domain DTO crosswalk, including requirement policy and coded warnings; keep both views separately typed

## G2-19-029-063  [P1] GAP  facet F22 IDs/storage  effort M
- Legacy: Legacy LB:154-156 collegeId Integer; domain table stores primary+verified, branding entity logo
- vNext now: NS:100-114 UUID collegeId, tenantDomains in NS:372-393 and normalized college/role tables
- Fix: Document integer→UUID migration contract and domain/branding field crosswalk; preserve no migration assumptions for currently empty vNext

## G2-19-029-065  [P1] MISSING  facet F23 Removed warning  effort M
- Legacy: Legacy LG:60-71 Logo and academic advisory explained, fix links
- vNext now: NM:11-21 no logo check; academic checks became blockers
- Fix: Restore advisory partition and `Fix in Branding`; keep new academic data completeness as separate criterion
