# Work packet (wave 2): edit src/components/marketing/marketing-layout.tsx (part 3 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/universities.md, docs/audit/gap2/lane-10/platform.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md

## G2-20-008-004  [P2] MISSING  facet F01  effort S
- Legacy: Footer Product nav + Get started links, Login, Contact sales, Privacy Policy; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:36-54`
- vNext now: Footer only Privacy, Terms and Contact, missing Product/Get started; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore footer column links and exact order.

## G2-20-008-009  [P2] GAP  facet F02  effort S
- Legacy: CtaBand dark gradient with h2, subline, Request a Demo and Login; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-289`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:397-409`
- vNext now: Light primary-subtle CTA with one link 'See 42 LMS in action'; `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Restore dark gradient CTA, two actions and exact visual spacing.

## G2-20-008-010  [P2] GAP  facet F02  effort S
- Legacy: PageHero container 1180px max with 20px gutters, gradient backdrop; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:7,47-52,196-203`
- vNext now: MarketingHero inside global max-w-6xl main, no gradient; `src/components/marketing/marketing-layout.tsx:12-25,35-44`
- Fix: Recreate full-width gradient hero with inner 1180px container.

## G2-20-008-012  [P2] GAP  facet F03  effort S
- Legacy: PageHero eyebrow 'For Universities', no action buttons; `docs/legacy-source/frontend/src/pages/universities.js:35-39`, `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`
- vNext now: Eyebrow 'For universities' and two hero CTAs injected by MarketingHero; `src/app/universities/page.tsx:6-7`, `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Capitalize 'Universities', suppress extra hero CTAs on sub-page.

## G2-20-008-013  [P2] GAP  facet F03  effort S
- Legacy: Hero h1 'Develop Employable Graduates with AI' with legacy display font; `docs/legacy-source/frontend/src/pages/universities.js:36-38`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:226-234`
- vNext now: Hero h1 'Develop employable graduates through learning and placements' as 30px semibold; `src/app/universities/page.tsx:6`, `src/components/marketing/marketing-layout.tsx:38`
- Fix: Keep no-AI messaging but port hero font treatment, size clamp32–54px and line-height1.08.

## G2-20-008-015  [P2] GAP  facet F03  effort S
- Legacy: Audience bullets each have inline SVG check icon, 15px body; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:146-156`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:350-358`
- vNext now: New campus role cards have plain paragraphs without checklist icons; `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore check-icon list presentation for outcome section.

## G2-20-008-018  [P2] MISSING  facet F03  effort S
- Legacy: CTA uses Request a Demo arrow and Login light button; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-286`
- vNext now: Single See 42 LMS in action, no secondary Login, no arrow; `src/components/marketing/marketing-layout.tsx:56-61`
- Fix: Restore CTA labels/actions/arrow icon.

## G2-20-008-019  [P2] GAP  facet F03  effort S
- Legacy: Sticky translucent header reacts to scrollY>8; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:7-20`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:96-118`
- vNext now: Static header with border always, no scroll state; `src/components/marketing/marketing-layout.tsx:12-23`
- Fix: Add 68px sticky header with blurred translucent background, threshold border/shadow.

## G2-20-008-020  [P2] GAP  facet F03  effort S
- Legacy: Footer has product/info columns, wordmark, 2026 copyright and optional social icons; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:5-63`
- vNext now: New short flat footer with Terms and Contact; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore marketing footer sections, links and legal line.

## G2-20-008-030  [P2] GAP  facet F05  effort S
- Legacy: AudienceDetail 4 ordered list checks +5 ordered badges; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:146-166,208-221`, `docs/legacy-source/frontend/src/components/marketing/data.js:113-129`
- vNext now: New unordered 5-card grid maxColumns3; `src/app/universities/page.tsx:8-14`, `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore list and badge cardinality/order instead of conflating with campus role grid.

## G2-20-008-031  [P2] GAP  facet F05  effort S
- Legacy: AgentGrid 7 cards, 3-col desktop >=992, 2 >=640; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:111-121`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: New feature grid 5 cards, 3-col >=992, 2 >=768; `src/app/universities/page.tsx:8-14`, `src/components/marketing/marketing-layout.tsx:46-53`
- Fix: Match count/gaps and two-column breakpoint at 640px.

## G2-20-008-034  [P2] MISSING  facet F06  effort S
- Legacy: Mobile nav toggle is the only boolean control, aria-expanded; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-55`
- vNext now: Nav links always visible, no menu state/toggle; `src/components/marketing/marketing-layout.tsx:15-22`
- Fix: Restore collapsed mobile menu control and reset-on-link-select.

## G2-20-008-037  [P2] MISSING  facet F09  effort S
- Legacy: Mobile menu reveals list of NAV and Login links, closes after nav click; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-69`
- vNext now: No hamburger/popover/menu; wrapped nav links in header; `src/components/marketing/marketing-layout.tsx:15-22`
- Fix: Implement responsive menu disclosure with proper ARIA and focus behavior.

## G2-20-008-039  [P2] GAP  facet F10  effort S
- Legacy: Footer contact sales uses structured mailto via DEMO_MAILTO; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:48-53`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: Footer plain mailto:hello@42lms.com; `src/components/marketing/marketing-layout.tsx:28-30`
- Fix: Restore prefills or document new contact workflow on sales link.

## G2-20-008-053  [P2] GAP  facet F16  effort S
- Legacy: Legacy 68px sticky header with desktop nav at >=992px, mobile hamburger below; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:96-118,139-168`
- vNext now: New nav flex column below 768, wraps links, no hamburger; `src/components/marketing/marketing-layout.tsx:14-22`
- Fix: Match 992px nav breakpoint and sticky height.

## G2-20-008-055  [P2] GAP  facet F16  effort S
- Legacy: Legacy hero h1 clamp(32px,6vw,54px); `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:226-234`
- vNext now: New 30px fixed desktop h1; `src/components/marketing/marketing-layout.tsx:35-39`
- Fix: Implement clamp hero display typography.

## G2-20-008-057  [P2] MISSING  facet F17  effort S
- Legacy: MarketingLayout keyboard skip link #main-content; `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-113`
- vNext now: No skip link; main has no id; `src/components/marketing/marketing-layout.tsx:12-25`
- Fix: Restore focus-visible skip link to main.

## G2-20-008-058  [P2] MISSING  facet F17  effort S
- Legacy: Mobile menu button aria-label Toggle menu and aria-expanded; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:48-55`
- vNext now: No menu button; nav labelled Public navigation; `src/components/marketing/marketing-layout.tsx:14-21`
- Fix: Restore toggle with aria-expanded and close-on-activation.

## G2-20-008-063  [P2] GAP  facet F18  effort S
- Legacy: Cta subline 'See how 42 LMS improves student outcomes, employability, and placement readiness.'; `docs/legacy-source/frontend/src/pages/universities.js:48-50`
- vNext now: Generic MarketingCta body 'Explore how 42 LMS can support your learners and teams.'; `src/components/marketing/marketing-layout.tsx:59`
- Fix: Make subtitle a prop to allow per-route copy.

## G2-20-008-067  [P2] GAP  facet F20  effort S
- Legacy: Legacy mobile menu open closes on nav links, scroll listener cleaned up; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:11-16,59-69`
- vNext now: No open/close/scroll state; `src/components/marketing/marketing-layout.tsx:12-23`
- Fix: Test close on route navigation, keyboard escape and scroll state under fast taps.

## G2-10-001-037  [P3] GAP  facet F17  effort S
- Legacy: Primary nav aria-label Primary `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:33-39`
- vNext now: Nav aria-label Public navigation `src/components/marketing/marketing-layout.tsx:14-19`
- Fix: Use legacy accessible nav name where literal parity required

## G2-10-001-048  [P3] GAP  facet F20  effort S
- Legacy: Footer year hardcoded 2026 `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:13-15`
- vNext now: Footer copyright absent `src/components/marketing/marketing-layout.tsx:25-32`
- Fix: Use dynamic year when reinstating legal footer

## G2-20-004-012  [P3] GAP  facet F02  effort S
- Legacy: Marketing hero has radial teal gradient and 48px top/8px bottom inner spacing; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:23-35`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:196-203`
- vNext now: Hero plain section with py-6/12, no gradient; `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Implement legacy public PageHero gradient and 48px/8px inner spacing.

## G2-20-004-017  [P3] GAP  facet F03  effort S
- Legacy: Pillar cards each include distinctive SVG icon 48px box + title + description; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:231-240`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:292-318`
- vNext now: Feature cards have title/description only, no icon; `src/components/marketing/marketing-layout.tsx:50-53`
- Fix: Restore pictograms/48px icon container for section where cards are retained.

## G2-20-004-019  [P3] GAP  facet F03  effort S
- Legacy: Marketing footer product summary, copyright 2026 and social icons only for configured real HTTPS profiles; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:5-34,58-61`
- vNext now: Footer '42 LMS · Talent and workforce development' with links, no copyright or conditional social icons; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Bring back copyright and environment-gated social icons without placeholder destinations.

## G2-20-004-044  [P3] GAP  facet F12  effort S
- Legacy: Legacy Footer fixed year 2026; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:13-15,58-60`
- vNext now: No numeric year displayed in new footer; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore copyright string and decide dynamic-year policy.

## G2-20-004-048  [P3] GAP  facet F14  effort S
- Legacy: Marketing logo uses `/assets/images/login/logoo.png` 44×44; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-29`
- vNext now: Uses `/assets/images/legacy-42lms-logo.svg` with CSS 151×37; `src/components/marketing/marketing-layout.tsx:16`, `src/components/public/public-screen.module.css:13`
- Fix: Use original 44px logo on marketing header rather than app sign-in wordmark.

## G2-20-004-052  [P3] GAP  facet F16  effort S
- Legacy: Container max 1180px, 20px gutters; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:7,47-52`
- vNext now: Container max-w-6xl (1152px) and 16px gutters on phone, 24px at md; `src/components/marketing/marketing-layout.tsx:15,24`
- Fix: Use 1180px and 20px side padding at all legacy breakpoints.

## G2-20-004-053  [P3] GAP  facet F16  effort S
- Legacy: Section vertical padding 56px phone, 80px ≥768px; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:170-175`
- vNext now: Page shared space-y-10/14 and hero py-6/12; `src/components/marketing/marketing-layout.tsx:24,35-36`
- Fix: Restore full-width per-section 56/80px padding, not only inter-section gap.

## G2-20-004-054  [P3] GAP  facet F16  effort S
- Legacy: Marketing 3-col pillar grid at ≥992px, 2 columns ≥640px; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: Enterprise features always maxColumns=2 (2 columns ≥768px); `src/app/enterprises/page.tsx:8`, `src/components/marketing/marketing-layout.tsx:46-53`
- Fix: Restore 640/992 breakpoint and 3-column layout for legacy six pillars.

## G2-20-004-057  [P3] GAP  facet F17  effort S
- Legacy: Main primary nav labelled `Primary`; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:33-39`
- vNext now: Main nav labelled `Public navigation`; `src/components/marketing/marketing-layout.tsx:14-15`
- Fix: Decide whether to retain legacy accessible name Primary for consistency.

## G2-20-004-066  [P3] GAP  facet F20  effort S
- Legacy: Legacy conditional external social links require HTTPS with path, rel=noopener noreferrer; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:5-11,25-32`
- vNext now: No social links; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Use validated configurable links only, never placeholder homepages.

## G2-20-005-004  [P3] GAP  facet F01  effort S
- Legacy: Home hero links Request a Demo and See how it works (/platform); `docs/legacy-source/frontend/src/components/marketing/sections.jsx:55-62`
- vNext now: MarketingHero links Request a demo and Explore the platform (/platform); `src/components/marketing/marketing-layout.tsx:40-43`
- Fix: Restore exact See how it works label and legacy button positions.

## G2-20-005-017  [P3] MISSING  facet F03  effort S
- Legacy: Hero trust line 'One platform for universities and enterprises.'; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:63`
- vNext now: No trust line under CTA; `src/components/marketing/marketing-layout.tsx:35-44`
- Fix: Add bottom trust caption matching typography and spacing.

## G2-20-005-018  [P3] GAP  facet F03  effort S
- Legacy: Original cards use SVG feature icon in 48px teal square; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:112-117,231-238`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:304-318`
- vNext now: Cards contain text headings/descriptions only; `src/components/marketing/marketing-layout.tsx:50-53`
- Fix: Provide 48px icon blocks for each feature card.

## G2-20-005-038  [P3] MISSING  facet F10  effort S
- Legacy: Header scrolled state changes class when window.scrollY>8, listener passive, cleanup; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:8-20`
- vNext now: No scrolled state/event listener; `src/components/marketing/marketing-layout.tsx:12-23`
- Fix: Implement with scroll listener and proper cleanup or CSS-driven equivalent.

## G2-20-005-043  [P3] GAP  facet F12  effort S
- Legacy: Footer fixed 2026 calendar year; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:13-14,58-60`
- vNext now: No copyright/year in footer; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore legal footer year/owner string.

## G2-20-005-047  [P3] GAP  facet F14  effort S
- Legacy: Logo uses square `/assets/images/login/logoo.png` 44px; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-29`
- vNext now: Wordmark SVG 151×37; `src/components/marketing/marketing-layout.tsx:16`, `src/components/public/public-screen.module.css:13`
- Fix: Use legacy square logo in marketing header or document updated branding exemption.

## G2-20-005-051  [P3] GAP  facet F16  effort S
- Legacy: Legacy max1180 container gutters 20; section pad 56/80; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:47-52,170-175`
- vNext now: max-w-6xl 1152, 16→24 gutters, global section gaps 40→56; `src/components/marketing/marketing-layout.tsx:15,24`
- Fix: Match width/gutters/vertical section paddings exactly.

## G2-20-005-052  [P3] GAP  facet F16  effort S
- Legacy: Legacy card grid 2 columns ≥640px, 3 ≥992px; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: New feature grid 2 ≥768px, 3 ≥992px; `src/components/marketing/marketing-layout.tsx:46-53`
- Fix: Match two-column breakpoint to 640px.
