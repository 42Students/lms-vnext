# Work packet (wave 2): edit src/components/auth/login-form.tsx (part 2 of 2)

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-20/index.md

## G2-1-032-076  [P3] GAP  facet F21  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:650-655: legal pages served from local assets.
- vNext now: src/components/auth/login-form.tsx:563-568: Terms asset, Privacy route; must verify current link.
- Fix: Keep immutable terms links and no broken asset.

## G2-20-006-011  [P3] GAP  facet F03  effort S
- Legacy: LoginRobot client messages and transitions from errors; `docs/legacy-source/frontend/src/loginPages/Login.js:99-108,680-695`
- vNext now: Shared LoginForm renders inline state and error content, no animated robot/event; `src/components/auth/login-form.tsx:52-80,123-139`
- Fix: Clone mascot reactions and tooltip geometry if owner intends pixel clone for login, otherwise mark deliberate accessibility simplification.

## G2-20-006-016  [P3] GAP  facet F04  effort S
- Legacy: Legacy JNTU phone placeholder `Enter mobile number`, OTP placeholder `Enter OTP`; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:97-119,139-155`
- vNext now: New shared default phone/email/OTP fields; no JNTU-specific placeholder branch; `src/app/page.tsx:173-177`, `src/components/auth/login-form.tsx:114-123`
- Fix: Restore host-specific placeholders when JNTU mode retained.

## G2-20-006-057  [P3] GAP  facet F17  effort S
- Legacy: JNTU phone autoFocus and aria-describedby phone-error; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:105-123`
- vNext now: New contact ref for errors and inline error summary focus; `src/components/auth/login-form.tsx:124-139,212-215`
- Fix: Verify error id association and initial focus on tenant-specific login.
