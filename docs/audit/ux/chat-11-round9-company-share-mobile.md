# Chat-11 — Round 9 company-share mobile regression

- Assigned failing test: `tests/unit/company-share-mobile-cards.test.ts` (source contract for equivalent three-field mobile cards and desktop table).
- The signed-off UX intentionally consolidated two duplicated renderers into the shared `DataTable`, which renders responsive cards and table cells from **one** approved `columns.map((key,index)=>...` cell projection.
- The original test asserted obsolete `sm:hidden` and `columns.map(key=><td` markup in the public page. Replaced these assertions with checks across the public page **and** shared `DataTable`; verified row key, mobile labels, breakpoint classes, and no `row.phone` / `row.resume` source access.
- Added a projection example verifying the only disclosed `cells` are the three selected fields, excluding an unselected email and phone.
- Updated the adjacent `PUB-auth-public-53` source assertion, which also expected the obsolete inline `columns.map(key=>` pattern, to the shared DataTable representation.
- **No production source or legacy wording was changed**. This is test alignment for an intended UX change, without weakening the privacy constraint.
- Authored in GitHub; CI/runtime execution remains the orchestrator's responsibility.
