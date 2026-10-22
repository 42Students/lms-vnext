# Lane 8 W1-2 — audit source / history crosswalk

Scope: `G2-11-006-040/046/074/076/077`, comparing legacy `tpo_audit_log` V165 and `TpoAuditService` against `src/modules/placements/tpo-audit-service.ts`.

| Legacy audit column | Current source / projection |
| --- | --- |
| `college_id` | Each SQL UNION arm is restricted by `activity_events.college_id` or its college-scoped placement job relation, not a client parameter |
| `actor_type`, `actor_id` | Persisted `activity_events.actor_user_id` or domain record writer. UI exposes human `actorName` with System / Account no longer available fallback; private numeric actor IDs are intentionally **never** exposed |
| `action` | `event_type` on canonical activity, application/screening/round/result/offer/joining/share history on authoritative domain sources |
| `entity_type`, `entity_id` | Allowlisted `subject_type`, `subject_id` for safe typed links. Foreign learner/recruiter IDs are intentionally hidden |
| `detail` varchar(1000) | SQL `left(detail,1000)` followed by bounded display normalization. Detailed reasons, contact values and secrets are excluded |
| `created_at` | `occurred_at` normalized to IST at presentation |
| V165 `college_id + created_at` and `college_id + action + created_at` indexes | Scoped base-table indexes plus the result query. No standalone V165 parity table is replayed |

Source types: `ACTIVITY`, `APPLICATION`, `SCREENING`, `ROUND`, `RESULT`, `OFFER`, `JOINING`, `SHARE`. A single business action can produce both a canonical activity row and a domain-history row, which are preserved as separate source facts rather than presented as one unique action. The listing reads persisted rows only and does not synthesize missed events.

**Remaining verification gates (not marked complete):** A full old-action to current writer inventory, including asynchronous jobs/webhooks, and PostgreSQL replay/query-plan evidence have not been executed here. Historical legacy audit rows have no migration guarantee. For now actor role is reported as safe generic USER/SYSTEM rather than guessing TPO vs RECRUITER vs STUDENT from an event name. Full 1000-character matching normalization should be integration-tested with Unicode and multiline data.

**Refresh limitation:** In the Next.js route error boundary the previous React Server Component tree is not available after failure. It would be unsafe to show cached private tenant rows without reauthorizing the active TPO membership. The boundary now explicitly states records cannot be revalidated and offers Retry instead of falsely claiming stale rows are displayed. Safe stale-while-revalidate snapshots require an authenticated, scoped client cache and an authorization-bound refresh interface, not a cross-account session-storage dump.
