# Legacy admin audit log → vNext activity event mapping

Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:12-61`.
Destination: `src/db/schema/activity.ts` (`activityEvents`).

This is a **migration contract**, not evidence that historical rows have been imported. Do not declare historical audit parity until import and reconciliation have run against a real legacy export.

| Legacy column | vNext destination | Conversion / verification |
| --- | --- | --- |
| `id` | `legacyAuditId` | Preserve integer without truncation; reject duplicates per import source. |
| `actor_user_id` | `actorUserId` | Resolve legacy numeric user ID to an authenticated UUID via a verified mapping; never cast it. |
| `actor_user_type` | `actorRoleSnapshot` | Preserve the historical role label, independent of the user's current roles. |
| `actor_contact_mobile` | `actorContactLast4` | Last four digits only after format validation; never copy full mobile. |
| `action_key` | `legacyActionKey`, `eventType` | Preserve the original verb; map to an allowed event type with a documented versioned mapping, never silently drop unknown values. |
| `entity_type` | `legacyEntityType`, `subjectType` | Keep original spelling alongside canonical type. |
| `entity_id` | `legacyEntityId`, `subjectId` | Preserve raw legacy text and resolve canonical UUID if one exists. |
| `organization_id` | `organizationId` | Verified numeric→UUID mapping; reject ambiguous scope. |
| `college_id` | `collegeId` | Verified numeric→UUID mapping, enforcing college belongs to mapped organization. |
| `ip_address` | `sourceIpHash` | Keyed, one-way deterministic privacy-preserving digest where policy permits; never store plaintext. Do not generate an unhashed SHA-256 without a secret because addresses are enumerable. |
| `user_agent` | `sourceUserAgentFamily` | Sanitize and classify browser/agent family without copying raw identifying string. |
| `payload_json` | `metadata` | Allowlist non-sensitive keys; redact contacts, tokens, secrets, raw IP and raw user agents. Preserve meaning for privileged actions. |
| `created_at` | `legacyOccurredLocal`, `legacySourceTimeZone`, `occurredAt` | Preserve original local timestamp and identified source timezone; derive UTC only once the source zone is confirmed. |

Additional required event fields: `module`, `importance`, `summary` and `actorMembershipId` must be derived with documented and audited rules; no arbitrary college role may be inferred from a historical user ID. `actorNameSnapshot`, `legacyEventOriginalCode` and `legacyWasDeleted` can preserve additional provenance where supplied from a separate source.

**Import gate:** fail closed for unresolved actor, organization, college or ambiguous source timezone; verify row counts, uniqueness and randomly sampled original request lineage; compare historic event chronological order and privileged action scope. Query ordering can use `activity_events_legacy_audit_id_idx` and timestamp indexes. Raw legacy IP and user-agent must not leak into event metadata or import errors. The existing schema alone does not implement these transformations or make production migration complete.
