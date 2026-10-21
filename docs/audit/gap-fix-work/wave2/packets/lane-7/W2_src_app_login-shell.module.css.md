# Work packet (wave 2): edit src/app/login-shell.module.css

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/cross-auth.md, docs/audit/gap2/lane-1/login.md, docs/audit/gap2/lane-20/index.md, docs/audit/gap2/lane-6/superadmin-login.md

## G2-1-036-054  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:658-907: robot/legacy login responsive styles.
- vNext now: src/app/login-shell.module.css:1-245: card max468, mobile padding and reduced-motion rules.
- Fix: Perform screenshot compare 375/768/1280.

## G2-1-032-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:680-713: Robot + card title/subtitle then channel switch.
- vNext now: src/app/login-shell.module.css:86-133: card width468, 40/42 padding, tabs, no robot.
- Fix: Match ln2 card anatomy and dimensions.

## G2-1-032-061  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:658-907: ln2-card with LoginDecor/Robot; old SCSS responsive layouts.
- vNext now: src/app/login-shell.module.css:1-17,86-101,209-225: CSS grid, 468px card, 40/42 desktop padding and mobile 24/20.
- Fix: Perform pixel screenshot comparison at 375,768,1280 including robot/decor.

## G2-1-032-062  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:814-819: +91 prefix sized inside mobile input.
- vNext now: src/app/login-shell.module.css:135-150: generic 52px input border/padding, no prefix.
- Fix: Clone phone-specific input spacing.

## G2-20-006-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy `login-page` wrapper, `login-page--jntu` on JNTU; `docs/legacy-source/frontend/src/pages/index.js:25-32`
- vNext now: New 3-row viewport grid 100dvh, neutral background, no special JNTU wrapper; `src/app/page.tsx:116-120`, `src/app/login-shell.module.css:3-17`
- Fix: Restore tenant-specific layout class tokens or approve default single visual shell.

## G2-20-006-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy default includes LoginDecor and LoginRobot inside card; `docs/legacy-source/frontend/src/loginPages/Login.js:661-695`
- vNext now: New uses centered 468px card and fixed brand header, no LoginRobot/decor in page; `src/app/page.tsx:130-150`, `src/app/login-shell.module.css:86-101`
- Fix: Recreate decorative/interactive login robot and card ornamentation where strict old UI applies.

## G2-20-006-008  [P2] GAP  facet F02  effort M
- Legacy: JNTU uses dedicated JNTU-logo 140x135 above form and narrow right flap; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:68-83`
- vNext now: New shared header with 151x37 42LMS SVG and optional college logo 44px; `src/app/page.tsx:130-145`, `src/app/login-shell.module.css:47-68`
- Fix: Match JNTU image dimensions, flap placement and head alignment when college host recognized.

## G2-20-006-012  [P2] GAP  facet F03  effort S
- Legacy: Legacy default card uses phone/email tab switch, robot and consent text; `docs/legacy-source/frontend/src/loginPages/Login.js:649-654,713-725`
- vNext now: New form channel tabs and card styles plus footer legal links; `src/components/auth/login-form.tsx:114-123`, `src/app/login-shell.module.css:117-133`, `src/app/page.tsx:181-188`
- Fix: Verify consent sentence present next to each submit CTA, not merely Privacy footer; preserve tab presentation.

## G2-20-006-054  [P2] GAP  facet F16  effort S
- Legacy: DGIPUC card right-aligned col-md-3 with row/mt-5 on tablet+; `docs/legacy-source/frontend/src/loginPages/DgipucLogin.js:69-75`
- vNext now: New centered 468px card, single-column on all breakpoints; `src/app/login-shell.module.css:86-101`
- Fix: Recreate right flap at >=768px for DGIPUC brand variant.

## G2-6-031-004  [P2] GAP  facet F01  effort M
- Legacy: Legacy excludes app shell and invokes LoginHeader logo plus DefaultLoginBackground layers (superadmin-login.js:15-25).
- vNext now: vNext generic login shell uses center card, brand header and optional college backdrop (app/page.tsx:128-160; login-shell.module.css:3-52).
- Fix: Clone legacy default login diagonal/illustration/header for Super Admin route, not app chrome.

## G2-6-031-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy DOM Login-Section: row width100 margin-top5, col-8 col-md-3 ms-5, ln-form-bg form then legal footer (SuperAdminLogin.js:90-113,217-244).
- vNext now: vNext centered max468px card with logo header and global footer outside form (app/page.tsx:133-161; login-shell.module.css:86-101).
- Fix: Match right-aligned legacy login form layout and footer position.

## G2-6-031-057  [P2] GAP  facet F23  effort M
- Legacy: Legacy uses external logo asset & diagonal layers, footer inside card (LoginHeader.js:1-20; DefaultLoginBackground.jsx:1-20; SuperAdminLogin.js:219-241).
- vNext now: vNext local logo, themed/center card and separate global footer (app/page.tsx:138-190; login-shell.module.css:32-101).
- Fix: Clone visual shell as a legacy module without weakening authentication.

## G2-20-006-014  [P3] GAP  facet F03  effort S
- Legacy: Legacy color and button form themed from .login-page legacy SCSS with branded robot; `docs/legacy-source/frontend/src/pages/index.js:25-32`, `docs/legacy-source/frontend/src/loginPages/Login.js:661-695`
- vNext now: New login CSS Inter, 30px headings, 40px CTA, 52px input, teal; `src/app/login-shell.module.css:3-16,93-116,134-169`
- Fix: Compare computed 375/768/1280px token matrix with legacy login SCSS, clone differences not inferred from component names.

## G2-20-006-055  [P3] GAP  facet F16  effort S
- Legacy: JNTU right aligned col-md-3 flap; `docs/legacy-source/frontend/src/loginPages/JntuLogin.js:68-73`
- vNext now: New centered card; `src/app/login-shell.module.css:86-101`
- Fix: Restore JNTU-specific right alignment if dedicated login flow retained.

## G2-20-006-056  [P3] GAP  facet F16  effort S
- Legacy: Default login CSS controlled by legacy page/scss and LoginDecor; `docs/legacy-source/frontend/src/loginPages/Login.js:661-685`
- vNext now: New phone CSS input min-height52 and CTA 40, card padding40/42; `src/app/login-shell.module.css:93-101,134-169`
- Fix: Compare CSS box model and 375/768/1280 viewport captures; do not assume fonts aligned.
