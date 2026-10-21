# Work packet (wave 2): edit src/app/(authenticated)/tpo/announcements/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-11/tpo-announcements.md

## G2-19-031-011  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:88-94` — Composer is a 640px modal with audience/notice fields.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:88-117` — Dialog is present but contains separate GET preview and POST form.
- Fix: Keep preview within modal without losing unsaved fields.

## G2-19-031-018  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:65-84` — Announcement cards show pin, state, audience, author, sent meta and action.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:175-201` — Title and meta are visible, but full audience/action/read meta differs.
- Fix: Render card data and tags in legacy order.

## G2-19-031-058  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:88-165` — Audience preview is in 640px composer modal.
- vNext now: `src/app/(authenticated)/tpo/announcements/page.tsx:88-117` — New modal preview GET rerenders page; separate publisher form.
- Fix: Preview via client fetch without closing/reinitializing composer.

## G2-11-005-001  [P2] GAP  facet F01  effort S
- Legacy: Legacy default tab students; `?tab=from42` switches to company-wide From 42 `docs/legacy-source/frontend/src/pages/tpo/announcements.js:26`
- vNext now: vNext tab yours/from-42/deleted, aliases new values `src/app/(authenticated)/tpo/announcements/page.tsx:153`
- Fix: Keep from42 deep link or redirect to from-42

## G2-11-005-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy `router.replace` shallow preserves list context and scroll `docs/legacy-source/frontend/src/pages/tpo/announcements.js:96`
- vNext now: vNext full route navigation via href `src/app/(authenticated)/tpo/announcements/page.tsx:157`
- Fix: Preserve scroll position/focus on tab switch

## G2-11-005-005  [P2] GAP  facet F02  effort S
- Legacy: PageShell and ListingPageHeader within scroll-container `docs/legacy-source/frontend/src/pages/tpo/announcements.js:88`
- vNext now: vNext flat div with PageHeader and section stack `src/app/(authenticated)/tpo/announcements/page.tsx:84`
- Fix: Clone PageShell margins/typography

## G2-11-005-006  [P2] GAP  facet F02  effort S
- Legacy: Segmented tabs with 16px bottom margin `docs/legacy-source/frontend/src/pages/tpo/announcements.js:95`
- vNext now: vNext horizontal Tabs bar with third tab `src/app/(authenticated)/tpo/announcements/page.tsx:153`
- Fix: Use legacy Segmented shape/spacing

## G2-11-005-007  [P2] GAP  facet F02  effort S
- Legacy: AnnouncementCard border, pin corner and highlight/ended styling `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:63`
- vNext now: vNext divided ordered list without per-card border `src/app/(authenticated)/tpo/announcements/page.tsx:173`
- Fix: Render legacy announcement card layout

## G2-11-005-012  [P2] GAP  facet F03  effort S
- Legacy: From 42 unread count displayed in small Badge only when not on From 42 tab `docs/legacy-source/frontend/src/pages/tpo/announcements.js:97`
- vNext now: vNext plain `(count)` in tab label, including when selected `src/app/(authenticated)/tpo/announcements/page.tsx:156`
- Fix: Restore conditional Badge

## G2-11-005-017  [P2] GAP  facet F03  effort S
- Legacy: Empty students text `Nothing yet. Tell students about a talk, a deadline or a change; pick who it is for, and see who has read it.` `docs/legacy-source/frontend/src/pages/tpo/announcements.js:101`
- vNext now: Generic No announcements from this sender yet `src/app/(authenticated)/tpo/announcements/page.tsx:291`
- Fix: Restore exact empty text

## G2-11-005-018  [P2] GAP  facet F03  effort S
- Legacy: Empty From42 text `Nothing from 42 yet.` `docs/legacy-source/frontend/src/pages/tpo/announcements.js:110`
- vNext now: Same generic no-announcements empty `src/app/(authenticated)/tpo/announcements/page.tsx:291`
- Fix: Tab-specific empty

## G2-11-005-020  [P2] GAP  facet F04  effort S
- Legacy: Pinned icon PushpinFilled with aria-label `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:66`
- vNext now: Text suffix `· Pinned` `src/app/(authenticated)/tpo/announcements/page.tsx:175`
- Fix: Restore pushpin glyph

## G2-11-005-021  [P2] GAP  facet F04  effort S
- Legacy: New announcements Tag blue `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:68`
- vNext now: vNext New small bordered span `src/app/(authenticated)/tpo/announcements/page.tsx:176`
- Fix: Use blue Tag

## G2-11-005-022  [P2] GAP  facet F04  effort S
- Legacy: Lifecycle Tag gold/green/gray by stateOf `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:69`
- vNext now: Status displayed in role=status paragraph `src/app/(authenticated)/tpo/announcements/page.tsx:185`
- Fix: Use tag label/color exactly

## G2-11-005-023  [P2] GAP  facet F04  effort S
- Legacy: Updated Tag on changed notice `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:70`
- vNext now: Updated inline metadata `src/app/(authenticated)/tpo/announcements/page.tsx:182`
- Fix: Show Tag

## G2-11-005-024  [P2] GAP  facet F04  effort S
- Legacy: Author/time metadata in announcement-card__meta `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:72`
- vNext now: New text By sender · timestamp IST · audience `src/app/(authenticated)/tpo/announcements/page.tsx:178`
- Fix: Match source order/time format

## G2-11-005-025  [P2] GAP  facet F04  effort S
- Legacy: Audience label placement in own card metadata `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:76`
- vNext now: New For selected group suffix in metadata `src/app/(authenticated)/tpo/announcements/page.tsx:181`
- Fix: Use legacy audience label

## G2-11-005-027  [P2] GAP  facet F04  effort S
- Legacy: Ended card faded via `is-ended` class `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:63`
- vNext now: Only Ended status line, no faded card class `src/app/(authenticated)/tpo/announcements/page.tsx:188`
- Fix: Restore ended visual treatment

## G2-11-005-028  [P2] GAP  facet F05  effort S
- Legacy: Full items returned in list, no pagination surface `docs/legacy-source/frontend/src/pages/tpo/announcements.js:100`
- vNext now: vNext paginated at server level with Previous/Show older `src/app/(authenticated)/tpo/announcements/page.tsx:292`
- Fix: Verify item limit and preserve all-list flow

## G2-11-005-035  [P2] GAP  facet F06  effort S
- Legacy: Title required non-whitespace, max200, placeholder Omega pre-placement talk on Monday `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:93`
- vNext now: Title required max200, no placeholder `src/app/(authenticated)/tpo/announcements/page.tsx:122`
- Fix: Add placeholder, trim whitespace required

## G2-11-005-036  [P2] GAP  facet F06  effort S
- Legacy: Announcement body label, max8000 rows5, showCount `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:96`
- vNext now: Message label, max8000 rows5 without counter `src/app/(authenticated)/tpo/announcements/page.tsx:124`
- Fix: Match label and show live character count

## G2-11-005-037  [P2] GAP  facet F06  effort S
- Legacy: Body placeholder What, when, where, and what they should do. Links starting with https:// become clickable. `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:97`
- vNext now: Textarea no placeholder `src/app/(authenticated)/tpo/announcements/page.tsx:125`
- Fix: Restore exact placeholder

## G2-11-005-042  [P2] GAP  facet F06  effort S
- Legacy: Button (optional) shown in same form `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:138`
- vNext now: Button (optional) inside details expansion `src/app/(authenticated)/tpo/announcements/page.tsx:126`
- Fix: Default expanded and match spacing

## G2-11-005-046  [P2] GAP  facet F06  effort S
- Legacy: Show until (optional) helper says students stop seeing it, TPO still does `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:158`
- vNext now: Show until (IST) input but explanatory helper not in list `src/app/(authenticated)/tpo/announcements/page.tsx:235`
- Fix: Restore helper

## G2-11-005-047  [P2] GAP  facet F06  effort S
- Legacy: Pin it to the top checkbox `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:162`
- vNext now: Pinned checkbox in edit; create form pinned field separate `src/app/(authenticated)/tpo/announcements/page.tsx:240`
- Fix: Preserve exact label and state

## G2-11-005-048  [P2] GAP  facet F06  effort S
- Legacy: Edit sent checkbox Tell them it changed (a short notice to the same students) `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:163`
- vNext now: Tell them it changed plus new explanatory text `src/app/(authenticated)/tpo/announcements/page.tsx:244`
- Fix: Match exact label

## G2-11-005-070  [P2] GAP  facet F10  effort S
- Legacy: GET /api/v1/tpo/announcements `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:208`
- vNext now: vNext server read typed notices service `src/app/(authenticated)/tpo/announcements/page.tsx:35`
- Fix: Ensure same filter, disclosure and failure semantics

## G2-11-005-072  [P2] GAP  facet F10  effort S
- Legacy: PUT /api/v1/tpo/announcements/:id `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:210`
- vNext now: POST /api/placements/tpo/announcements/:id/edit with expectedVersion `src/app/(authenticated)/tpo/announcements/page.tsx:206`
- Fix: Map edit API and re-notification flag

## G2-11-005-073  [P2] GAP  facet F10  effort S
- Legacy: DELETE legacy notice /announcements/:id `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:211`
- vNext now: POST lifecycle action DELETE/RESTORE `src/app/(authenticated)/tpo/announcements/page.tsx:270`
- Fix: Verify undo/delete state parity

## G2-11-005-078  [P2] GAP  facet F11  effort S
- Legacy: New button only for TPO own students tab `docs/legacy-source/frontend/src/pages/tpo/announcements.js:93`
- vNext now: vNext actions require READY notice storage and yours tab `src/app/(authenticated)/tpo/announcements/page.tsx:87`
- Fix: Distinguish table-readiness gating from permissions

## G2-11-005-090  [P2] GAP  facet F13  effort S
- Legacy: Students empty detailed call to action `docs/legacy-source/frontend/src/pages/tpo/announcements.js:101`
- vNext now: No announcements from this sender yet `src/app/(authenticated)/tpo/announcements/page.tsx:291`
- Fix: Restore detailed empty copy

## G2-11-005-091  [P2] GAP  facet F13  effort S
- Legacy: From42 empty Nothing from 42 yet. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:110`
- vNext now: Generic empty `src/app/(authenticated)/tpo/announcements/page.tsx:291`
- Fix: Restore

## G2-11-005-101  [P2] GAP  facet F16  effort S
- Legacy: Legacy PageShell fixed inner gutters, one-column announcement cards `docs/legacy-source/frontend/src/pages/tpo/announcements.js:88`
- vNext now: vNext divided ol responsive text, no cards `src/app/(authenticated)/tpo/announcements/page.tsx:173`
- Fix: Restore one-column card padding

## G2-11-005-103  [P2] GAP  facet F16  effort M
- Legacy: Composer Ant Form vertical with Segmented and inline fields `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:92`
- vNext now: vNext grid Form and separate audience preview form `src/app/(authenticated)/tpo/announcements/page.tsx:117`
- Fix: Match compact vertical modal fields

## G2-11-005-104  [P2] GAP  facet F16  effort S
- Legacy: Link label ~36% width, URL adjacent `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:140`
- vNext now: vNext two independent full-width fields `src/app/(authenticated)/tpo/announcements/page.tsx:128`
- Fix: Clone flex sizing

## G2-11-005-105  [P2] GAP  facet F16  effort S
- Legacy: Card pinned styling even on 375px `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:63`
- vNext now: Full width list items separated by border `src/app/(authenticated)/tpo/announcements/page.tsx:174`
- Fix: Use card layout at all breakpoints

## G2-11-005-107  [P2] GAP  facet F17  effort S
- Legacy: Input Form.Item field error, autofocus invalid `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:93`
- vNext now: Native required with generic mapped errors `src/app/(authenticated)/tpo/announcements/page.tsx:122`
- Fix: Add field error associations and focus

## G2-11-005-108  [P2] GAP  facet F17  effort S
- Legacy: Body TextArea showCount and max8000 `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:97`
- vNext now: Max8000 but no visible count `src/app/(authenticated)/tpo/announcements/page.tsx:125`
- Fix: Show text length

## G2-11-005-111  [P2] GAP  facet F18  effort S
- Legacy: Subtitle What you tell your students, to whom, and who has read it. They read it under Placements. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:92`
- vNext now: vNext heading/short form helper without this subtitle `src/app/(authenticated)/tpo/announcements/page.tsx:84`
- Fix: Restore exact subtitle

## G2-11-005-112  [P2] GAP  facet F18  effort S
- Legacy: From42 subtitle What 42 tells placement cells. `docs/legacy-source/frontend/src/pages/tpo/announcements.js:92`
- vNext now: vNext shared PageHeader with no source subtitle `src/app/(authenticated)/tpo/announcements/page.tsx:84`
- Fix: Restore tab-specific subtitle
