# Work packet (wave 2): edit src/components/marketing/marketing-layout.tsx (part 2 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/shared-public-pages.md, docs/audit/gap2/lane-20/universities.md

## G2-20-004-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy hero eyebrow exact `For Enterprises`, no hero CTA; `docs/legacy-source/frontend/src/pages/enterprises.js:35-39`, `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`
- vNext now: Hero eyebrow `For enterprises` and two CTA controls; `src/app/enterprises/page.tsx:6-7`, `src/components/marketing/marketing-layout.tsx:40-43`
- Fix: Restore capitalization and suppress hero CTA on enterprise page; leave CTA in final band.

## G2-20-004-016  [P2] GAP  facet F03  effort S
- Legacy: Checklist points marked with teal check icons, outcomes as teal pills; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:146-165,208-221`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:350-369`
- vNext now: Feature tiles have headings and paragraphs, no check icons or pills; `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Provide checklist icon and status-pill components to match legacy presentation.

## G2-20-004-018  [P2] MISSING  facet F03  effort S
- Legacy: CTA band buttons `Request a Demo` with arrow, and `Login`; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-286`
- vNext now: Single `See 42 LMS in action` button, no arrow, no Login; `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Render both CTAs with exact labels and arrow icon; don't convert Login to Sign in here.

## G2-20-004-020  [P2] GAP  facet F03  effort M
- Legacy: Sticky blurred header 68px, changes border/shadow after scrollY>8; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:7-20`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:96-118`
- vNext now: Static border-b header, no scroll state; `src/components/marketing/marketing-layout.tsx:12-23`
- Fix: Implement sticky header and threshold-based scrolled border/shadow (or CSS scroll state equivalent).

## G2-20-004-030  [P2] GAP  facet F05  effort S
- Legacy: Public top nav four ordered links and footer two list columns; `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`, `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:36-55`
- vNext now: Header nav four links; footer only flat inline links; `src/components/marketing/marketing-layout.tsx:6-11,25-31`
- Fix: Match column/table/list order and grouping, no search/sort/pagination for either.

## G2-20-004-031  [P2] GAP  facet F05  effort S
- Legacy: Audience Detail checklist four items and outcome list five; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:131-146`
- vNext now: FeatureGrid map over four items in two columns; `src/app/enterprises/page.tsx:8-13`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore semantic list structures, keep no bulk selection/pagination.

## G2-20-004-033  [P2] MISSING  facet F06  effort M
- Legacy: Marketing mobile menu controlled by open state and button with aria-expanded; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:8-9,48-69`
- vNext now: All nav links flex-wrap visibly; no toggle or menu state; `src/components/marketing/marketing-layout.tsx:15-22`
- Fix: Build mobile hamburger with toggle/expanded/collapse-on-navigation behavior and keyboard focus.

## G2-20-004-036  [P2] MISSING  facet F09  effort S
- Legacy: Mobile menu is conditional drawer-like inline panel under header; trigger `Toggle menu`, closes when link chosen; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-69`
- vNext now: No mobile overlay/menu, all links wrap; `src/components/marketing/marketing-layout.tsx:15-22`
- Fix: Implement legacy conditional mobile nav panel, do not synthesize a full-screen modal.

## G2-20-004-038  [P2] GAP  facet F10  effort S
- Legacy: Header links perform Next client navigation to canonical /, /login, /request-demo; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-47`
- vNext now: Brand /home, /login and /request-demo destinations; `src/components/marketing/marketing-layout.tsx:16-21`
- Fix: Keep navigation targets and link semantics, especially canonical home.

## G2-20-004-051  [P2] GAP  facet F16  effort S
- Legacy: Header desktop nav appears at ≥992px; mobile menu button below; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:139-168`
- vNext now: Header flex column until md 768px, then row, nav never hidden; `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Restore 992px desktop breakpoint and hamburger behavior below it.

## G2-20-004-055  [P2] MISSING  facet F17  effort S
- Legacy: Skip-to-main link visible on keyboard focus targeting #main-content; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-113`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:32-45`
- vNext now: No skip-to-main link or main id in marketing layout; `src/components/marketing/marketing-layout.tsx:12-33`
- Fix: Add keyboard-focusable skip link and id=main-content.

## G2-20-004-056  [P2] MISSING  facet F17  effort S
- Legacy: Mobile menu button labelled Toggle menu with aria-expanded state; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-55`
- vNext now: No menu button; nav exposed inline; `src/components/marketing/marketing-layout.tsx:15-21`
- Fix: Restore focusable toggle, expanded state and Esc/close behavior without trapping focus.

## G2-20-004-061  [P2] GAP  facet F18  effort S
- Legacy: CTA subtitle `See how 42 LMS drives productivity, faster onboarding, and stronger workforce capabilities.`; `docs/legacy-source/frontend/src/pages/enterprises.js:44-46`
- vNext now: Generic CTA subtitle `Explore how 42 LMS can support your learners and teams.`; `src/components/marketing/marketing-layout.tsx:59`
- Fix: If preserving text, pass subline as explicit prop, not fixed generic marketing copy.

## G2-20-004-065  [P2] MISSING  facet F20  effort S
- Legacy: Menu open state resets when any nav item selected; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:59-69`
- vNext now: No state or dismiss path; links always visible; `src/components/marketing/marketing-layout.tsx:15-22`
- Fix: When adding hamburger, clear open on navigation and outside-click/Escape; test tab order.

## G2-20-005-002  [P2] GAP  facet F01  effort S
- Legacy: Header brand logo links to `/`; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-31`
- vNext now: Brand logo links to `/home`; `src/components/marketing/marketing-layout.tsx:16`
- Fix: Use canonical landing route consistently and test college-host root sign-in.

## G2-20-005-003  [P2] GAP  facet F01  effort S
- Legacy: Desktop header links Platform, For Universities, For Enterprises, Request a Demo, Login and separate demo CTA; `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`, `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:33-47`
- vNext now: Nav Platform, Universities, Enterprises, Request a demo, Sign in; `src/components/marketing/marketing-layout.tsx:6-11,17-21`
- Fix: Restore label capitalization, For prefixes, distinct login and demo CTA presentation.

## G2-20-005-007  [P2] GAP  facet F02  effort S
- Legacy: Seven-agent grid with 3 columns at desktop, each icon/name/description; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-123`, `docs/legacy-source/frontend/src/components/marketing/data.js:27-63`
- vNext now: Six generic role-feature cards with no icons; `src/app/home/page.tsx:10-17`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore icon-card density/grid styling; replace AI descriptions only with owner-approved non-AI content.

## G2-20-005-012  [P2] GAP  facet F02  effort S
- Legacy: Dark-gradient CTA band with two actions; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-289`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:397-409`
- vNext now: Light primary-subtle CTA with one action; `src/app/home/page.tsx:32`, `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Recreate dark-gradient legacy CTA and secondary Login action.

## G2-20-005-013  [P2] GAP  facet F02  effort S
- Legacy: Page background white, section bands tinted/alternating, max width1180; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:24-29,47-52,170-175`
- vNext now: Body bg-background; max-w-6xl main with space-y-10/14 and no full-width bands; `src/components/marketing/marketing-layout.tsx:12-25`
- Fix: Port marketing section containers and padding, not generic dashboard cards.

## G2-20-005-014  [P2] GAP  facet F03  effort S
- Legacy: Hero eyebrow with spark icon 'The AI Talent & Workforce Operating System'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:44-46`
- vNext now: Hero eyebrow 'Connected talent development', no spark; `src/app/home/page.tsx:8`, `src/components/marketing/marketing-layout.tsx:35-39`
- Fix: If AI copy retired, retain legacy icon/pill typography and document changed text.

## G2-20-005-016  [P2] MISSING  facet F03  effort S
- Legacy: Hero CSS-only dark console artwork, 4 agent icon chips, pulse indicator; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:66-81`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:244-280`
- vNext now: No hero visual art or chip panel; `src/app/home/page.tsx:6-9`, `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Restore a visual feature panel/illustration of live vNext modules while matching legacy size/shadow/color.

## G2-20-005-020  [P2] MISSING  facet F03  effort S
- Legacy: Legacy footer Product and Get started columns, dynamic social links from env, ©2026; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:5-63`
- vNext now: Footer only brand summary, Privacy, Terms and Contact; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore product/get-started columns, copyright and validated social icons.

## G2-20-005-021  [P2] GAP  facet F03  effort S
- Legacy: Sticky translucent 68px header with border/shadow after 8px scroll; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:11-20`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:96-118`
- vNext now: Regular bordered header, no scroll detection; `src/components/marketing/marketing-layout.tsx:12-23`
- Fix: Restore sticky 68px header, scroll threshold and blur.

## G2-20-005-031  [P2] GAP  facet F05  effort S
- Legacy: Header NAV order Platform/For Universities/For Enterprises/Request a Demo; `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`
- vNext now: Header same destinations but altered labels, footer truncated; `src/components/marketing/marketing-layout.tsx:6-11,25-31`
- Fix: Match exact label order and footer hierarchy; no pagination needed.

## G2-20-005-032  [P2] GAP  facet F06  effort S
- Legacy: No fields or form; demo links route to request-demo page then user-initiated mailto; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:55-61,279-285`, `docs/legacy-source/frontend/src/pages/request-demo.js:73-82`
- vNext now: No fields on home; hero/footer CTA to /request-demo where mailto has subject only; `src/components/marketing/marketing-layout.tsx:40-43,56-61`, `src/app/request-demo/page.tsx:18-20`
- Fix: Preserve navigation; downstream form/body parity handled in linked demo surface.

## G2-20-005-035  [P2] MISSING  facet F09  effort M
- Legacy: Mobile hamburger opens inline menu and closes after nav click; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-69`
- vNext now: No menu toggle; wrapped links always shown; `src/components/marketing/marketing-layout.tsx:15-22`
- Fix: Create Toggle menu control, expanded state and dismissal at <992px.

## G2-20-005-039  [P2] GAP  facet F10  effort S
- Legacy: Footer Contact sales mailto uses prefixed structured subject/body; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:48-54`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: Footer Contact plain mailto:hello@42lms.com; `src/components/marketing/marketing-layout.tsx:28-30`
- Fix: Restore sales subject/body template at Contact footer link if it remains sales contact.

## G2-20-005-048  [P2] GAP  facet F15  effort S
- Legacy: Only potential email is user-initiated mailto on /request-demo and Contact sales; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:48-54`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: Footer mailto lacks prefills, demo-page uses shorter subject; `src/components/marketing/marketing-layout.tsx:30`, `src/app/request-demo/page.tsx:18-20`
- Fix: Add prefills consistent with legacy if demo qualification copy remains.

## G2-20-005-050  [P2] GAP  facet F16  effort S
- Legacy: Header break at 992px with hamburger below; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:139-168`
- vNext now: Header md:flex-row at 768px with wrapping nav; `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Match legacy nav breakpoint and mobile menu control.

## G2-20-005-053  [P2] GAP  facet F16  effort S
- Legacy: Legacy hero switches to two columns at ≥992px with CSS visual; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:204-210,282-285`
- vNext now: New hero is one column at all widths; `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Restore responsive two-column hero and right visual block.

## G2-20-005-054  [P2] MISSING  facet F17  effort S
- Legacy: MarketingLayout skip link to #main-content, visible on focus; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-113`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:32-45`
- vNext now: No skip link/main id; `src/components/marketing/marketing-layout.tsx:12-33`
- Fix: Add skip link with accessible focus visibility.

## G2-20-005-055  [P2] GAP  facet F17  effort S
- Legacy: Nav aria-label Primary, mobile menu toggle aria-label and aria-expanded; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:33-39,48-55`
- vNext now: Nav aria-label Public navigation; no menu toggle/expanded state; `src/components/marketing/marketing-layout.tsx:15-21`
- Fix: Restore mobile toggle semantics and consider matching Primary accessible nav label.

## G2-20-005-057  [P2] GAP  facet F18  effort S
- Legacy: Legacy CTA `Request a Demo`, `See how it works`; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:55-61`
- vNext now: New CTA `Request a demo`, `Explore the platform`; `src/components/marketing/marketing-layout.tsx:41-43`
- Fix: Restore exact button casing and second CTA wording if content parity requested.

## G2-20-031-067  [P2] MISSING  facet F14  effort M
- Legacy: Legacy marketing has OG image /og-image.png (1200x630) and Twitter image (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:75-94`)
- vNext now: New MarketingLayout has no OG/Twitter image tags (`src/components/marketing/marketing-layout.tsx:12-34`)
- Fix: Add canonical OG/Twitter image metadata per marketing route

## G2-20-031-073  [P2] GAP  facet F16  effort M
- Legacy: Legacy hero and audience are styled via responsive marketing-specific CSS and 1180px container (`docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:24-52`, `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`)
- vNext now: New marketing max-w-6xl responsive Tailwind sections and card grids (`src/components/marketing/marketing-layout.tsx:24-24`, `src/components/marketing/marketing-layout.tsx:35-54`)
- Fix: Pixel-compare at phone/tablet/desktop widths; use legacy spacing/breakpoints

## G2-20-031-076  [P2] GAP  facet F17  effort M
- Legacy: Legacy mobile marketing menu uses button aria-label Toggle menu, aria-expanded reflecting open (`docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-55`)
- vNext now: New wrapping links not a stateful menu (`src/components/marketing/marketing-layout.tsx:15-21`)
- Fix: Implement accessible toggle menu and keyboard close

## G2-20-031-084  [P2] GAP  facet F19  effort M
- Legacy: Legacy marketing site includes org+website JSON-LD on all routes and page JSON-LD (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:10-49`, `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:96-105`)
- vNext now: New only home contains one SoftwareApplication JSON-LD; subpages none (`src/app/home/page.tsx:5-8`, `src/components/marketing/marketing-layout.tsx:12-34`)
- Fix: Restore lawful non-AI org/site/page JSON-LD and precise URLs

## G2-20-031-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy marketing canonical URLs per path and custom OG descriptions (`docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:59-94`)
- vNext now: New Next metadata title/description but no explicit canonical/OG image in layout (`src/components/marketing/marketing-layout.tsx:12-34`, `src/app/enterprises/page.tsx:1-3`)
- Fix: Add canonical, OG and Twitter metadata for each public page

## G2-20-008-002  [P2] GAP  facet F01  effort S
- Legacy: Header four nav labels Platform / For Universities / For Enterprises / Request a Demo, separate Login and Demo CTA; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:33-47`, `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`
- vNext now: Header Platform / Universities / Enterprises / Request a demo and Sign in; `src/components/marketing/marketing-layout.tsx:6-11,17-21`
- Fix: Restore exact nav labels/casing and two distinct Login/Demo actions.

## G2-20-008-003  [P2] GAP  facet F01  effort S
- Legacy: Brand logo href='/' on legacy marketing pages; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-31`
- vNext now: Brand logo href='/home'; `src/components/marketing/marketing-layout.tsx:16`
- Fix: Canonical home link parity; verify platform root vs college root.
