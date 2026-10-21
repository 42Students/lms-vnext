# Work packet (wave 2): edit src/modules/placements/tpo-coding-profile-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-022  [P2] GAP  facet F06  effort M
- Legacy: CodingPlatforms.java:28-33 username lengths per platform 3..30/3..20/3..24/3..40.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:5 allows path up to 240 but no platform username pattern.
- Fix: Restore exact regex enforcement and hints for each platform.

## G2-2-030-052  [P2] GAP  facet F17  effort S
- Legacy: CodingPlatforms.java:20-33 adds per-platform hint so username input validation can explain format.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:2-7 has hosts but no hint string.
- Fix: Expose visible and aria-describedby field hints for platform restrictions.

## G2-2-030-056  [P2] GAP  facet F18  effort M
- Legacy: ChoicesController.java:64-65 coding labels include `GeeksforGeeks`, `HackerEarth`.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:2-3 omits GFG/HACKEREARTH and adds GitHub.
- Fix: Restore names/order and fields in profile dropdown if parity required.

## G2-2-030-064  [P2] GAP  facet F21  effort M
- Legacy: ChoicesController.java:61-67 codingPlatforms depends CodingPlatforms.java regex/url rules.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:2-7 uses URL host allowlist and path length.
- Fix: Unify platform registry and normalize URL/username compatibly across backend, profile editor and reports.
