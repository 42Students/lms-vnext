# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-assignment-publish-controller.md

13 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-assignment-publish-controller.md

## G2-2-008-001  [P1] GAP  facet F01  effort S
- Legacy: LC:41-46 admin assignment POST /{lessonContentId}/publish-grades
- vNext now: NP:29-70 UI loops submission POST path NR:17-44; no single bulk route
- Fix: Add guarded server bulk publish endpoint or document batch client semantics.

## G2-2-008-003  [P1] GAP  facet F02  effort S
- Legacy: LC:63-133 auth, query first 1000, loop, audit, response
- vNext now: NP:29-70 load all section pages and publish sequentially client-side
- Fix: Keep server-side snapshot/retryable batch and audited summary semantics.

## G2-2-008-014  [P1] GAP  facet F07  effort S
- Legacy: LC:83 upfront ensureCanViewOrGradeAssignment prevents ID leakage
- vNext now: NP:38-45 GET section submissions and NR:33-38 per-submission publish
- Fix: Authorize selected assignment + section before listing/fetching any learner IDs.

## G2-2-008-021  [P1] MISSING  facet F10  effort S
- Legacy: LC:118-124 summary AdminAuditLogService event once when published>0
- vNext now: NS:866-881 individual activity events only; NP:29-70 no batch summary log
- Fix: Record one batch-level audit event with counts & actor after publish processing.

## G2-2-008-023  [P1] GAP  facet F11  effort S
- Legacy: LC:73-83 authenticated principal and whole-assignment authorizer before repository query
- vNext now: NS:818-825 per-submission scope; NP:38-45 GET scoped Section list
- Fix: Add first-class whole-assignment bulk permission guard.

## G2-2-008-037  [P1] GAP  facet F19  effort S
- Legacy: LC:48-49 <=1000 records via single PageRequest; no unbounded processing
- vNext now: NP:40-61 any number of pages and per-grade calls
- Fix: Bound calls by max records/work budget, provide progress + resumable cursor.

## G2-2-008-042  [P1] MISSING  facet F21  effort S
- Legacy: LC:118-124 AdminAuditLogService audit integration optional
- vNext now: NP:29-70 client aggregator; NS:866-881 only per-row audit
- Fix: Add audit batch summary integration with original count keys.

## G2-2-008-045  [P1] GAP  facet F23  effort S
- Legacy: LC:63-133 dedicated atomic caller contract for all assignment grades
- vNext now: NP:29-70 Section-only client orchestrator; no bulk server API
- Fix: Preserve whole-assignment scope or explicitly approve Section-by-Section segmentation.

## G2-2-008-013  [P2] GAP  facet F07  effort S
- Legacy: LC:75-76 401 'Authentication required'
- vNext now: NR:29-42 context/API error wrapper
- Fix: Confirm unauthenticated response and preserve 401 semantics.

## G2-2-008-016  [P2] GAP  facet F08  effort S
- Legacy: LF:302-313 summary 'N published · X not yet marked · Y already published'
- vNext now: NP:63-64 only N published, failed
- Fix: Display skipped/not graded/already published counts.

## G2-2-008-017  [P2] GAP  facet F08  effort S
- Legacy: LF:305-309 Modal.warning shows one row per failure Student #id reason
- vNext now: NP:62-69 inline generic failures and retry only
- Fix: Provide sanitized failure list with meaningful retry guidance.

## G2-2-008-012  [P3] GAP  facet F07  effort S
- Legacy: LC:71 'lessonContentId must be a positive integer'
- vNext now: NR:31-37 UUID route and Zod errors
- Fix: Map invalid path to stable validation error, document identifier migration.

## G2-2-008-015  [P3] GAP  facet F08  effort S
- Legacy: LC:131-132 'Published N grade(s)' JSON message
- vNext now: NP:63-64 'N grade(s) published' inline status
- Fix: Restore result copy and details.
