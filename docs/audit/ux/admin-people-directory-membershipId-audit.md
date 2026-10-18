# /admin/people/directory/[membershipId]/audit · UX source review

- **Weakness / baseline:** The membership audit is scoped but its event count may be zero; empty activity must not be confused with a failure.
- **Source work / disposition:** Retained the exact audit heading, event timestamps in IST, accessible ordered event history and explicit empty copy.
- **States reviewed:** Inaccessible member not-found, empty event history, ordered events and back link.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-people-directory-membershipId-audit-01`; shared-contract checks where applicable.
- **Verification boundary:** Source reviewed and tests authored; typecheck, unit, mobile/browser and native WebView/AT verification pending orchestrator execution. Do not treat this as visual sign-off.
