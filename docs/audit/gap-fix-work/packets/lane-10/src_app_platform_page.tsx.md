# Work packet: edit src/app/platform/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/platform.md

## G2-10-001-006  [P1] GAP  facet F02  effort M
- Legacy: Sequence hero then AI agents then pillars then integrations then lifecycle then CTA `docs/legacy-source/frontend/src/pages/platform.js:40-51`
- vNext now: Hero then role cards then connected pillars then text lifecycle then CTA `src/app/platform/page.tsx:5-25`
- Fix: Map all old visual sections to approved non-AI equivalents with explicit exceptions

## G2-10-001-016  [P1] GAP  facet F04  effort M
- Legacy: Seven AGENTS titles and descriptions are rendered `docs/legacy-source/frontend/src/components/marketing/data.js:27-63` `docs/legacy-source/frontend/src/components/marketing/sections.jsx:112-118`
- vNext now: Six inline role titles and descriptions `src/app/platform/page.tsx:8-15`
- Fix: Document approved non-AI copy replacement for each retired agent claim

## G2-10-001-017  [P1] GAP  facet F04  effort M
- Legacy: Six PILLARS titles and descriptions `docs/legacy-source/frontend/src/components/marketing/data.js:78-109`
- vNext now: Four connected pillars descriptions `src/app/platform/page.tsx:16-21`
- Fix: Map old content to approved four-pillar product scope

## G2-10-001-040  [P1] GAP  facet F18  effort S
- Legacy: Hero title One autonomous AI platform for talent and workforce development `docs/legacy-source/frontend/src/pages/platform.js:43-43`
- vNext now: Title One connected platform for learning projects and placements `src/app/platform/page.tsx:6-7`
- Fix: Preserve only owner-approved AI-retirement copy exception

## G2-10-001-041  [P1] GAP  facet F18  effort S
- Legacy: Hero lede lists AI assessments skills intelligence and AI agents `docs/legacy-source/frontend/src/pages/platform.js:44-44`
- vNext now: Hero lede emphasizes recruitment projects learning `src/app/platform/page.tsx:7-7`
- Fix: Record explicit intentional replacement rather than claiming content parity

## G2-10-001-042  [P1] GAP  facet F18  effort S
- Legacy: Agent section title Specialized AI agents that develop talent together `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-110`
- vNext now: Role section title Every role has a purpose-built workspace `src/app/platform/page.tsx:8-8`
- Fix: Approve canonical non-AI replacement wording
