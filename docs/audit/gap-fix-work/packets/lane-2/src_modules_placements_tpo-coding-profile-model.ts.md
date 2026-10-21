# Work packet: edit src/modules/placements/tpo-coding-profile-model.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/choices-controller.md

## G2-2-030-009  [P1] GAP  facet F03  effort M
- Legacy: ChoicesController.java:61-67 coding platform options include key,label,urlPrefix,pattern,hint,value.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:2-7 offers only code/host and URL-normalize method.
- Fix: Return platform-specific regex, hint and URL prefix for all six supported legacy options or document deprecation.

## G2-2-030-019  [P1] GAP  facet F05  effort M
- Legacy: ChoicesController.java:61-67 loops CodingPlatforms.ALL order LEETCODE,HACKERRANK,CODECHEF,CODEFORCES,GFG,HACKEREARTH.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:2-3 enum order GITHUB,LEETCODE,CODECHEF,CODEFORCES,HACKERRANK.
- Fix: Preserve legacy platform options/order or explicitly scope GitHub as addition and GFG/HackerEarth removal.

## G2-2-030-021  [P1] GAP  facet F06  effort M
- Legacy: useChoices.js:59-64 validates pasted coding username against regex from option metadata.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:3-7 requires HTTPS full URL and host, no username-only support.
- Fix: Accept username-only or pasted legacy profile link and apply per-platform patterns with same error guidance.

## G2-2-030-069  [P1] GAP  facet F23  effort L
- Legacy: ChoicesController.java:61-67 exposes SIX coding platforms with hint/pattern and username compatibility.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:2-7 has FIVE hosts and HTTPS-only full URLs.
- Fix: Explicit business decision and migration for GFG/HackerEarth vs GitHub, preserve stored profile links.

## G2-2-030-025  [P2] GAP  facet F07  effort S
- Legacy: CodingPlatforms.java:55-65 error identifies wrong profile host and username hints.
- vNext now: src/modules/placements/tpo-coding-profile-model.ts:4-7 returns null for invalid URL/host.
- Fix: Expose actionable per-platform field validation messages instead of generic invalid URL.
