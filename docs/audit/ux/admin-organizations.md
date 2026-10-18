# /admin/organizations · UX source review

- **Weakness / baseline:** The organizations surface already has responsive cards plus a desktop DataTable with an explicit empty node.
- **Source work / disposition:** Reused its existing DataTable with explicit empty copy; kept organization creation authorization and the distinct mobile list.
- **States reviewed:** No organizations, create restriction, filtered results and pagination.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-organizations-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
