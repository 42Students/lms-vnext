# Work packet: edit src/app/api/skills/route.ts (part 2 of 2)

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/skill-controller.md, docs/audit/gap2/lane-16/u010-skills-search-controller.md, docs/audit/gap2/lane-5/u016-skill-synonym.md

## G2-4-025-025  [P2] GAP  facet F07  effort S
- Legacy: 500 popular error: `Failed to fetch popular skills. Please try again or contact support.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:88-93`)
- vNext now: Generic error without endpoint-specific text (`src/app/api/skills/route.ts:30-35`)
- Fix: Restore popular-specific error response in compatibility layer.

## G2-4-025-026  [P2] GAP  facet F07  effort S
- Legacy: 500 categories error: `Failed to fetch categories. Please try again or contact support.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:145-150`)
- vNext now: Generic error (`src/app/api/skills/route.ts:30-35`)
- Fix: Add categories-specific message.

## G2-4-025-027  [P2] GAP  facet F07  effort S
- Legacy: 500 category listing error: `Failed to fetch skills. Please try again or contact support.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:165-170`)
- vNext now: Generic error (`src/app/api/skills/route.ts:30-35`)
- Fix: Add category lookup-specific message.

## G2-4-025-029  [P2] GAP  facet F08  effort S
- Legacy: Search success envelope status=success, message=`Skills retrieved successfully`, data array (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:66-69`)
- vNext now: Bare `{items}` no success envelope (`src/app/api/skills/route.ts:25-29`)
- Fix: Preserve envelope on `/api/v1/skills/search` adapter.

## G2-4-025-032  [P2] MISSING  facet F08  effort M
- Legacy: Selection success `Selection recorded` / `Selections recorded` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:102-105,123-126`)
- vNext now: No mutation success responses (`src/app/api/skills/route.ts:12-36`)
- Fix: Return success for individual/batch selection after persistence.

## G2-4-025-033  [P2] MISSING  facet F08  effort M
- Legacy: Load missing success: `No missing skills found. Database is complete!` or `Missing skills loaded successfully` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:250-254,283-299`)
- vNext now: No import success feedback (`src/app/api/skills/route.ts:12-36`)
- Fix: Implement both exact result shapes/copies for admin import.

## G2-16-010-028  [P3] GAP  facet F08  effort S
- Legacy: SkillsSearchController.java:50-52 success message reports elapsed milliseconds.
- vNext now: src/app/api/skills/route.ts:27-29 no message/duration.
- Fix: Match legacy response text; do not fabricate server timing.

## G2-16-010-029  [P3] GAP  facet F08  effort S
- Legacy: SkillsSearchController.java:67-69 popular success text.
- vNext now: src/app/api/skills/route.ts:27-29 no message.
- Fix: Return exact message in compatibility alias.

## G2-5-016-018  [P3] GAP  facet F08  effort S
- Legacy: Legacy success 'Skills retrieved successfully' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SkillController.java:51-56`
- vNext now: New bare {items} without success message `src/app/api/skills/route.ts:24-30`
- Fix: Use adapter for legacy envelope consumers.
