# Legacy organization API compatibility and deprecation

The canonical vNext API is `GET/POST /api/organizations` and
`PATCH/DELETE /api/organizations/{organizationId}`, with UUID identities,
active-role authorization, selected-college / selected-organization scope,
same-origin enforcement on writes and vNext result bodies.

For older frontend callers, `GET /api/v1/organization/fetch` and
`POST /api/v1/organization/create` are response-envelope shims.
They return HTTP 200 with `{status:"OK",message:"OK",data:...}`
on success, but do **not** bypass canonical authentication, permission,
tenant checks, validation, or errors. Soft-deleted organizations are omitted.
Global Super Admin can see the active directory; a scoped actor sees only
its authorized active organization. Use the new paths for fresh clients.

Legacy numeric-ID endpoints `/fetch/{id}`, `/update/{id}` and
`/delete/{id}` are **not** transparently mapped to unrelated UUIDs.
They remain deprecated until an auditable legacy-ID crosswalk is verified.
Do not invent a numeric-to-UUID mapping or broaden scope to emulate an old
unscoped caller. Use UUID-based canonical endpoints after lookup.
