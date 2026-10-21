# Work packet (wave 3): edit src/components/auth/login-form.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/login.md

## G2-1-036-015  [P1] MISSING  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:145-231: choice list grouped at start, no pagination.
- vNext now: src/components/auth/login-form.tsx:316-556: no account choice/list/filters.
- Fix: Bring explicit and accessible account choice to multi-identity login.

## G2-1-036-056  [P1] MISSING  facet F17  effort L
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:603-643: Available accounts radiogroup with role/college aria labels.
- vNext now: src/components/auth/login-form.tsx:353-396: only channel tabs, no account group.
- Fix: Render keyboard navigable membership/account chooser.

## G2-1-032-020  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:601-633: role grouping 'Last used', 'Unverified', 'Suspended' tags and portal host.
- vNext now: src/components/auth/login-form.tsx:114-572: no chooser badges or multiple account list.
- Fix: Implement chooser with stable choice IDs and account statuses.

## G2-1-032-022  [P1] MISSING  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:600-644: radio group Available accounts, last-used selection, disabled choices.
- vNext now: src/components/auth/login-form.tsx:354-406: channel tabs, not account list.
- Fix: Provide grouped account choice UI with keyboard selection.
