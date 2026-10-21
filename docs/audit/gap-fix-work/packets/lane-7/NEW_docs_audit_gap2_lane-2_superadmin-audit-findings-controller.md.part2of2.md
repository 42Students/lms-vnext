# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md (part 2 of 2)

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/superadmin-audit-findings-controller.md

## G2-2-001-067  [P1] GAP  facet F22  effort L
- Legacy: LS:65-68,95-108 DB audit_finding, audit_finding_event; LI:266-284 audit_finding_file, audit_finding_sync
- vNext now: NX:9-68 audit_findings, audit_finding_events, audit_finding_syncs; no per-file ledger
- Fix: Add append-only file ledger and full sync metadata with constraints/indexes.

## G2-2-001-068  [P1] GAP  facet F22  effort M
- Legacy: LI:179-207 writes roles,reported_severity,environment,found_by_session,related_json,source_commit
- vNext now: NX:9-35 lacks roles,reported severity,environment,session,related IDs,source commit
- Fix: Extend Postgres schema and importer mapping; backfill when legacy data exists.

## G2-2-001-069  [P1] GAP  facet F22  effort M
- Legacy: LI:253-257 event has type/from/to/note/commits/actor/actorKind/sourceFile/at
- vNext now: NX:46-59 events only action,note,fromStatus,toStatus,actorUserId,createdAt
- Fix: Extend event columns and checks for importer-originated events.

## G2-2-001-070  [P1] GAP  facet F22  effort M
- Legacy: LI:307-315 sync has lastCommit,lastRunAt,lastSuccessAt,lastError and 200 flagged files
- vNext now: NX:61-67 only source,lastSyncedAt,lastResult,importedCount,refusedFiles JSON
- Fix: Restore run metadata and granular file results; verify target migration registration.

## G2-2-001-026  [P2] GAP  facet F07  effort S
- Legacy: LS:155-158 Unknown severity / already severity
- vNext now: NV:10 enum; NE:21 generic Zod/API error
- Fix: Show field-specific legacy severity errors and unchanged-state prevention.

## G2-2-001-029  [P2] GAP  facet F07  effort S
- Legacy: LS:187-188 Unknown repo / That isn't a commit hash
- vNext now: NV:13 regex GitHub repo and SHA; NE:21 generic Zod error
- Fix: Mirror enum/sha validation and surface field-specific messages.

## G2-2-001-030  [P2] MISSING  facet F08  effort S
- Legacy: LF:74-79 success Synced, warning Sync didn't run, error Sync failed.
- vNext now: NP:114-124 no manual-sync toast
- Fix: Provide matching post-sync toast variants and sync-run feedback.
