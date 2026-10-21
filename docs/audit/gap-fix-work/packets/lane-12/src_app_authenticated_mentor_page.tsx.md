# Work packet: edit src/app/(authenticated)/mentor/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u025-mentor-landing.md

## G2-7-025-016  [P2] GAP  facet F07  effort S
- Legacy: mentor/index.js:22-29 failed module lookup title Could not verify Projects access
- vNext now: mentor/page.tsx:24-25 failure title Projects could not be loaded
- Fix: Restore exact failure title

## G2-7-025-017  [P2] GAP  facet F07  effort S
- Legacy: mentor/index.js:26-28 failed subtitle explicitly says failure is not disabled
- vNext now: mentor/page.tsx:25 Check your connection and try again; not disabled
- Fix: Use full legacy sentence about college module settings

## G2-7-025-018  [P2] GAP  facet F07  effort M
- Legacy: mentor/index.js:28 Retry access check router.reload whole page
- vNext now: mentor/page.tsx:35 Link /mentor?retry=1
- Fix: Compare full reload vs server rerender and prevent cached error

## G2-7-025-019  [P2] GAP  facet F08  effort M
- Legacy: mentor/index.js:18-20 Opening your mentor workspace while loading
- vNext now: mentor/page.tsx:20-21 direct redirect and no info content
- Fix: Show same info message while unresolved and prevent blank flash

## G2-7-025-021  [P2] GAP  facet F08  effort S
- Legacy: mentor/index.js:22-30 failure warning status and Retry
- vNext now: mentor/page.tsx:24-35 failed Error Alert and Retry link
- Fix: Match warning tone, retry label and prominence
