# Work packet (wave 2): edit src/app/request-demo/page.tsx

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/platform.md, docs/audit/gap2/lane-12/request-demo.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/enterprises.md, docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/universities.md

## G2-10-001-026  [P2] GAP  facet F10  effort S
- Legacy: Demo link navigates request-demo; footer Contact sales opens prefilled mailto `docs/legacy-source/frontend/src/components/marketing/sections.jsx:269-285` `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:47-54` `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: CTA navigates request-demo; destination email link has only subject `src/components/marketing/marketing-layout.tsx:56-61` `src/app/request-demo/page.tsx:18-20`
- Fix: Preserve prefilled demo email body in the actual request-demo workflow

## G2-12-001-004  [P2] GAP  facet F02 Layout, section order  effort M
- Legacy: Centered eyebrow + h1 + intro, then two cards side by side >=900px `docs/legacy-source/frontend/src/pages/request-demo.js:46-85`
- vNext now: Left aligned title/lede, single section and CTA `src/app/request-demo/page.tsx:7-21`
- Fix: Restore head and two-card hierarchy

## G2-12-001-005  [P2] GAP  facet F02 Layout, section order  effort S
- Legacy: Section padding 56px/80px; cards capped 920px `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:171-194`
- vNext now: Outer and inner vertical padding combined; inner max-w-3xl `src/app/request-demo/page.tsx:7`
- Fix: Match section/container dimensions

## G2-12-001-006  [P2] MISSING  facet F02 Layout, section order  effort S
- Legacy: Dark Get in touch article to right of What to expect `docs/legacy-source/frontend/src/pages/request-demo.js:56-84`
- vNext now: No second dark article `src/app/request-demo/page.tsx:10-20`
- Fix: Recreate separate dark contact card

## G2-12-001-007  [P2] MISSING  facet F03 Visible elements  effort S
- Legacy: Eyebrow `Request a Demo` `docs/legacy-source/frontend/src/pages/request-demo.js:48-49`
- vNext now: PageHeader has no eyebrow prop here `src/app/request-demo/page.tsx:8`
- Fix: Render upper eyebrow

## G2-12-001-008  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Four check SVGs beside each expectation `docs/legacy-source/frontend/src/pages/request-demo.js:59-64`
- vNext now: Three disc bullets `src/app/request-demo/page.tsx:12-16`
- Fix: Restore four icon-led rows

## G2-12-001-010  [P2] MISSING  facet F03 Visible elements  effort S
- Legacy: `Get in touch` heading and specialist follow-up helper copy `docs/legacy-source/frontend/src/pages/request-demo.js:68-72`
- vNext now: Heading/helper text absent `src/app/request-demo/page.tsx:17-20`
- Fix: Restore card heading and helper text

## G2-12-001-011  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Secondary email is a clickable mailto link `docs/legacy-source/frontend/src/pages/request-demo.js:78-82`
- vNext now: Contact email rendered as plain text `src/app/request-demo/page.tsx:20`
- Fix: Make secondary email clickable

## G2-12-001-012  [P2] GAP  facet F04 Data/formatting  effort S
- Legacy: Four static EXPECT strings; email from BRAND.demoEmail `docs/legacy-source/frontend/src/pages/request-demo.js:6-11`
- vNext now: Three different strings; literal email `src/app/request-demo/page.tsx:12-20`
- Fix: Reconcile four expectation items and copy with AI-free policy

## G2-12-001-013  [P2] GAP  facet F04 Data/formatting  effort S
- Legacy: Page SEO title `Request a Demo — 42 LMS` and full description `docs/legacy-source/frontend/src/pages/request-demo.js:40-44`
- vNext now: Title `Request a demo \| 42 LMS`, abbreviated description `src/app/request-demo/page.tsx:4`
- Fix: Restore approved full metadata title/description

## G2-12-001-014  [P2] GAP  facet F05 Tables/lists  effort S
- Legacy: Ordered static list of 4 items; no sort/filter/pagination `docs/legacy-source/frontend/src/pages/request-demo.js:6-11`
- vNext now: Static list of 3 with no sort/filter/pagination `src/app/request-demo/page.tsx:12-16`
- Fix: Match item count, order and text; no table features needed

## G2-12-001-028  [P2] GAP  facet F15 Emails/notifications  effort S
- Legacy: Email subject and template body labels defined centrally `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: Short subject only; body absent `src/app/request-demo/page.tsx:18`
- Fix: Restore approved composer prefill template

## G2-12-001-029  [P2] GAP  facet F16 Responsive  effort S
- Legacy: 2-column cards at 900px and full-width single column below `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:337-345`
- vNext now: Single column at every width `src/app/request-demo/page.tsx:7-21`
- Fix: Match card grid breakpoint 900px

## G2-12-001-031  [P2] GAP  facet F16 Responsive  effort S
- Legacy: Section 56px vertical under 768px, 80px above `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:171-174`
- vNext now: Inner page py-6 / py-14 in addition to outer py-8 / py-14 `src/app/request-demo/page.tsx:7`
- Fix: Remove doubled padding; use legacy section spacing

## G2-12-001-035  [P2] GAP  facet F18 Copy  effort S
- Legacy: Intro `Tell us a little about your organization ... personalized walkthrough.` `docs/legacy-source/frontend/src/pages/request-demo.js:50-53`
- vNext now: Intro about connected learning, practical projects, placement operations `src/app/request-demo/page.tsx:8-9`
- Fix: Approve parity copy while preserving no-AI owner directive

## G2-12-001-036  [P2] GAP  facet F18 Copy  effort S
- Legacy: Expectations: autonomous AI platform, AI assessments, tailored view, clear next steps `docs/legacy-source/frontend/src/pages/request-demo.js:6-11`
- vNext now: Expectations: institution walkthrough, workflow collaboration, implementation goals `src/app/request-demo/page.tsx:12-16`
- Fix: Record each approved claim change; restore 4-row visual structure

## G2-12-001-037  [P2] GAP  facet F18 Copy  effort S
- Legacy: `Get in touch`, `Email us and a specialist ...`, `or write to` `docs/legacy-source/frontend/src/pages/request-demo.js:68-82`
- vNext now: `Contact: ... No form data is collected...` `src/app/request-demo/page.tsx:20`
- Fix: Restore non-AI wording/sections and linked contact

## G2-12-001-039  [P2] GAP  facet F20 Edge cases  effort S
- Legacy: encodeURIComponent escapes newline, apostrophe, em dash, labels `docs/legacy-source/frontend/src/components/marketing/data.js:11-18`
- vNext now: Single literal percent-encoded subject, no encoded body `src/app/request-demo/page.tsx:18`
- Fix: Build subject and body with encodeURIComponent

## G2-12-001-046  [P2] GAP  facet F23 Extras/intentional drops  effort S
- Legacy: Legacy sells autonomous AI; owner dropped AI features `docs/legacy-source/frontend/src/pages/request-demo.js:6-10`
- vNext now: VNext replaces claims with non-AI integrated learning copy `src/app/request-demo/page.tsx:9,13-15`
- Fix: Document intentional removal, NEVER automatically re-add AI product promises

## G2-20-031-007  [P2] GAP  facet F02  effort M
- Legacy: Legacy demo has eyebrow/head/lede then TWO contrasting article cards 'What to expect' and dark 'Get in touch' `request-demo.js:46-80`.
- vNext now: vNext single-column head, divider section, mailto action `src/app/request-demo/page.tsx:7-20`.
- Fix: Restore 2-column two-card composition, dark contact panel and legacy spacing at desktop.

## G2-20-031-051  [P2] MISSING  facet F21  effort M
- Legacy: Legacy marketing JSON-LD structured data and SEO metadata `request-demo.js:13-44;enterprises.js:8-34;universities.js:8-34`.
- vNext now: vNext metadata title/description but no per-page JSON-LD in shown routes `src/app/request-demo/page.tsx:1-6;src/app/enterprises/page.tsx:1-5`.
- Fix: Restore canonical, OG/Twitter and structured data where still accurate (remove AI promises).

## G2-20-004-067  [P2] GAP  facet F20  effort S
- Legacy: Demo CTA is a route link; actual lead information is composed by user's email app, not persisted; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:279-286`, `docs/legacy-source/frontend/src/pages/request-demo.js:68-82`
- vNext now: Same mailto side effect but shorter subject; `src/app/request-demo/page.tsx:18-20`
- Fix: Test percent-encoding for +, &, special characters in subject and prefilled body; avoid mailto double-encoding.

## G2-20-005-032  [P2] GAP  facet F06  effort S
- Legacy: No fields or form; demo links route to request-demo page then user-initiated mailto; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:55-61,279-285`, `docs/legacy-source/frontend/src/pages/request-demo.js:73-82`
- vNext now: No fields on home; hero/footer CTA to /request-demo where mailto has subject only; `src/components/marketing/marketing-layout.tsx:40-43,56-61`, `src/app/request-demo/page.tsx:18-20`
- Fix: Preserve navigation; downstream form/body parity handled in linked demo surface.

## G2-20-005-048  [P2] GAP  facet F15  effort S
- Legacy: Only potential email is user-initiated mailto on /request-demo and Contact sales; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:48-54`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: Footer mailto lacks prefills, demo-page uses shorter subject; `src/components/marketing/marketing-layout.tsx:30`, `src/app/request-demo/page.tsx:18-20`
- Fix: Add prefills consistent with legacy if demo qualification copy remains.

## G2-20-008-051  [P2] GAP  facet F15  effort S
- Legacy: Only mailto on downstream demo page and footer; no automated email; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:48-53`, `docs/legacy-source/frontend/src/components/marketing/data.js:10-18`
- vNext now: Same concept, changed subject/body downstream; `src/app/request-demo/page.tsx:18-20`
- Fix: Check generated email subject/body in Outlook/Gmail clients; no send via server.

## G2-12-001-009  [P3] MISSING  facet F03 Visible elements  effort S
- Legacy: CTA text + right arrow SVG `docs/legacy-source/frontend/src/pages/request-demo.js:73-76`
- vNext now: Text-only CTA `src/app/request-demo/page.tsx:18-19`
- Fix: Add aria-hidden arrow icon

## G2-12-001-034  [P3] GAP  facet F17 Keyboard/accessibility  effort S
- Legacy: Decorative icon SVG marked aria-hidden `docs/legacy-source/frontend/src/components/marketing/icons.jsx:82-88`
- vNext now: No SVGs in list/action `src/app/request-demo/page.tsx:12-19`
- Fix: When restoring icons preserve aria-hidden

## G2-20-031-010  [P3] GAP  facet F03  effort S
- Legacy: Legacy demo check SVG on each of four bullets, mail action arrow icon `request-demo.js:56-75`.
- vNext now: vNext `src/app/request-demo/page.tsx:10-20` plain bullets and simple action.
- Fix: Restore check icons and arrow affordance, matching dimensions/states.

## G2-20-031-039  [P3] GAP  facet F15  effort S
- Legacy: Legacy demo is mailto, not backend form: CTA constructed from DEMO_MAILTO `request-demo.js:69-80`.
- vNext now: vNext email subject links to `hello@42lms.com` `src/app/request-demo/page.tsx:18-20`.
- Fix: Compare legacy demo email and subject/body prefill against current mailto; preserve no server-side data collection.

## G2-20-031-086  [P3] GAP  facet F19  effort S
- Legacy: Legacy demo ContactPage + BreadcrumbList JSON-LD (`docs/legacy-source/frontend/src/pages/request-demo.js:13-36`)
- vNext now: New request-demo only metadata and link (`src/app/request-demo/page.tsx:1-23`)
- Fix: Emit ContactPage/BreadcrumbList JSON-LD for demo route
