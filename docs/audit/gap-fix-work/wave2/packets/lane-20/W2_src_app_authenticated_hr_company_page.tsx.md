# Work packet (wave 2): edit src/app/(authenticated)/hr/company/page.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-001  [P2] GAP  facet F01  effort S
- Legacy: Company & Team heading; `Your profile` targets `/recruiter/profile` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:143-155`)
- vNext now: Same heading, but profile link points to `/hr/profile` (`src/app/(authenticated)/hr/company/page.tsx:99-105`)
- Fix: Keep legacy alias `/recruiter/profile` for user-facing URL and verify both URLs resolve to the same profile.

## G2-13-001-002  [P2] GAP  facet F01  effort S
- Legacy: Tabs are shallowly switched via `?tab=company
- vNext now: Reports `?tab=reports` redirects to separate `/hr/company/reports` route (`src/app/(authenticated)/hr/company/page.tsx:55-62`)
- Fix: Preserve deep link and browser-state semantics of legacy `?tab=reports` or explicitly redirect legacy alias with college selection.

## G2-13-001-004  [P2] GAP  facet F02  effort M
- Legacy: One PageShell, listing header, one enclosing workspace Card containing Tabs (`docs/legacy-source/frontend/src/pages/recruiter/company.js:148-165`)
- vNext now: PageHeader, tabs, standalone sections; no nested workspace Card (`src/app/(authenticated)/hr/company/page.tsx:97-120`)
- Fix: Compare card boundary/padding to old shell; wrap only if the legacy surface demands it.

## G2-13-001-005  [P2] GAP  facet F02  effort M
- Legacy: Company card is avatar+identity then disclosure text (`docs/legacy-source/frontend/src/pages/recruiter/company.js:55-75`)
- vNext now: Company section is heading, affiliation badge, definition list, hiring footprint (`src/app/(authenticated)/hr/company/page.tsx:119-163`)
- Fix: Restore profile-first visual order or document expanded footprint as deliberate extra.

## G2-13-001-008  [P2] MISSING  facet F03  effort S
- Legacy: 64px square avatar uses `logoUrl` or first company character (`docs/legacy-source/frontend/src/pages/recruiter/company.js:57-60`)
- vNext now: Company section has no logo/avatar though service selects logo object path (`src/app/(authenticated)/hr/company/page.tsx:119-143`)
- Fix: Render square company avatar using authorized logo URL; fallback first initial.

## G2-13-001-009  [P2] GAP  facet F03  effort S
- Legacy: Verified companies display a green `Verified` tag; unverified omit it (`docs/legacy-source/frontend/src/pages/recruiter/company.js:61-61`)
- vNext now: All companies display neutral `Linked by the placement cell` badge (`src/app/(authenticated)/hr/company/page.tsx:124-129`)
- Fix: Show verification badge only when backed by trusted verified source; otherwise keep explanatory relationship badge.

## G2-13-001-010  [P2] GAP  facet F03  effort M
- Legacy: Full comma-delimited company domains appear with `@` prefix (`docs/legacy-source/frontend/src/pages/recruiter/company.js:62-62`)
- vNext now: Only `primaryDomain` is exposed and displayed (`src/app/(authenticated)/hr/company/page.tsx:137-140`)
- Fix: Read and display all authorized company domains in stable legacy order.

## G2-13-001-011  [P2] GAP  facet F03  effort S
- Legacy: Industry appears only when populated (`docs/legacy-source/frontend/src/pages/recruiter/company.js:64-64`)
- vNext now: Literal `Industry not set` is always rendered (`src/app/(authenticated)/hr/company/page.tsx:142-142`)
- Fix: Render stored industry when present and choose explicit empty fallback only when missing.

## G2-13-001-012  [P2] GAP  facet F03  effort S
- Legacy: Profile introduction explains placement-cell controls of name/logo (`docs/legacy-source/frontend/src/pages/recruiter/company.js:69-70`)
- vNext now: Explanation describes centralized verified relationship, omitting name/logo contact instruction (`src/app/(authenticated)/hr/company/page.tsx:142-143`)
- Fix: Restore the exact placement-cell change instruction with domain-aware text.

## G2-13-001-013  [P2] GAP  facet F03  effort S
- Legacy: Each team member's drive count has singular/plural (`1 drive`, `2 drives`) (`docs/legacy-source/frontend/src/pages/recruiter/company.js:88-93`)
- vNext now: Literal `drive(s) here` is used for all counts (`src/app/(authenticated)/hr/company/page.tsx:207-207`)
- Fix: Pluralize drive count by integer value.

## G2-13-001-016  [P2] GAP  facet F04  effort S
- Legacy: Company website is shown as its actual string even if unsafe to open (`docs/legacy-source/frontend/src/pages/recruiter/company.js:65-65`)
- vNext now: Malformed or non-http(s) URL is replaced by `Not provided` (`src/app/(authenticated)/hr/company/page.tsx:132-135`)
- Fix: Show safe text for an unopenable recorded URL; never make unsafe link active.

## G2-13-001-017  [P2] GAP  facet F04  effort S
- Legacy: Team description concatenates designation and email with middle dot (`docs/legacy-source/frontend/src/pages/recruiter/company.js:90-90`)
- vNext now: Email appears under name, title appears in right column with `Recruiter` fallback (`src/app/(authenticated)/hr/company/page.tsx:201-210`)
- Fix: Match `designation · email` description and placement of empty titles.

## G2-13-001-018  [P2] GAP  facet F04  effort S
- Legacy: Team member avatar derives firstName initial (`docs/legacy-source/frontend/src/pages/recruiter/company.js:89-90`)
- vNext now: Avatar derives displayName/email initial (`src/app/(authenticated)/hr/company/page.tsx:198-204`)
- Fix: Map first-name component or use declared display-name adaptation and document parity.

## G2-13-001-029  [P2] GAP  facet F06  effort M
- Legacy: Three tabs are only page-level input; selected by `?tab` and shallow replace (`docs/legacy-source/frontend/src/pages/recruiter/company.js:141-165`)
- vNext now: Tabs generate full route transitions; report filters add GET status,pageSize,page (`src/app/(authenticated)/hr/company/page.tsx:114-117`)
- Fix: Preserve URL parameter behavior and avoid dropping original tab query on alias redirects.

## G2-13-001-039  [P2] GAP  facet F09  effort M
- Legacy: AntD Tabs switch content in same card, destroying inactive panes (`docs/legacy-source/frontend/src/pages/recruiter/company.js:159-165`)
- vNext now: Tabs are anchor navigation with separate reports route (`src/app/(authenticated)/hr/company/page.tsx:114-117`)
- Fix: Test focus/scroll reset and query preservation on tab navigation.

## G2-13-001-055  [P2] GAP  facet F13  effort M
- Legacy: College-session fetch failure shows `We couldn't load your account` + Retry (`docs/legacy-source/frontend/src/pages/recruiter/company.js:144-147`)
- vNext now: Main route redirects unauthorized; NO_ACCESS state lacks retry (`src/app/(authenticated)/hr/company/page.tsx:38-40`)
- Fix: Distinguish network failure from unauthorized/no-grant and provide recoverable Retry where needed.

## G2-13-001-056  [P2] GAP  facet F13  effort S
- Legacy: Missing college session shows `Open this on your college's placement address` (`docs/legacy-source/frontend/src/components/recruiter/NoCollegeSession.jsx:7-11`)
- vNext now: NO_ACCESS or Choose a college copy differs (`src/app/(authenticated)/hr/company/page.tsx:70-86`)
- Fix: Preserve tenant-domain recovery wording when user truly lacks an active college session.

## G2-13-001-058  [P2] GAP  facet F13  effort S
- Legacy: True empty team shows `Only you so far`; incomplete team shows warning (`docs/legacy-source/frontend/src/pages/recruiter/company.js:83-93`)
- vNext now: Empty results show `No matching teammates` with roster message (`src/app/(authenticated)/hr/company/page.tsx:192-193`)
- Fix: Differentiate self-only, zero authorized roster, and filtered no-match cases using exact legacy text.

## G2-13-001-070  [P2] GAP  facet F18  effort S
- Legacy: Legacy verified label is `Verified` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:61-61`)
- vNext now: Visible label `Linked by the placement cell` (`src/app/(authenticated)/hr/company/page.tsx:128-128`)
- Fix: Map verified state to exact `Verified` copy and annotate relationship separately.

## G2-13-001-071  [P2] GAP  facet F18  effort S
- Legacy: Legacy team count uses `drive`/`drives` plural (`docs/legacy-source/frontend/src/pages/recruiter/company.js:92-92`)
- vNext now: New `drive(s) here` (`src/app/(authenticated)/hr/company/page.tsx:207-207`)
- Fix: Use exact singular/plural wording.

## G2-13-001-073  [P2] GAP  facet F19  effort M
- Legacy: Legacy fetches company/team/reports only when tab mounts (`docs/legacy-source/frontend/src/pages/recruiter/company.js:35-48`)
- vNext now: New Company view loads team, jobs, and attribution simultaneously even on Company tab (`src/app/(authenticated)/hr/company/page.tsx:68-95`)
- Fix: Defer team/jobs attribution to selected tab and cache read model appropriately.

## G2-13-001-078  [P2] GAP  facet F20  effort S
- Legacy: Unknown tab falls back to `company` while retaining entered query until next tab (`docs/legacy-source/frontend/src/pages/recruiter/company.js:140-142`)
- vNext now: Unknown tab also defaults to company; duplicate params trigger invalid college (`src/app/(authenticated)/hr/company/page.tsx:43-65`)
- Fix: Test malformed `?tab`, repeated query keys and unicode search consistently.

## G2-13-001-088  [P2] MISSING  facet F23  effort M
- Legacy: Legacy displays industry, logo and all domains (`docs/legacy-source/frontend/src/pages/recruiter/company.js:59-65`)
- vNext now: New profile omits rendered logo, industry value, extra domains (`src/app/(authenticated)/hr/company/page.tsx:119-143`)
- Fix: Restore those original fields; confirm schema availability and source security.
