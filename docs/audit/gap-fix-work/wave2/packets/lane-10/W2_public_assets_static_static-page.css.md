# Work packet (wave 2): edit public/assets/static/static-page.css

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/privacy-policy.md

## G2-20-007-011  [P2] GAP  facet F03  effort S
- Legacy: Blue privacy hero (#266891), white 40px/800 title, brand text link, date meta; `docs/legacy-source/frontend/src/pages/privacy-policy.js:265-292`
- vNext now: Static uses CSS class 'header accent p-24', h1 with '42LMS Privacy Policy'; styles from public/assets/static/static-page.css; `public/assets/static/privacy-policy-view.html:14-20`
- Fix: Match legacy hero palette, height 40px title and brand link while retaining static CSS architecture.
