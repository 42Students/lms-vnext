# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md

## G2-7-033-013  [P1] GAP  facet F04  effort L
- Legacy: colleges.js:74-76 numericTemplateId derived from loaded template.id
- vNext now: colleges/page.tsx:28 UUID param used as canonical identity
- Fix: Preserve numeric or slug historical mapping on deeplinks

## G2-7-033-065  [P1] GAP  facet F22  effort L
- Legacy: colleges.js:74-76 numeric template id, college numeric ID assignment state array
- vNext now: colleges/page.tsx:28-29 UUID, model.ts:9-18 assignment has version/time
- Fix: Build old numeric/slug -> UUID template/college and pinned version crosswalk

## G2-7-033-026  [P2] GAP  facet F07  effort M
- Legacy: colleges.js:258-263 distinguishes Template could not be loaded vs College assignments could not be loaded
- vNext now: colleges/page.tsx:45-55 one College availability unavailable error
- Fix: Show independently retryable template and assignment errors

## G2-7-033-029  [P2] GAP  facet F07  effort S
- Legacy: colleges.js:300 Template not found Alert
- vNext now: colleges/page.tsx:45-47 notFound() route error
- Fix: Restore contextual Template not found title/back link

## G2-7-033-032  [P2] GAP  facet F08  effort M
- Legacy: colleges.js:258-263 loading/fetch error Alert
- vNext now: colleges/page.tsx:50-55 full-page ErrorState
- Fix: Retain partial source feedback within template shell
