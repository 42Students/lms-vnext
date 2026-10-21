# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-16/u006-learner-course-redirect.md

6 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u006-learner-course-redirect.md

## G2-16-006-004  [P2] GAP  facet F02  effort M
- Legacy: `index.js:23-28`: displays Overview course skeleton while router hydrates and redirect executes.
- vNext now: `[deliveryId]/page.tsx:8-10`; `[deliveryId]/loading.tsx:1-6`: server redirects, and suspense loading is generic GracefulPageLoading.
- Fix: Use matching course-overview skeleton in route loading boundary, preserve no-layout-shift target handoff.

## G2-16-006-009  [P2] GAP  facet F04  effort S
- Legacy: `index.js:13-16`: `router.asPath.split('?')` preserves first query segment only; subsequent literal `?` inside query can be lost.
- vNext now: `[deliveryId]/page.tsx:9`: drops all query segments.
- Fix: Use URLSearchParams to serialize all allowed query context instead of brittle split logic.

## G2-16-006-014  [P2] GAP  facet F06  effort S
- Legacy: `index.js:13-21`: dependency on asPath and courseId reruns redirect if route/query changes.
- vNext now: `[deliveryId]/page.tsx:3-10`: fresh server navigation for every deliveryId; ignores query.
- Fix: Use searchParams in redirect to preserve transitions triggered by query-only deep link.

## G2-16-006-023  [P2] GAP  facet F11  effort M
- Legacy: `[...courseTab].js:66-70`: unavailable course shows reason in UI.
- vNext now: `[...courseTab]/page.tsx:68-74`: notFound for no matching delivery, read-only for ended delivery.
- Fix: Map inaccessible/historical classes to human-readable unavailable reason rather than unhelpful 404.

## G2-16-006-038  [P2] GAP  facet F20  effort M
- Legacy: `index.js:7-21`: client render can occur while redirect pending, skeleton prevents blank flash.
- vNext now: `[deliveryId]/page.tsx:9`; `[deliveryId]/loading.tsx:4-6`: server redirect and generic fallback may flash alternate geometry.
- Fix: Use same target tab skeleton in loading boundary to ensure zero shape swap.

## G2-16-006-003  [P3] GAP  facet F01  effort S
- Legacy: `index.js:10-11`: no redirect when courseId is absent or array.
- vNext now: `[deliveryId]/page.tsx:6-9`: expected deliveryId string from dynamic route, directly URL-encoded.
- Fix: For unexpected blank ID render not-found before redirect; valid param handling is effectively equivalent.
