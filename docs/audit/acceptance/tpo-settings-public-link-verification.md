# TPO settings recruiter public link — chat-2 regression closure

| Gap ID | Status | Evidence |
| --- | --- | --- |
| TPO-settings-audit-55 | DONE (source; tests not run) | `src/components/placements/tpo-settings-nav.tsx` now exposes legacy **Recruiters** at `/tpo/settings/recruiters`, which already renders `TpoPublicJoinLinkCard` directly inside its Recruiters settings section. Existing `tests/unit/chat2-tpo-public-link-settings.test.ts` includes two named **TPO-settings-audit-55** tests for the navigation and exact labels. This repairs the cloud unit-test regression recorded in `docs/orchestrator/unit-failures-r1.md`. |

| TPO-settings-audit-01 | DONE (source; tests unrun) | Legacy-exact `Placement rules`, `What companies see`, `Placements page`, `Branding` restored in `src/components/placements/tpo-settings-nav.tsx`; `tests/unit/tpo-settings-primary-nav.test.ts` verifies section grouping and links. |
| TPO-settings-audit-55 | DONE (source; tests unrun) | `tests/unit/chat2-tpo-public-link-settings.test.ts` still verifies legacy `Recruiters` and the nested recruiter public-link card. |
| T-S2-08 | DONE (source; tests unrun) | `tests/unit/t-s2-08-publication-navigation.test.ts` asserts `Placements page` and retains strict publication validation. |
