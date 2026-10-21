# Work packet (wave 2): edit src/components/marketing/marketing-layout.tsx (part 4 of 4)

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/home.md, docs/audit/gap2/lane-20/shared-public-pages.md, docs/audit/gap2/lane-20/universities.md

## G2-20-005-056  [P3] GAP  facet F17  effort S
- Legacy: Legacy Hero h1, section h2, cards h3 and checked list semantics; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:47-50,106-119,169-205`
- vNext now: New h1, section h2 and h3 cards, numbered ol journey; `src/components/marketing/marketing-layout.tsx:35-54`, `src/app/home/page.tsx:28-31`
- Fix: Keep semantic list structure for feature/outcome lists in cloned sections.

## G2-20-005-061  [P3] GAP  facet F19  effort S
- Legacy: Six sections of graphic/icon content may use static icons; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:66-81,106-120`
- vNext now: Mostly text-only markup; `src/components/marketing/marketing-layout.tsx:35-62`
- Fix: Restore static icons with appropriate dimensions/lazy loading without adding network APIs.

## G2-20-005-063  [P3] GAP  facet F20  effort S
- Legacy: Footer external social links only if valid HTTPS and path; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:5-11,25-32`
- vNext now: No social links; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Only render real links with noreferrer/noopener.

## G2-20-031-068  [P3] GAP  facet F14  effort S
- Legacy: Legacy marketing logo provides size attributes and lazy/async attributes on relevant images (`docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:23-30`, `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:25-31`)
- vNext now: New logo missing dimensions; footer has no social img (`src/components/marketing/marketing-layout.tsx:15-16`, `src/components/marketing/marketing-layout.tsx:25-32`)
- Fix: Set matching image intrinsic dimensions and accessible labels

## G2-20-031-079  [P3] GAP  facet F18  effort S
- Legacy: Legacy footer nav calls primary action 'Login', demo 'Request a Demo', link 'Contact sales' (`docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:41-47`, `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:47-54`)
- vNext now: New header 'Sign in', footer 'Contact', demo 'Request a demo' (`src/components/marketing/marketing-layout.tsx:6-20`, `src/components/marketing/marketing-layout.tsx:27-30`)
- Fix: Restore exact public action naming and casing

## G2-20-031-089  [P3] GAP  facet F20  effort S
- Legacy: Legacy marketing header scroll listener changes class after 8px (`docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:7-19`)
- vNext now: New stateless header has no scroll elevation (`src/components/marketing/marketing-layout.tsx:12-23`)
- Fix: Implement scroll-aware header style with cleanup and reduced-motion support

## G2-20-008-011  [P3] GAP  facet F02  effort S
- Legacy: Section padding 56px phone, 80px >=768px, alternating background bands; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:170-175`
- vNext now: Global space-y-10/14, sections unbanded; `src/components/marketing/marketing-layout.tsx:24`
- Fix: Match vertical padding and alternating backgrounds.

## G2-20-008-017  [P3] GAP  facet F03  effort S
- Legacy: Agent cards have SVG icon in 48px tinted square, title and description; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:111-118`, `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:304-318`
- vNext now: New five cards have title and description but no icons; `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Bring back icons/box as visual primitives even after AI feature removal.

## G2-20-008-042  [P3] MISSING  facet F10  effort S
- Legacy: Header scroll event toggles scrolled class after 8px; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:11-20`
- vNext now: Header doesn't track scroll; `src/components/marketing/marketing-layout.tsx:12-23`
- Fix: Restore sticky header scrolled style with passive scroll handler.

## G2-20-008-046  [P3] GAP  facet F12  effort S
- Legacy: Legacy footer copyright 2026; `docs/legacy-source/frontend/src/components/marketing/MarketingFooter.jsx:13-15,58-61`
- vNext now: New footer has no year; `src/components/marketing/marketing-layout.tsx:25-31`
- Fix: Restore ©2026 line or implement dynamic year subject to marketing design decision.

## G2-20-008-050  [P3] GAP  facet F14  effort S
- Legacy: Marketing brand uses original PNG logo 44x44; `docs/legacy-source/frontend/src/components/marketing/MarketingHeader.jsx:22-29`
- vNext now: New uses 151x37 legacy wordmark SVG; `src/components/marketing/marketing-layout.tsx:16`, `src/components/public/public-screen.module.css:13`
- Fix: Match original logo dimensions on university marketing header.

## G2-20-008-054  [P3] GAP  facet F16  effort S
- Legacy: Legacy max1180px inner gutters20, sections56→80px; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:47-52,170-175`
- vNext now: New max-w-6xl 1152, px4→px6, gap40→56; `src/components/marketing/marketing-layout.tsx:15,24`
- Fix: Restore measured container/gutters/section spacing.

## G2-20-008-056  [P3] GAP  facet F16  effort S
- Legacy: Legacy agents grid goes 2 columns at 640, 3 at 992; `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:287-290`
- vNext now: New grid goes 2 at 768, 3 at 992; `src/components/marketing/marketing-layout.tsx:50-53`
- Fix: Adjust breakpoint to 640.

## G2-20-008-066  [P3] GAP  facet F19  effort S
- Legacy: Static SVG icon and long content flows; `docs/legacy-source/frontend/src/components/marketing/sections.jsx:112-118`
- vNext now: Icons absent, less content; `src/components/marketing/marketing-layout.tsx:46-54`
- Fix: Restore assets without introducing blocking third-party calls.
