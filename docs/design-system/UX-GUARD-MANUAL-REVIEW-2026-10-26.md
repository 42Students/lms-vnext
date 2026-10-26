# UX guard short renewal — 26 October 2026

**Scope:** seven-day manual review of the existing expiring UX anti-drift waiver. This is **not** completion of Mentor visual acceptance or a decision to waive new UX regressions.

- Source-exact immutable baseline remains `1dbc5d616981dc00f2d3196fb32f185881235bb2` (captured 18 October); no new baseline, paths, rules or unverified snippets have been added.
- [Mentor source job #121271975087](https://github.com/42Students/lms-vnext/actions/runs/40226752926) on 25 October passed the guard across **3,791 tracked UI source files** and identified **64 unchanged, source-exact legacy findings**. Those are unresolved UX debt, not false positives or accepted new patterns.
- `scripts/check-ux-anti-drift.mjs` compares the per-path `rule + SHA-256(snippet)` occurrence counts to the immutable baseline. New or modified violations still fail; expiry is the only field renewed.
- On 26 October the [Mentor run #40271292530](https://github.com/42Students/lms-vnext/actions/runs/40271292530) passed TypeScript, Mentor source tests and PostgreSQL but failed its lint job while the waiver was expired.
- **Temporary expiry:** 2 November 2026. Within this interval the full-source guard must still run green on every current commit to establish no new UX regressions. The 64 baseline findings must be migrated or separately re-reviewed before the next expiry.
- **Unchanged gates:** authenticated browser acceptance, cross-role tenant testing, live Google and ZeptoMail consent/provider confirmation, full 132-item functional traceability, and eventual pixel-level visual comparison remain independent and unsigned.

This renewal prevents a date-only guard expiration from obscuring new code test evidence. It is **not** a substitute for eliminating the legacy findings or a blanket CI waiver.
