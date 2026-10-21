# Lane 5 — Department legacy source crosswalk and ownership decisions

Source: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Department.java` and `BaseModel.java`. Target: `src/db/schema/departments.ts`, `src/modules/departments/service.ts`. This is a **parity inventory, not an approved migration**. The vNext product uses UUID tenant-scoped membership and explicit archive semantics; no legacy database migration is planned.

| Old field / operation | vNext equivalent | Status and required decision |
|---|---|---|
| Department numeric `id` | `departments.id` UUID | Any historical import requires independently verified, tenant-scoped integer-to-UUID mapping; never cast or resolve by name. |
| `college_id` integer | `departments.college_id` UUID | Resolve using verified tenant identity map and preserve referential integrity. |
| Optional/nullable `name` | Required `departments.name`, unique within active college | Nonblank name is intentional new validation; malformed legacy rows require explicit remediation, not fabricated values. |
| `dept_chair_id` optional int | No column/relationship in registered department schema | **Unresolved owner decision.** If preserved, map to college-owned active faculty membership, guard existing ownership, ensure chair and vice-chair are not assigned by bare IDs. Schema/permission owner required. |
| `dept_vice_chair_id` optional int | No column/relationship in registered department schema | Same decision and guards as chair; do not create a fake UI input without a persisted, authorized write contract. |
| Legacy BaseModel soft-delete flag `isDeleted` | `departments.archivedAt` nullable timestamp | Preserve historical rows; user-facing "archived" is truthful and is not destructive "deleted". Source timestamp of deletion may require explicit backfill policy. |
| Legacy created/updated timestamps | `createdAt`, `updatedAt` timestamptz | Only import after source timezone validation, not by assuming UTC. |
| Legacy global/organization department listing | `listDepartments(ctx,collegeId)` | Current read requires one authorized, selected college. Cross-college Super Admin aggregate requires new audited read-only authorization/design, **not** a front-end scope bypass. |
| Legacy hard-delete dependency guards | `resolveDepartmentUsage` / `assertDepartmentCanArchive` | Current count guards only ACTIVE programs, ACTIVE courses and non-ended faculty. Historical/archived dependency policy must be reconciled before considering stronger parity. |

## Audit IDs and handoff

- G2-6-020-002/015/038: implement global/org readonly collection only after policy permits safe organization and cross-college scope.
- G2-6-020-010/011/020/022/028/054/058: choose chair/vice leadership retention versus intentional omission; if approved, normalized faculty memberships, tenant FK, lifecycle, historical data and API validation are needed.
- G2-6-020-040: reconcile historical archived dependents for archive integrity; keep current fail-closed archival policy.
- G2-6-020-025/026/027: when dependency counts are authoritative, surface the legacy per-type remediation sentence without weakening the shared service guard.
- G2-6-020-030: never show legacy "Department deleted successfully" when the vNext operation is archival; the truthful "Department archived" success remains intentional.

**No database/service changes were authorized in this lane packet.** The available Super Admin Department page already explains the selected-college safety requirement; do not substitute a global result set. These are cross-owner product, schema, permission and service changes. No tests or CI run.
