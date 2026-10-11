# DB04 retirement-candidate peer review — Chat 5

**Date:** 2026-10-11  
**Global phase:** DATABASE  
**Reviewed task:** DB-007 (owned by Chat 3; this review does not transfer the claim)  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Disposition:** stronger retirement evidence only; **no RETIRED_APPROVED claim**.

## Why these tables exist in the frozen inventory

The legacy file `src/test/resources/db/mysql-schema-snapshot.sql` is documented by
`README-schema-snapshot.md` as a **structure-only copy of the production schema** plus
`flyway_schema_history`. It contains no application data. That proves
`student_registration` and `approver_id_card` physically existed in the source
production schema captured by the snapshot. It does **not** prove current application
usage.

The snapshot also explains that many original tables predate Flyway. Therefore an old
table can remain physically present after its Java workflow has disappeared.

## student_registration — 22 fields

Snapshot shape is external-sync flavored rather than placement-registration behavior:

- tenant / organization / college / learner identifiers;
- `external_ref`, `registration_number`, student name/contact snapshots;
- program/class/batch/semester snapshots;
- `registration_status`;
- source default `crm_sync`;
- `synced_at`, metadata, optimistic version, soft-delete timestamps;
- tenant-scoped uniques on external ref, learner and registration number.

### Current-source review

At the pinned backend tree:

- no filename contains `StudentRegistration` / `student_registration`;
- exact repository search for `student_registration` returns no indexed source result;
- exact searches for `crm_sync`, `registration_number` and
  `student_registration_tenant_external_unique` return no backend result;
- there is no JPA column annotation evidence for any of the 22 frozen inventory rows.

At the pinned frontend tree:

- exact searches for `student_registration`, `crm_sync` and
  `registration_number` return no indexed consumer.

The only named current learner registration surface found in the backend is placement
registration (`PlacementRegistration`, `PlacementRegistrationRepository`,
`BatchRegistrationService`), which has a different placement-specific business
contract and must not be used as a name-based substitute.

### Peer disposition

**Strong historical/external-sync retirement candidate, still pending explicit approval.**

If an external CRM/roster synchronization still exists outside these repositories,
vNext should model it deliberately as an import/synchronization boundary with durable
source identifiers and audit state; it should not recreate this table as the canonical
learner record. If no detached integration remains in scope, the 22 fields can be
retired as historical duplicate/snapshot state once DB01/DB02/product ownership signs
off.

The remaining proof gap is specifically a **detached/external integration outside the connected 42Students GitHub organization**, not an unexplored company repository or in-repo Java/UI producer.

## approver_id_card — 11 fields

The production snapshot stores generic uploaded-media metadata plus
`assigned_exam_id`, with an FK to historical `assigned_exam`.

### Current-source review

At the pinned backend tree:

- no filename contains `ApproverIdCard` / `approver_id_card`;
- no filename contains `AssignedExam` / `assigned_exam`;
- exact repository searches for `approver_id_card`, `assigned_exam` and the
  snapshot FK name return no indexed backend source;
- all 11 frozen inventory fields lack JPA-column annotation evidence.

At the pinned frontend tree:

- exact searches for `approver_id_card` and `assigned_exam` return no indexed
  consumer.

By contrast, active DB04 image/qualification families have named controller/service/
repository/model paths. This old approver-card family has neither a current child
workflow nor a current named parent subsystem.

### Peer disposition

**Very strong retirement candidate, pending explicit approval.**

The evidence is stronger than for `student_registration`: even the parent
`assigned_exam` subsystem is absent from the current source tree. Do not rebuild the
old URL/object/encoding fields merely because they remain in the physical snapshot.
If a current assessment identity-card feature is discovered outside the repository,
it needs a fresh private-object/receipt contract rather than automatic resurrection of
this historical table.

## Connected-organization detached-service sweep

A follow-up search across the connected **42Students GitHub organization**, not
just `lms` / `lms2-fe`, returned zero indexed code matches for:

- `student_registration`
- `crm_sync`
- `registration_number`
- `approver_id_card`
- `assigned_exam`

Repository-name/description searches for likely separate CRM or exam services
also returned no connected 42Students repository matches.

This does not rule out infrastructure or a service outside the connected
GitHub organization, but it narrows both retirement uncertainties from
"possibly another company repo" to "possibly an externally hosted/untracked
integration."

## What this review does and does not prove

This review narrows the DB-007 blocker substantially:

- **proved:** physical historical presence in the production-structure snapshot;
- **proved from current repository evidence:** no named JPA/controller/service/repository
  implementation and no indexed exact backend/frontend reference for either family;
- **additional approver evidence:** no current named/reference evidence for its
  `assigned_exam` parent subsystem;
- **not proved:** absence of a detached service, external CRM, hand-written SQL hidden
  outside indexed source, or operational consumer outside these repositories;
- **not approved:** product retirement.

Recommended closure decision:

1. DB01/DB02/product owner explicitly confirms whether any external learner CRM/roster
   sync remains in vNext scope.
2. Product owner confirms the historical assigned-exam approver-card subsystem is out
   of scope.
3. If both answers are no, record table-level `RETIRED_APPROVED` with this source
   evidence and do not create replacement schema.
4. If either answer is yes, open a new normalized persistence task from the actual
   current producer/consumer contract rather than cloning the historical table.

No PostgreSQL, Node, browser or external integration test was executed in this peer
review.
