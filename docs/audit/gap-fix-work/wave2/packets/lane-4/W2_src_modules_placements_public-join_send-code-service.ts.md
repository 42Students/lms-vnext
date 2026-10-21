# Work packet (wave 2): edit src/modules/placements/public-join/send-code-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/dns-mail-domain-resolver.md, docs/audit/gap2/lane-8/l12-u012-mail-domain-resolver.md, docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-13-012-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:25-31` in-process cache of at most 5000 domains, 24h TTL
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-91` fresh DNS on every send; no cache data
- Fix: Add bounded shared-result cache with TTL after assessing multi-instance deployment

## G2-13-012-021  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:49-50` sets JNDI timeout.initial 1500ms, retries 1
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-82` races resolver against 3500ms application timeout
- Fix: Choose explicit DNS timeout/retry policy; document changed latency budget

## G2-13-012-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:39-42` caches only known yes/no answers
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-91` no caching, including for known answers
- Fix: Cache authoritative yes/no with TTL but never cache UNKNOWN

## G2-13-012-030  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:37-38` 24h cached hit avoids spinner/second query
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-82` waits for MX each code request up to 3.5s
- Fix: Cache verified records to reduce repeated loading on busy signup forms

## G2-13-012-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:25-43` 5000-entry ConcurrentHashMap cache, 24h TTL
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-91` no cache; each request a resolver RPC
- Fix: Introduce bounded cache and telemetry for DNS attempts/cache hit ratio

## G2-13-012-042  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:49-50` JNDI low DNS latency budget
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-82` one 3500ms Promise.race and potential unresolved resolver request
- Fix: Bound resolver resources and stop outstanding requests where supported

## G2-13-012-043  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:34-43` cache key exact caller-supplied domain; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:111-125` canonicalizes before lookup
- vNext now: `src/modules/placements/public-join/send-code-service.ts:76` takes normalized email domain, case normalization by `src/modules/placements/public-college-join-model.ts:6-7`
- Fix: Canonicalize IDNs, trailing dot, host/subdomain consistently before cache/dns checks

## G2-13-012-044  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:39-42` concurrent requests can issue simultaneous asks before cache insert
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-91` no coalescing; simultaneous OTP requests each issue MX
- Fix: Add per-domain singleflight to prevent DNS stampedes, with timeout safety

## G2-12-012-005  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:24-41 process-local map caches by domain with no UI list
- vNext now: src/modules/placements/public-join/send-code-service.ts:76-91 performs lookup per request without in-process result cache
- Fix: Add bounded DNS cache for public join requests or document intentional load change

## G2-12-012-024  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:20-31 24-hour cache for <=5000 domains, clears entirely at capacity
- vNext now: src/modules/placements/public-join/send-code-service.ts:76-91 no cache; each request makes a 3.5-second-limited lookup
- Fix: Bound request load with TTL caching and negative cache policy; avoid DNS on every OTP attempt

## G2-12-012-025  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:46-49 initial DNS timeout 1500ms, retries once
- vNext now: src/modules/placements/public-join/send-code-service.ts:79-82 races against 3500ms
- Fix: Pick documented common DNS timeout budget and cancellation strategy

## G2-8-026-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy send-code POST counts network attempt then service email, response includes CODE_SENT (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCollegeJoinController.java:53-58; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CollegePublicLinkService.java:153-168).
- vNext now: New send-code POST verifies origin, rate, MX, creates OTP row then delivers email; returns sent:true (src/app/api/public/college-join/send-code/route.ts:7-22; src/modules/placements/public-join/send-code-service.ts:75-153).
- Fix: Keep exact endpoint/payload/result mapping and email-delivery failure state.

## G2-13-012-041  [P3] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:40` cache.clear when size reaches 5000, then stores next known answer
- vNext now: `src/modules/placements/public-join/send-code-service.ts:79-91` no capacity or eviction policy
- Fix: Specify shared LRU/TTL eviction rather than unbounded cache when porting

## G2-12-012-028  [P3] GAP  facet F21  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:42-74 uses JNDI system resolver and closes DirContext in finally
- vNext now: src/modules/placements/public-join/send-code-service.ts:3-4,77-91 uses Node resolver; no explicit context
- Fix: Document resolver differences, DNS transport and operational monitoring
