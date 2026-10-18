# /admin/people/directory/[membershipId] · UX source review

- **Weakness / baseline:** Membership detail includes private contact masking and a separate audit entry point.
- **Source work / disposition:** Kept read-only identity/status hierarchy, visible redaction, and the audit-trail link with current scope rules.
- **States reviewed:** Not-found inaccessible member, redacted contact details and platform/membership badges.
- **Regression:** `tests/unit/ux-admin-chat6-middle-third.test.ts` — `UX-admin-people-directory-membershipId-01`; shared-contract tests cover the affected archetype where applicable.
- **Verification boundary:** Source contracts authored; TypeScript, unit, 320/360/390px browser, native WebView, and screen-reader checks require orchestrator execution. Not yet a browser sign-off.
