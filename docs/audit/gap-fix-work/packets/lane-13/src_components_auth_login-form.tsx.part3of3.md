# Work packet: edit src/components/auth/login-form.tsx (part 3 of 3)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/index.md

## G2-20-006-035  [P3] GAP  facet F08  effort S
- Legacy: Legacy messages for suspended/not registered/too soon/OTP delivery errors defined in loginErrorMessage; `docs/legacy-source/frontend/src/loginPages/Login.js:37-78`
- vNext now: New error list covers analogous outcomes, adds channel-specific errors; `src/components/auth/login-form.tsx:52-80`
- Fix: Exact string-by-string compare completed error catalogue; keep newer safe helpful contact copy only by owner decision.
