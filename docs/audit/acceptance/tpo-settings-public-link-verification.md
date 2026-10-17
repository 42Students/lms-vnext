# TPO settings recruiter public link — chat-2 regression closure

| Gap ID | Status | Evidence |
| --- | --- | --- |
| TPO-settings-audit-55 | DONE (source; tests not run) | `src/components/placements/tpo-settings-nav.tsx` now exposes legacy **Recruiters** at `/tpo/settings/recruiters`, which already renders `TpoPublicJoinLinkCard` directly inside its Recruiters settings section. Existing `tests/unit/chat2-tpo-public-link-settings.test.ts` includes two named **TPO-settings-audit-55** tests for the navigation and exact labels. This repairs the cloud unit-test regression recorded in `docs/orchestrator/unit-failures-r1.md`. |
