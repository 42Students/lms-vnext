# Work packet (wave 2): edit src/app/api/skills/route.ts

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-16-010-005  [P2] MISSING  facet F02  effort M
- Legacy: SkillsSearchController.java:104-113 /stats includes totalSkills/categories/popularSkillsTracked.
- vNext now: src/app/api/skills/route.ts:25-29 catalog modes omit stats.
- Fix: Add manager-scoped statistics endpoint with three exact fields.

## G2-16-010-008  [P2] MISSING  facet F03  effort M
- Legacy: SkillsSearchController.java:116-121 exists/{skillName} GET.
- vNext now: src/app/api/skills/route.ts:13-35 no exists mode.
- Fix: Add case-insensitive existence endpoint, return boolean in envelope.

## G2-16-010-010  [P2] GAP  facet F04  effort S
- Legacy: SkillsSearchController.java:50-52 response status success, message with duration ms, data SkillDTO[].
- vNext now: src/app/api/skills/route.ts:27-29 returns bare {items}.
- Fix: Add compatible response envelope/message for v2 routes.

## G2-16-010-013  [P2] MISSING  facet F04  effort S
- Legacy: SkillsSearchController.java:97-100 Selection recorded.
- vNext now: src/app/api/skills/route.ts:13-35 no POST/feedback.
- Fix: Return old text upon successful counter increment.

## G2-16-010-042  [P2] MISSING  facet F15  effort M
- Legacy: SkillsSearchController.java:92-100 writes skill usage tracker, not email.
- vNext now: src/app/api/skills/route.ts:13-35 no POST, no email.
- Fix: Restore usage selection side effect; do not add email.

## G2-4-025-001  [P2] GAP  facet F01  effort M
- Legacy: REST base `/api/v1/skills` with named routes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:27-32`)
- vNext now: Single `GET /api/skills?mode=...` (`src/app/api/skills/route.ts:12-29`)
- Fix: Expose route adapters or migrate every legacy caller; document mode parameter conversion.

## G2-4-025-014  [P2] MISSING  facet F04  effort M
- Legacy: Verification counts and matching percentage (0 if empty) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/SkillsVerificationUtil.java:54-62,112-115`)
- vNext now: No verification representation (`src/app/api/skills/route.ts:12-36`)
- Fix: Provide RTF-vs-DB admin report with all named fields.

## G2-4-025-015  [P2] MISSING  facet F04  effort S
- Legacy: `matchPercentage` formatted `%.2f%%`; missing/extra arrays top 100 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:205-217`)
- vNext now: No verify response or formatting (`src/app/api/skills/route.ts:12-36`)
- Fix: Return two-decimal percent, totals and capped lists.

## G2-4-025-036  [P2] GAP  facet F10  effort M
- Legacy: Five GET operations query SkillSearchService and return Response envelopes (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:57-76,78-94,137-171`)
- vNext now: One GET uses Zod parsed mode and readSkillCatalog (`src/app/api/skills/route.ts:12-36`)
- Fix: Inventory/update every v1 caller with exact request and result mapping.

## G2-4-025-040  [P2] MISSING  facet F10  effort M
- Legacy: GET /verify reads RTF and compares DB active entries (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:197-224`)
- vNext now: Verification endpoint absent (`src/app/api/skills/route.ts:12-36`)
- Fix: Create authenticated admin verification read endpoint if retained.

## G2-4-025-043  [P2] GAP  facet F11  effort M
- Legacy: Read endpoints have no explicit per-college check and are global (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:57-76,78-94,137-171`)
- vNext now: Requires active platform user plus membership/recruiter/SA (`src/app/api/skills/route.ts:20-24`)
- Fix: Verify unaffiliated authenticated account legacy rules before restricting read.

## G2-4-025-048  [P2] MISSING  facet F12  effort S
- Legacy: Batch increment `WHERE id IN` adds one even with duplicate IDs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SkillRepository.java:80-91`)
- vNext now: No batch update (`src/app/api/skills/route.ts:12-36`)
- Fix: Deduplicate IDs before atomic SQL update, once per skill.

## G2-4-025-053  [P2] MISSING  facet F14  effort M
- Legacy: RTF verification reports up to 100 missing/extra names (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:197-224`)
- vNext now: No downloadable verification report or endpoint (`src/app/api/skills/route.ts:12-36`)
- Fix: Provide admin inspection and optional CSV export of report (not auto-import).

## G2-4-025-065  [P2] GAP  facet F19  effort M
- Legacy: Search/popular/category queries cached with Spring cache annotations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:95-99,151-158,163-178`)
- vNext now: Cache-Control private,no-store (`src/app/api/skills/route.ts:27-29`)
- Fix: Evaluate caching/latency for 10k concurrent, keep freshness and user privacy.

## G2-4-025-068  [P2] MISSING  facet F20  effort M
- Legacy: Asynchronous single/batch popularity mutation swallows DB errors (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SkillSearchService.java:185-205`)
- vNext now: No mutation; nothing retries (`src/app/api/skills/route.ts:12-36`)
- Fix: Add nonblocking, idempotency-safe usage tracking and error metrics.

## G2-4-025-083  [P2] MISSING  facet F23  effort M
- Legacy: Legacy verify/load missing exposed to administrative caller (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:197-299`)
- vNext now: Operational endpoints not implemented (`src/app/api/skills/route.ts:12-36`)
- Fix: Resolve retention decision and add safe admin tool if required.

## G2-5-016-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy /api/v1/skills/search feeds autocomplete `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:30-58`
- vNext now: New /api/skills?mode=search uses different API contract `src/app/api/skills/route.ts:12-30`
- Fix: Migrate consumers or add compatibility adapter.

## G2-5-016-012  [P2] MISSING  facet F06  effort M
- Legacy: Constructor accepts Skill and synonym and normalizes `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SkillSynonym.java:31-34`
- vNext now: New route supports only GET of catalog `src/app/api/skills/route.ts:12-36`
- Fix: Implement protected synonym write/import boundary, if feature retained.

## G2-5-016-033  [P2] GAP  facet F14  effort M
- Legacy: Legacy controller has RTF verification/import routines `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:205-260`
- vNext now: New route only GET search/categories/popular `src/app/api/skills/route.ts:12-36`
- Fix: Document retirement or build privileged verification/import.

## G2-16-010-033  [P3] GAP  facet F10  effort S
- Legacy: SkillsSearchController.java:48 debug logs search query, size and duration.
- vNext now: src/app/api/skills/route.ts:13-35 no debug metrics.
- Fix: Add privacy-safe latency/count telemetry without logging sensitive search text.

## G2-16-010-045  [P3] GAP  facet F18  effort S
- Legacy: SkillsSearchController.java:51 result message Skills retrieved in Nms.
- vNext now: src/app/api/skills/route.ts:27-29 no success message.
- Fix: Match compatibility copy.

## G2-16-010-047  [P3] GAP  facet F18  effort S
- Legacy: SkillsSearchController.java:88 Skills retrieved, 99 Selection recorded, 112 Stats retrieved, 120 Checked.
- vNext now: src/app/api/skills/route.ts:27-29 unwrapped modes only.
- Fix: Return verbatim messages in aliases.
