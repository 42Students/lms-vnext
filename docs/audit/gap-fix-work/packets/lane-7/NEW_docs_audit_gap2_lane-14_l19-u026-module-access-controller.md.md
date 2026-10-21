# Work packet: NEW / MISSING items from docs/audit/gap2/lane-14/l19-u026-module-access-controller.md

17 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-14/l19-u026-module-access-controller.md

## G2-19-026-016  [P0] GAP  facet F07  effort L
- Legacy: Unknown module `Unknown module: X`; placements lower-level conflict gives exact cell warning (service:502-507)
- vNext now: New descendant rule input supports placements and service resolver treats no scope ignored (service.ts:80-87,descendant-rule-write:118-123)
- Fix: Resolve explicit product decision for placements lower levels; do not silently invert old access governance

## G2-19-026-019  [P0] GAP  facet F08  effort L
- Legacy: Bulk success `{module,enabled,updated}` all-or-nothing after validation (ModuleAccessService:697-713)
- vNext now: New `{requested,applied,failures,auditRecorded}` can partial success (bulk-service:21-80)
- Fix: Do not claim atomic bulk parity; either transactional preflight+write or explicit per-learner partial semantics and retry-only failures

## G2-19-026-027  [P0] GAP  facet F12  effort L
- Legacy: Old placements marked college-level only, class/learner overrides ignored (service:504-508,576-579)
- vNext now: New resolver `isModuleScopeIgnored` always false (service.ts:80-87), placements in descendants (descendant-rule-write:118-123)
- Fix: Decide intended access policy, align UI validation, resolver enforcement and legacy reference clearly

## G2-19-026-038  [P0] GAP  facet F18  effort L
- Legacy: Legacy Placements message redirects to placement cell Batches (service:505-507)
- vNext now: New page says Placements follows academic learner scope (detail:160-168,263-267)
- Fix: Reconcile contradictory copy and policy, mark intentional divergence if owner chooses new hierarchy

## G2-19-026-041  [P0] GAP  facet F20  effort L
- Legacy: Old all-or-nothing bulk validation fails entire selection on foreign or absent learner (service:585-604)
- vNext now: New catches per-learner failures and commits preceding successes (bulk-service:22-55)
- Fix: Choose atomic legacy behavior or explicit partial-success design and acceptance; test mixed-college selection

## G2-19-026-003  [P1] GAP  facet F02  effort L
- Legacy: Old `/tree` returns whole college grid in single call, all nodes resolved (controller:38-57)
- vNext now: New detail page has ancestry and paged scope list; its own footer admits nodes without stored overrides not enumerated (detail page:319-328)
- Fix: Add complete academic hierarchy grid including Inherit-only nodes instead of only stored overrides

## G2-19-026-005  [P1] GAP  facet F03  effort L
- Legacy: Old two-console hierarchy labels and three modules `projects`,`placements`,`courses` (ModuleAccessUpdateRequest:15-19)
- vNext now: New module keys `projects`,`placements`,`electives` (service.ts:23-27)
- Fix: Document Courses→Electives product semantic divergence; verify which legacy rows are expected

## G2-19-026-007  [P1] GAP  facet F04  effort L
- Legacy: `GET /tree`: collegeId, learnerCount, nodes, canEditCollegeLevel (service:200-205)
- vNext now: New overview result `college,modules,ancestors,descendants` from admin-read-service and source (detail:67-70)
- Fix: Return visible node entries for all scopes, not solely active override rows

## G2-19-026-011  [P1] GAP  facet F06  effort M
- Legacy: PUT one node allows null enabled to clear override and nullable locked to leave lock unchanged (controller:94-130; ModuleAccessUpdateRequest:8-21)
- vNext now: New writer uses action INHERIT or SET; stored enabled/locked together (descendant-rule-write:140-179)
- Fix: Ensure editing enabled preserves existing lock absent explicit lock change; clearing override deletes both

## G2-19-026-013  [P1] GAP  facet F06  effort L
- Legacy: Legacy super admin bulk allows up to 1000 DISTINCT students (ModuleAccessService:579-585)
- vNext now: New max25 membership IDs (bulk-service:16)
- Fix: Provide chunking or batch job to handle 1000 students while retaining atomic guarantees

## G2-19-026-022  [P1] GAP  facet F10  effort L
- Legacy: Seven endpoints: GET tree, node, learner-overrides, history, explain; PUT node,bulk (controller:38-220)
- vNext now: New routes split among features detail/trace/history and POST student bulk; direct HTTP contract differs
- Fix: Build endpoint parity matrix, trace all writes/reads, ensure full tree not silently omitted

## G2-19-026-034  [P1] GAP  facet F15  effort L
- Legacy: Old bulk partitions audit per college, rolls back writes if audit fails (service:699-711)
- vNext now: New bulk summary audit optional; audit failure returns auditWarning after learner writes (bulk-service:56-80)
- Fix: Make audit failure semantics explicit; close compliance gap with transactional/batch journal

## G2-19-026-040  [P1] GAP  facet F19  effort L
- Legacy: Legacy bulk one transaction up to 1000, preflight SQL ancestor locks (service:579-670)
- vNext now: New 25 sequential trace+single-writes, each its own transaction (bulk-service:21-55)
- Fix: Reduce per-row round trips via preflight batch resolver and single bounded transaction

## G2-19-026-047  [P1] GAP  facet F23  effort M
- Legacy: Legacy `courses` module exposed in feature catalog (ModuleAccessUpdateRequest:19)
- vNext now: New module list `projects,placements,electives` (service.ts:23-27)
- Fix: Write explicit products/permission mapping and intentional divergence before signoff

## G2-19-026-014  [P2] GAP  facet F07  effort S
- Legacy: Bad tree collegeId 0 rejects `collegeId is required` (controller:41-44)
- vNext now: New college UUID route schema and selected scope guard (detail:46-57)
- Fix: Use context-specific validation and friendly select college copy; avoid opaque UUID error

## G2-19-026-017  [P2] GAP  facet F07  effort S
- Legacy: Bulk empty `At least one learner must be selected`, >1000 `Select at most 1000 students at a time` (service:573-585)
- vNext now: New Zod requires 1..25 (bulk-service:16)
- Fix: Surface accurate new batch cap or restore old 1000 affordance with consistent wording

## G2-19-026-018  [P2] GAP  facet F08  effort S
- Legacy: Success envelope Response(status OK,message Module access updated,data result) (controller:96-129,133-150)
- vNext now: New app API returns `Response.json` domain results (bulk route:7-15)
- Fix: Keep success count and final effective state clear; avoid stale saved toast
