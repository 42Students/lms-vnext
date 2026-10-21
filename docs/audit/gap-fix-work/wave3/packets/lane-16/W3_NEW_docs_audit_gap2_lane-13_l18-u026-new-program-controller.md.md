# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-13/l18-u026-new-program-controller.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l18-u026-new-program-controller.md

## G2-18-026-006  [P1] MISSING  facet F04 Details  effort L
- Legacy: NPC:213-221, NPS:209-273 returns nested program_structure: id/name/start_date/end_date/status/course_ids/courses including course meta_data, flags and created_at [Y,M,D]
- vNext now: AR:13-22 only flat programs; PR has PATCH/DELETE only
- Fix: Add permission-scoped GET details endpoint using program terms and course mappings; preserve all documented nested fields or explicit migration mapping

## G2-18-026-047  [P1] MISSING  facet F23 Intentional omissions  effort L
- Legacy: Legacy NPC:213-221 nested program details and 227-245 server pagination; vNext AR/PR has neither equivalent
- vNext now: NONE on reviewed vNext program API routes
- Fix: Keep both on fix backlog until explicit owner decision or documented substitute via program-contents service
