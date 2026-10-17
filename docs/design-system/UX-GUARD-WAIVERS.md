# UX guard waiver register

Effective 2026-10-18. **No blanket waiver** is permitted for the audited primitives or critical paths in `scripts/check-ux-anti-drift.mjs`. To add a temporary exception, list exact file, line, rule, user-impact rationale, owner, tracking issue, and expiry date (≤14 days), then make the checker explicitly validate that expiry. A waiver cannot hide B-01 or C-01/C-02/C-03 blockers. Uninspected legacy surfaces remain outside the initial scoped rule and require audit expansion, not an implicit “PASS”. Source guard failure is distinct from unrun browser and manual tests.
