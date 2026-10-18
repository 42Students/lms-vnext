# UX review — `/admin/placements/shortlisted`

- **Lane:** chat-9; /admin last-third; route 75 of 111.
- **Review:** The route delegates to an existing authorized shared workspace/read surface or canonical redirect; no parallel UI is introduced.
- **States:** Existing scoped, empty/error, permission and loading behavior is preserved; this route must not invent content or add client-side authorization. Shared destination/component owns details, forms and recovery.
- **Contract:** Signed-off UX Playbook; exact legacy titles and actions preserved. Use shared DataTable only with explicit caller-owned `empty` copy.
- **Source verification:** `tests/unit/ux-admin-chat9-batch-01.test.ts`, `UX-admin-placements-shortlisted-01`.
- **Validation:** Source test authored; TypeScript, lint, Vitest and browser/device checks pending orchestrator run. Do not mark page accepted until those pass.
