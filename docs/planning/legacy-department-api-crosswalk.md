# Legacy Department controller → vNext contract

The old `/api/v1/department` and `/api/v1/departments` paths are **not** runtime aliases. Old clients must switch to authenticated, same-origin vNext APIs; a numeric department ID is never treated as a UUID or an authorization credential.

| Legacy operation/payload | Supported vNext operation | Required safeguard |
| --- | --- | --- |
| Create with `college_id` and a department name | `POST /api/college/departments` using the vNext validated department form | Do not copy `college_id` from the caller. The selected, active college membership determines the college; unsupported snake_case fields are rejected rather than silently used. |
| Update using numeric department identity | `PATCH /api/college/departments/{departmentId}` | Resolve IDs through an audited **college-scoped** import crosswalk. Authorize against the selected college and use the required concurrency/version field. |
| Delete by legacy department ID | `DELETE /api/college/departments/{departmentId}` | Performs **ARCHIVE**, not physical deletion. Return the archived state; references, dependent courses and audit history remain intact. Dependency conflicts are reported, not suppressed. |
| List/search in an old global administrator session | The native scoped college directory | The one-workspace-per-role model requires an explicit verified college/role selection. Never use a body or query `college_id` to elevate this scope. |

The exact handlers are `src/app/api/college/departments/route.ts` and
`src/app/api/college/departments/[departmentId]/route.ts`; mutations call
`createCollegeDepartment`, `renameCollegeDepartment`, and
`archiveCollegeDepartment`. Both handlers check `isSameOriginRequest` before
loading the authenticated context. Old clients should display the successful
response message **Department archived successfully**, not **Department deleted**.
A source numeric key without a verified tenant-scoped crosswalk is unmapped and
must fail closed. No retroactive hard delete or public alias has been introduced.
