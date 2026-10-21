# U021 — AdminAuditLog

## Source closure

Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:1-64`, `resources/db/migration/V61__admin_audit_log.sql:1-22`; old admin audit writer/service/controller, request-IP/user-agent and actor resolution. vNext `src/db/schema/activity.ts:18-123`, `src/modules/activity/service.ts:1-814`, `src/modules/activity/metadata-sanitizer.ts`, `taxonomy.ts`, `src/app/(authenticated)/admin/audit/page.tsx:1-24`, audit export service and activity UI. Caveat: this is schema/event write parity, not a visually rendered page. Basename citations map to listed files; 1-based physical line numbers, no code/CI.

| ID | Facet | Legacy (file:line) | vNext (file:line) | Verdict | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-16-021-001 | F01 | AdminAuditLog.java:10-19 JPA admin_audit_log persistent actor/action trail. | activity.ts:18-68 unified activity_events table. | GAP | P2 | Map old admin audit to common activity event taxonomy. | S |
| G2-16-021-002 | F01 | AdminAuditLog.java:10-19 not itself a page. | admin/audit/page.tsx:10-23 serves Activity Log for Super Admin. | EXTRA | P3 | Keep audit route and permission separation. | S |
| G2-16-021-003 | F02 | AdminAuditLog.java:25-61 captures actor/scope/IP/UA/payload/time. | activity.ts:21-68 stores organization/college/actor/subject/summary/metadata/time. | GAP | P1 | Expose network attribution only with strict admin privacy, retain investigation-critical fields. | M |
| G2-16-021-004 | F03 | AdminAuditLog.java:34-40 actionKey/entityType/entityId. | activity.ts:43-56 eventType/subjectType/subjectId/subjectLabel. | GAP | P2 | Map old action strings exactly to taxonomy plus displayed labels. | S |
| G2-16-021-005 | F04 | AdminAuditLog.java:25-33 actor id/type/contact mobile. | activity.ts:30-39 actorUserId/membershipId, no phone/type snapshot. | GAP | P1 | Snapshot actor role at event time and handle later account deletion; mask mobile. | M |
| G2-16-021-006 | F04 | AdminAuditLog.java:43-47 organizationId/collegeId numeric. | activity.ts:22-29 UUID FK. | GAP | P2 | Map numeric legacy tenant keys to UUID and forbid cross-tenant leakage. | S |
| G2-16-021-007 | F04 | AdminAuditLog.java:49-53 IP varchar64 and userAgent varchar512. | activity.ts:18-68 no dedicated network fields. | MISSING | P1 | Add privacy-governed audit network metadata with retention and masking. | M |
| G2-16-021-008 | F04 | AdminAuditLog.java:55-57 payloadJson flexible JSON. | activity.ts:57-60 metadata jsonb sanitized. | EXTRA | P3 | Keep structured sanitizer, allow approved old payload fields. | S |
| G2-16-021-009 | F05 | AdminAuditLog.java:13-18 indexes createdAt, actor, scope, action. | activity.ts:70-96 indexes by tenant/module/actor/group-time. | GAP | P2 | Add eventType/time index for high-volume action-key filtering. | S |
| G2-16-021-010 | F05 | AdminAuditLog.java:59-60 datetime when created. | activity.ts:63-67 occurredAt timestamptz. | GAP | P2 | Format Asia/Kolkata and retain original instant. | S |
| G2-16-021-011 | F06 | AdminAuditLog.java:34-35 actionKey required length100. | activity.ts:43-45 eventType required length120. | GAP | P3 | Validate old action keys length and taxonomy mapping. | S |
| G2-16-021-012 | F06 | AdminAuditLog.java:37-41 entityType/entityId optional varchar60. | activity.ts:51-54 subjectType and subjectId required (text). | GAP | P2 | Supply safe sentinel or scoped generic subject for old actor-only events. | S |
| G2-16-021-013 | F07 | AdminAuditLog.java:59-60 timestamp auto now, no Bean Validation messages. | service.ts:50-130 rejects invalid audit dates and cursor with explicit copy. | EXTRA | P3 | Keep safe errors for audit UI, no entity field toasts. | S |
| G2-16-021-014 | F08 | AdminAuditLog.java:1-64 data-only, no success toast. | activity/service.ts:136-149 record input, no UI toast. | MATCH | P3 | No save toast in persistence writer. | S |
| G2-16-021-015 | F09 | AdminAuditLog.java:1-64 entity has no dialogs. | admin/audit/page.tsx:10-23 error page and activity, no model overlay. | MATCH | P3 | Audit UI dialogs in activity page separately. | S |
| G2-16-021-016 | F10 | AdminAuditLog.java:25-61 writes actor IP/UA/action/entity/payload. | activity/service.ts:136-149 records eventType/subject/sanitized metadata. | GAP | P1 | Ensure all old mutation points emit event parity incl login/privileged action. | M |
| G2-16-021-017 | F10 | AdminAuditLog.java:12-18 indexes action_key. | activity.ts:97-103 dedupeKey unique; no action index. | GAP | P2 | Index eventType/occurredAt for query performance. | S |
| G2-16-021-018 | F11 | AdminAuditLog.java:43-47 stores organization/college optional. | activity.ts:104-107 if college, organization must also be set. | EXTRA | P3 | Keep stronger scope invariant. | S |
| G2-16-021-019 | F11 | AdminAuditLog.java:25-33 historical actor type persisted string. | activity.ts:30-39 actorUserId/membershipId FK only. | GAP | P1 | Retain actor role snapshot when user changes roles. | M |
| G2-16-021-020 | F12 | AdminAuditLog.java:34-35 arbitrary nonempty action_key. | activity.ts:109-121 event module allowlist and shape check. | GAP | P2 | Map legacy arbitrary action keys to registry, track unmapped events. | S |
| G2-16-021-021 | F12 | AdminAuditLog.java:55-57 flexible payload. | activity/service.ts:34,145 uses metadata sanitizer. | EXTRA | P3 | Keep PII redaction, document payload fields lost intentionally. | S |
| G2-16-021-022 | F13 | AdminAuditLog.java:1-64 entity only, no empty/loading UX. | admin/audit/page.tsx:15-21 invalid filter ErrorState. | EXTRA | P3 | Review activity list empty/error separately. | S |
| G2-16-021-023 | F14 | AdminAuditLog.java:55-57 JSON payload stored. | super-admin-audit-export-service.ts exports redacted report. | EXTRA | P3 | Keep privacy-safe audit export; verify role gates. | S |
| G2-16-021-024 | F15 | AdminAuditLog.java:1-64 no notification or email. | activity.ts:126-155 separate in_app_notifications linked to event. | EXTRA | P3 | Keep event-notification linkage only for approved types. | S |
| G2-16-021-025 | F16 | AdminAuditLog.java:1-64 server table, not responsive. | admin/audit/page.tsx:10-23 activity page wrapper. | MATCH | P3 | Audit responsive table in /activity UI. | S |
| G2-16-021-026 | F17 | AdminAuditLog.java:1-64 no ARIA/focus. | admin/audit/page.tsx:15-21 labelled ErrorState and links. | MATCH | P3 | Accessibility belongs view. | S |
| G2-16-021-027 | F18 | AdminAuditLog.java:34 actionKey code strings. | admin/audit/page.tsx:16 title `Activity Log`, old audience uses Audit Log. | GAP | P3 | Compare exact sidebar/title casing `Audit Log` vs `Activity Log`. | S |
| G2-16-021-028 | F19 | V61__admin_audit_log.sql:16-19 four indexes. | activity.ts:70-96 five indexes but not eventType. | GAP | P2 | Add eventType+occurredAt index with explicit query plan. | S |
| G2-16-021-029 | F20 | AdminAuditLog.java:23-60 append-only ID and createdAt. | activity.ts:97-103 unique dedupeKey prevents retries. | EXTRA | P3 | Keep idempotent recording where event key stable. | S |
| G2-16-021-030 | F20 | AdminAuditLog.java:25-33 actor can be null, user type and phone retained. | activity.ts:30-39 nullable actor user FK but no snapshot. | GAP | P2 | Log system actors explicitly without attributing user falsely. | S |
| G2-16-021-031 | F21 | AdminAuditLog.java:1-64 no external integration. | activity/service.ts:31-43 taxonomy & sanitizer dependencies. | MATCH | P3 | No mail/webhook tied to audit row. | S |
| G2-16-021-032 | F22 | V61__admin_audit_log.sql:1-19 bigint PK, four indexes, actor IP UA JSON. | activity.ts:18-123 UUID PK/timestamptz/metadata and alternate indexes. | GAP | P1 | Produce explicit column mapping including missing IP, UA, actor-role snapshot, action key. | M |
| G2-16-021-033 | F22 | AdminAuditLog.java:59-60 LocalDateTime naive. | activity.ts:63-67 timestamptz. | GAP | P2 | Convert India wall-clock to absolute UTC carefully. | S |
| G2-16-021-034 | F23 | AdminAuditLog.java:25-57 captures contactMobile/IP/UA. | activity.ts:30-60 omits direct columns. | MISSING | P1 | Record privacy-safe fields with retention policy. | M |
| G2-16-021-035 | F23 | AdminAuditLog.java:10-19 no importance/group/dedupe. | activity.ts:46-62 adds importance/group/dedupe and summary. | EXTRA | P3 | Keep richer classification for activity UI. | S |

## Unit summary

35 rows cover all F01–F23. Verdict {"GAP":18,"EXTRA":10,"MISSING":2,"MATCH":5}; severity {"P2":11,"P3":17,"P1":7}. Three gaps: legacy actor role/contact/IP/UA snapshot not represented, arbitrary actionKey and entity optionality require explicit taxonomy translation, eventType indexing and old-time conversion differ. UNKNOWN: legacy exact writer invocation coverage and activity UI live filter/sort, cross-scope export privacy; check against old controller service before fix.
