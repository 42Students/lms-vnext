# Clutter and alignment audit

Uses the same Playwright authentication, E2E cookie/OTP and static route discovery conventions as `scripts/audit/pixel-audit.ts`. Development server only; no CI, no added packages.

Prepare an accounts JSON file in the pixel-audit format: `{"tpo":{"uid":"<seeded uid>","prefixes":["/tpo"]}}`. Optional `login` is a test phone number without a leading `+` for privileged-role OTP login. Set `ACCOUNTS_FILE` to its absolute or repository-relative path if it is not `scripts/audit/accounts.json`, `scripts/audit/pixel-accounts.json`, or `docs/audit/pixel-accounts.json`. Never commit real account IDs, phone numbers, secrets or OTPs.

Run `npx tsx scripts/audit/clutter-audit.ts tpo` for one role, or `npx tsx scripts/audit/clutter-audit.ts all` for all configured roles. `BASE_URL` defaults to `http://localhost:8080`; `CHROME_PATH` is optional. Supply `E2E_AUTH_SECRET` (also read from `.env.local`) for seeded cookies or `AUTH_TEST_OTP` for real OTP test accounts.

The audit visits static authenticated `page.tsx` routes under each account's prefixes at 1280×800, 768×800, and 375×800. Dynamic `[id]` routes are intentionally skipped, never guessed. It writes `docs/audit/ux/clutter-report.json` (per-page counts, geometry, font diversity, top problems, errors) and `docs/audit/ux/clutter-report.md` (ranked worst-first table, top-five concrete issues). The score and penalties appear at the top of the Markdown report; higher scores mean more UI density/alignment risk, not proven defects. Redirected and failed routes are explicitly listed. Review page measurements manually before deciding on fixes.
