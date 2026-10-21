# Work packet (wave 2): edit src/app/(authenticated)/learn/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-root-redirect.md

## G2-14-006-016  [P2] GAP  facet F10  effort S
- Legacy: Legacy getServerSideProps context.res.writeHead(302, Location /learn/courses) then end(); vNext throws redirect /learn/courses — `docs/legacy-source/frontend/src/pages/learn/index.js:1-5`
- vNext now: `src/app/(authenticated)/learn/page.tsx:1-5`
- Fix: Document exact HTTP302 versus Next temporary redirect handling for bookmark parity

## G2-14-006-020  [P2] GAP  facet F12  effort S
- Legacy: Legacy HTTP status explicitly 302 Found; vNext Next `redirect` defaults to 307 in server routes — `docs/legacy-source/frontend/src/pages/learn/index.js:1-5`
- vNext now: `src/app/(authenticated)/learn/page.tsx:1-5`
- Fix: If strict status parity matters use next.config redirect or response302 while retaining GET destination
