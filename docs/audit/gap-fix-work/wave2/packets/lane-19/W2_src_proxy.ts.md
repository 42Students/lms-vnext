# Work packet (wave 2): edit src/proxy.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/college-hidden-student-group.md, docs/audit/gap2/lane-20/api-hello.md

## G2-14-007-015  [P2] GAP  facet F06  effort S
- Legacy: Legacy redirect only when router.isReady; vNext missing old route has no such client dependency — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:8-11`
- vNext now: `src/proxy.ts:9-35`
- Fix: Prefer new instant server redirect while preserving same final target

## G2-14-007-026  [P2] GAP  facet F13  effort S
- Legacy: Legacy four-row animated Skeleton while router readiness resolves; vNext old path unhandled results in Next not-found rather than transition — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:9-12`
- vNext now: `next.config.ts:7-18`; `src/proxy.ts:9-35`
- Fix: Install redirect so loading/not-found path never renders

## G2-20-003-001  [P2] MISSING  facet F01  effort S
- Legacy: Legacy Next Pages Router endpoint `/api/hello`, handler exported as default; `docs/legacy-source/frontend/src/pages/api/hello.js:1`
- vNext now: NONE: `src/app/api/hello/route.ts` absent (verified `src/app/api/` tree), and proxy passes unmatched paths onward; `src/proxy.ts:9-14,30-35`
- Fix: If legacy HTTP contract is retained, create explicit App Router GET/POST/etc handler at /api/hello; otherwise formally deprecate this probe.

## G2-20-003-016  [P2] MISSING  facet F12  effort S
- Legacy: Business invariant: unconditional 404; payload and query ignored; `docs/legacy-source/frontend/src/pages/api/hello.js:1-3`
- vNext now: Missing explicit invariant; framework fallback/maintenance mode can differ; `src/proxy.ts:15-29`
- Fix: If retaining, add constant response and ignore query/body, with no success path.

## G2-14-007-031  [P3] GAP  facet F16  effort S
- Legacy: Legacy skeleton in ln-module uses AdminLayout responsive shell; vNext retired alias should redirect regardless phone size — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:12-15`
- vNext now: `src/proxy.ts:9-35`
- Fix: Make redirect viewport-independent, no mobile group detail flash

## G2-20-003-002  [P3] GAP  facet F01  effort M
- Legacy: Endpoint directly reachable by URL or any HTTP client; no UI links in file; `docs/legacy-source/frontend/src/pages/api/hello.js:1-3`
- vNext now: No matching route; `src/app/api/` has only named domain route groups; `src/proxy.ts:30-35`
- Fix: Search live callers/uptime probes, document whether /api/hello is an intentional retired endpoint.
