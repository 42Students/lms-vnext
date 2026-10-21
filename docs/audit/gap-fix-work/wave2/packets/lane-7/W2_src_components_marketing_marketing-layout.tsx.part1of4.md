# Work packet (wave 2): edit src/components/marketing/marketing-layout.tsx (part 1 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/platform.md, docs/audit/gap2/lane-12/request-demo.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/enterprises.md

## G2-10-001-002  [P2] GAP  facet F01  effort S
- Legacy: Header logo routes to / `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-31`
- vNext now: Header logo routes to /home `src/components/marketing/marketing-layout.tsx:15-16`
- Fix: Restore homepage route / for the public brand link

## G2-10-001-003  [P2] GAP  facet F01  effort S
- Legacy: Header For Universities and For Enterprises nav labels `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`
- vNext now: Header Universities and Enterprises labels `src/components/marketing/marketing-layout.tsx:6-11`
- Fix: Restore For prefix in both menu labels

## G2-10-001-004  [P2] GAP  facet F01  effort S
- Legacy: Header Login and separate Request a Demo CTA `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:41-47`
- vNext now: Only Sign in CTA in header; demo in hero `src/components/marketing/marketing-layout.tsx:17-21` `src/components/marketing/marketing-layout.tsx:40-43`
- Fix: Restore dual header actions and old Login label

## G2-10-001-007  [P2] GAP  facet F02  effort S
- Legacy: Hero full-width gradient and 760px internal content `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:196-203`
- vNext now: Plain constrained hero without gradient `src/components/marketing/marketing-layout.tsx:24-24` `src/components/marketing/marketing-layout.tsx:35-45`
- Fix: Recreate legacy hero gradient and dimensions while preserving approved copy

## G2-10-001-008  [P2] GAP  facet F02  effort M
- Legacy: Alternating neutral pillars section and teal-tinted integration section `docs/legacy-source/frontend/src/components/marketing/sections.jsx:125-143` `docs/legacy-source/frontend/src/components/marketing/sections.jsx:223-242` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:170-174`
- vNext now: Uniform container and plain card sections `src/app/platform/page.tsx:8-21` `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Reproduce alternating full-width legacy section backgrounds

## G2-10-001-009  [P2] GAP  facet F02  effort S
- Legacy: CTA has dark gradient and radius 22px `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-290` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:397-409`
- vNext now: CTA has pale primary-subtle background and border `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Apply dark gradient CTA treatment with white text

## G2-10-001-010  [P2] GAP  facet F03  effort M
- Legacy: Seven AI agent cards with decorative line SVG and 48px icon tiles `docs/legacy-source/frontend/src/components/marketing/sections.jsx:106-123` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:304-318`
- vNext now: Six workspace cards with heading and copy only `src/app/platform/page.tsx:8-15` `src/components/marketing/marketing-layout.tsx:50-53`
- Fix: Add icon tiles to approved non-AI role cards and resolve card count

## G2-10-001-014  [P2] MISSING  facet F03  effort S
- Legacy: CTA offers Request a Demo plus Login `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-285`
- vNext now: Only See 42 LMS in action `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Add secondary Login CTA and align first button treatment

## G2-10-001-015  [P2] GAP  facet F03  effort M
- Legacy: Footer Product and Get started columns plus optional socials `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:18-55`
- vNext now: Footer single brand line and three simple links `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore footer columns and conditionally valid social links

## G2-10-001-019  [P2] MISSING  facet F04  effort S
- Legacy: Footer copyright with 2026 and JRSPF Technologies Pvt. Ltd. `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:13-15` `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:58-60`
- vNext now: No year or legal name `src/components/marketing/marketing-layout.tsx:25-32`
- Fix: Restore legal footer copyright with current year policy

## G2-10-001-024  [P2] MISSING  facet F09  effort M
- Legacy: Hamburger opens mobile menu; selecting link closes it `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-70`
- vNext now: Always-visible wrapping inline links and no drawer `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Implement old toggleable mobile menu and close-on-select rule

## G2-10-001-026  [P2] GAP  facet F10  effort S
- Legacy: Demo link navigates request-demo; footer Contact sales opens prefilled mailto `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-285` `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:47-54` `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: CTA navigates request-demo; destination email link has only subject `src/components/marketing/marketing-layout.tsx:56-61` `src/app/request-demo/page.tsx:18-20`
- Fix: Preserve prefilled demo email body in the actual request-demo workflow

## G2-10-001-033  [P2] GAP  facet F16  effort M
- Legacy: Mobile toggle below 992px and desktop nav above; 68px header `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:110-168`
- vNext now: Flex nav changes at 768px, no toggle `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Use legacy 992px menu breakpoint and header sizing

## G2-10-001-034  [P2] GAP  facet F16  effort S
- Legacy: Two-card grid begins 640px; three-column grid at 992px `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: Two-card grid begins 768px; three at 992px `src/components/marketing/marketing-layout.tsx:46-53`
- Fix: Change tablet grid threshold to 640px

## G2-10-001-035  [P2] GAP  facet F16  effort S
- Legacy: Section padding is 56px mobile and 80px from 768px `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:170-174`
- vNext now: Main uses space-y-10 mobile and space-y-14 md `src/components/marketing/marketing-layout.tsx:24-24`
- Fix: Reproduce legacy section vertical padding and spacing

## G2-10-001-038  [P2] MISSING  facet F17  effort S
- Legacy: Mobile menu button has aria-expanded and aria-label; SVG aria-hidden `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-55` `docs/legacy-source/frontend/src/components/marketing/icons.jsx:82-89`
- vNext now: No toggle button or expanded state `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Add keyboard-accessible toggle with expanded state and decorative icon

## G2-10-001-045  [P2] GAP  facet F18  effort S
- Legacy: CTA The future of learning is autonomous; Request a Demo `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-285`
- vNext now: CTA Explore the platform with our team; See 42 LMS in action `src/app/platform/page.tsx:24-24` `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Approve non-AI text exception and restore CTA geometry

## G2-10-001-046  [P2] GAP  facet F18  effort S
- Legacy: Footer Privacy Policy and Contact sales `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:48-54`
- vNext now: Footer Privacy and Contact `src/components/marketing/marketing-layout.tsx:28-31`
- Fix: Match old copy labels

## G2-12-001-001  [P2] GAP  facet F01 Purpose, entry points, navigation  effort S
- Legacy: Public `/request-demo`, menu label `Request a Demo`, no visible breadcrumb `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`
- vNext now: Route exists but menu label lower-case `Request a demo` `src/components/marketing/marketing-layout.tsx:6-11`
- Fix: Restore exact nav label

## G2-12-001-002  [P2] GAP  facet F01 Purpose, entry points, navigation  effort S
- Legacy: Logo links to `/` `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-31`
- vNext now: Logo links to `/home` `src/components/marketing/marketing-layout.tsx:15-16`
- Fix: Align logo destination after redirect verification

## G2-12-001-003  [P2] MISSING  facet F01 Purpose, entry points, navigation  effort S
- Legacy: Request demo available in footer Get started links `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:47-54`
- vNext now: No footer request-demo link `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore footer Request a Demo link

## G2-12-001-019  [P2] GAP  facet F09 Dialogs/menus  effort S
- Legacy: Header provides mobile menu toggle and closing on link click `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-69`
- vNext now: No mobile toggle: flex-wrap visible links `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Implement legacy breakpoint mobile menu

## G2-12-001-030  [P2] GAP  facet F16 Responsive  effort S
- Legacy: Desktop nav >=992px; mobile menu toggle otherwise `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:148-169`
- vNext now: Inline nav wraps on small viewports, md layout shift `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Implement 992px nav breakpoint

## G2-12-001-033  [P2] GAP  facet F17 Keyboard/accessibility  effort S
- Legacy: Mobile menu button aria-expanded and aria-label `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-55`
- vNext now: No menu button; links accessible via Tab `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Add semantic button and expanded state

## G2-12-001-045  [P2] GAP  facet F23 Extras/intentional drops  effort S
- Legacy: Legacy footer 3-column product/get-started, social links conditional on valid URLs `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:5-61`
- vNext now: Minimal inline footer/Privacy/Terms/Contact `src/components/marketing/marketing-layout.tsx:25-32`
- Fix: Match footer columns and optional verified social URLs

## G2-20-031-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy `/` tenant login via index.js:11-25,54-73 and `/home` marketing via home.js:28-43; marketing brand links `/` via MarketingHeader.jsx:22-29.
- vNext now: vNext `src/app/page.tsx:73-106` tenant-aware sign-in/landing and `src/app/home/page.tsx:5-34`; brand href `/home` `src/components/marketing/marketing-layout.tsx:15-20`.
- Fix: Keep tenant-aware sign-in; verify public-origin landing and align legacy marketing logo destination without breaking login.

## G2-20-031-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy header menu Platform, For Universities, For Enterprises, Request a Demo plus Login and separate demo CTA `MarketingHeader.jsx:33-47`.
- vNext now: vNext shorter nav Platform, Universities, Enterprises, Request a demo, Sign in; no separate header demo CTA `marketing-layout.tsx:6-21`.
- Fix: Reproduce header CTA, labels/order and mobile equivalents; preserve vNext routes.

## G2-20-031-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy marketing header logo, desktop links, standalone Login and Demo, toggle hamburger `MarketingHeader.jsx:18-70`.
- vNext now: vNext legacy logo svg and inline wrapped nav with Sign in but NO hamburger `marketing-layout.tsx:14-22`.
- Fix: Add responsive hamburger with aria-expanded, close-on-navigate and sticky scrolled header styling.

## G2-20-031-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy marketing footer Product/Get started multi-column links and optional social links `MarketingFooter.jsx:7-53`.
- vNext now: vNext one-line footer Privacy, Terms, Contact `src/components/marketing/marketing-layout.tsx:25-31`.
- Fix: Match legacy footer columns/logo/social placement; Terms addition must be documented EXTRA.

## G2-20-031-025  [P2] MISSING  facet F09  effort M
- Legacy: Legacy mobile marketing menu button toggles panel and closes via nav click `MarketingHeader.jsx:48-69`.
- vNext now: vNext nav wraps visibly across rows; no menu/disclosure `src/components/marketing/marketing-layout.tsx:14-22`.
- Fix: Build mobile drawer/accordion preserving button aria-label, aria-expanded, Escape and focus behavior.

## G2-20-031-040  [P2] GAP  facet F16  effort M
- Legacy: Legacy marketing responsive sticky header with 992px hamburger breakpoint and split hero/card layouts `MarketingHeader.jsx:7-69;marketing.module.scss:139-175`.
- vNext now: vNext inline nav from md 768, grid layout 768/992, no mobile hamburger `src/components/marketing/marketing-layout.tsx:14-24,46-53`.
- Fix: Mirror legacy 992px menu transition and card/section breakpoints; do not make phone links overflow.

## G2-20-031-042  [P2] GAP  facet F17  effort M
- Legacy: Legacy mobile menu button `aria-label='Toggle menu'` `MarketingHeader.jsx:48-53`; policy quick nav with accessible section anchors `privacy-policy.js:61-69`.
- vNext now: vNext marketing nav with aria-label 'Public navigation' but no menu button `src/components/marketing/marketing-layout.tsx:14-20`, policy redirected.
- Fix: Restore keyboard-operable menu and hash target focus/landmarks in policy.

## G2-20-031-044  [P2] GAP  facet F18  effort S
- Legacy: Legacy header 'For Universities', 'For Enterprises', 'Login', 'Request a Demo' `MarketingHeader.jsx:33-47`.
- vNext now: vNext 'Universities', 'Enterprises', 'Sign in', 'Request a demo' `src/components/marketing/marketing-layout.tsx:6-20`.
- Fix: Use exact legacy chrome wording; intentional marketing body copy changes unaffected.

## G2-20-004-002  [P2] GAP  facet F01  effort S
- Legacy: Brand logo points to `/` (marketing home), `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-31`
- vNext now: Brand logo points to `/home`, while root `/` conditionally redirects to /home for platform users; `src/components/marketing/marketing-layout.tsx:14-16`, `src/app/page.tsx:97-103`
- Fix: Keep visitor's canonical home navigation to / or document /home as the canonical replacement; verify college-host behavior.

## G2-20-004-003  [P2] GAP  facet F01  effort S
- Legacy: Primary nav `Platform, For Universities, For Enterprises, Request a Demo` in that order; `docs/legacy-source/frontend/src/components/marketing/data.js:20-25`
- vNext now: Nav `Platform, Universities, Enterprises, Request a demo` in same order; `src/components/marketing/marketing-layout.tsx:6-11`
- Fix: Restore exact 'For ' prefixes and capitalized 'Demo'.

## G2-20-004-004  [P2] GAP  facet F01  effort S
- Legacy: Header separate `Login` link and `Request a Demo` primary CTA; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:41-47`
- vNext now: Header only `Sign in` primary, demo within ordinary nav; `src/components/marketing/marketing-layout.tsx:17-21`
- Fix: Reintroduce separate header Login text link and primary Request a Demo button in legacy order.

## G2-20-004-005  [P2] MISSING  facet F01  effort S
- Legacy: Marketing footer links to platform, universities, enterprises, demo, Login, Contact sales, Privacy Policy; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:36-54`
- vNext now: Footer links only Privacy, Terms, Contact; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore legacy footer's Product and Get started columns and exact links.

## G2-20-004-007  [P2] MISSING  facet F02  effort S
- Legacy: AudienceDetail section contains section heading, four checklist points, Outcomes heading, five pills; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:131-146`
- vNext now: FeatureGrid shows four unrelated tile cards, no checklist/outcomes; `src/app/enterprises/page.tsx:8-13`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Render checklist and five outcomes badges or document intentional content redesign and retain physical section shapes.

## G2-20-004-010  [P2] GAP  facet F02  effort S
- Legacy: CTA band includes heading, subline and two buttons; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-289`, `docs/legacy-source/frontend/src/pages/enterprises.js:43-46`
- vNext now: CTA band includes title, generic paragraph and one link; `src/components/marketing/marketing-layout.tsx:56-61`, `src/app/enterprises/page.tsx:14`
- Fix: Restore two-action dark CTA band with specific subtitle if content parity desired.

## G2-20-004-011  [P2] GAP  facet F02  effort S
- Legacy: Legacy body canvas white with individually tinted full-width sections, width max1180 and 20px gutters; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:7,24-29,47-52,170-175`
- vNext now: Body bg-background, one max-w-6xl padded main with space-y-10/14, no tinted section bands; `src/components/marketing/marketing-layout.tsx:12-25`
- Fix: Mirror marketing white sections/full-bleed backgrounds and 1180px container, section padding 56/80px.
