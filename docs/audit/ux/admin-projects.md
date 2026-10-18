# UX review — `/admin/projects`

- **Lane:** chat-9; /admin last-third; route 79 of 111.
- **Review:** Accessible deep-teal link text, 44px controls, and min-width containment applied where the route owns the markup.
- **States:** Existing scoped, empty/error, permission and loading behavior is preserved; this route must not invent content or add client-side authorization. Shared PageHeader and existing state components remain the source of truth.
- **Contract:** Signed-off UX Playbook; exact legacy titles and actions preserved. Use shared DataTable only with explicit caller-owned `empty` copy.
- **Source verification:** `tests/unit/ux-admin-chat9-batch-01.test.ts`, `UX-admin-projects-01`.
- **Validation:** Source test authored; TypeScript, lint, Vitest and browser/device checks pending orchestrator run. Do not mark page accepted until those pass.
