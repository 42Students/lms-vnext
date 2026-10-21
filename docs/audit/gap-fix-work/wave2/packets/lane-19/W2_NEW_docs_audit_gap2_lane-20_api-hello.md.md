# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-20/api-hello.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-20/api-hello.md

## G2-20-003-005  [P2] MISSING  facet F04  effort S
- Legacy: Fixed JSON body `{ "message": "Not found" }` (capital N, lowercase found); `docs/legacy-source/frontend/src/pages/api/hello.js:2`
- vNext now: NONE: missing handler; no source-backed JSON body for /api/hello; `src/app/api/hello/route.ts` absent
- Fix: Return exact JSON key/value and status 404 if preserving backward compatibility.

## G2-20-003-013  [P2] GAP  facet F10  effort S
- Legacy: Any request method returns status 404 and JSON; default handler does not branch on req.method; `docs/legacy-source/frontend/src/pages/api/hello.js:1-3`
- vNext now: No equivalent method-specific handler; unmatched App Router HEAD/OPTIONS/POST handling not specified locally; `src/app/api/hello/route.ts` absent
- Fix: Implement same response for GET/HEAD/POST/PUT/PATCH/DELETE/OPTIONS if clients depend on legacy semantics; HEAD bodyless per HTTP.

## G2-20-003-028  [P2] MISSING  facet F23  effort S
- Legacy: Explicit legacy stub endpoint deliberately returns 404 rather than saying Hello; `docs/legacy-source/frontend/src/pages/api/hello.js:1-3`
- vNext now: Endpoint dropped; lack of handler leaves framework to answer; `src/app/api/hello/route.ts` absent
- Fix: Classify as deliberate retired scaffolding vs contract gap based on production callers; never replace with 200 Hello world.
