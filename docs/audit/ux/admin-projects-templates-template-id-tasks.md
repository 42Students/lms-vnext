# UX review — `/admin/projects/templates/[templateId]/tasks`

- **Lane / slice:** chat-9, route 94 of 111 (last third).
- **Observed / addressed:** Preserved the established scoped project/template shared surface or authorized redirect; avoid a second detail UI.
- **Responsive and accessibility:** Existing loading/retry, form draft handling and focused state remain governed by the shared UI. State control remains with the shared renderer.
- **Legacy wording:** Preserved titles, labels, button messages, selected scope and URL semantics; nothing was deleted or reauthorized on the client.
- **Regression:** `tests/unit/ux-admin-chat9-batch-02.test.ts` case `UX-admin-projects-templates-template-id-tasks-01`.
- **Verification:** Unit/typecheck/lint/device evidence pending orchestrator. Page-list checkbox remains open until tests pass.
