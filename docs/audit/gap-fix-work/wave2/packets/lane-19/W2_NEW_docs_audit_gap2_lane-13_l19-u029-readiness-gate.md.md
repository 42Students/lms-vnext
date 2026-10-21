# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-13/l19-u029-readiness-gate.md

29 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l19-u029-readiness-gate.md

## G2-19-029-001  [P2] GAP  facet F01 Page placement  effort M
- Legacy: LH:183-200 renders ReadinessGate inside `Launch setup` alongside Web address, Sign-in, Branding cards
- vNext now: NP:70-85 is standalone `/admin/colleges/[collegeId]/readiness`
- Fix: Embed compact ReadinessGate card in vNext Tenant Setup journey, preserving standalone deeper detail only as secondary route

## G2-19-029-002  [P2] GAP  facet F01 URL/context  effort M
- Legacy: LG:149-156 takes `fixedCollegeId` from selectedCollegeId, no route segment
- vNext now: NP:74-85 reads collegeId from URL UUID and permissions
- Fix: Ensure header college switch recomputes displayed checklist or navigates to matching college UUID; reject stale selected cross-tenant IDs

## G2-19-029-003  [P2] MISSING  facet F01 No-college  effort S
- Legacy: LG:200-210 small card `Pick a college first` and exact choose-in-header description
- vNext now: NP:81-85 invalid college UUID notFound, route unavailable absent collegeId
- Fix: Add embedded no-college info card in Tenant Setup when scope unset, not a 404 or empty area

## G2-19-029-004  [P2] GAP  facet F01 Fix in same tab  effort M
- Legacy: LG:74-90 scrollIntoView `tenant-domains-card` / `college-branding-card`
- vNext now: NL:2-16 remediation links navigate to domain setup; no same-tab anchored scroll
- Fix: When embedded, restore direct same-page anchor links; when standalone, target real domain/branding routes with correct scope

## G2-19-029-005  [P2] GAP  facet F01 Academic fix links  effort S
- Legacy: LG:93-99 shows `Departments`, `Faculty`, `Students` buttons on academic-warning row
- vNext now: NL:4-12 chooses a single specific route by ten new check IDs
- Fix: Preserve triple shortcut for EMPTY_COLLEGE_NO_ACADEMIC_DATA if old warning remains; additionally map new checks individually

## G2-19-029-006  [P2] GAP  facet F02 Card shell  effort M
- Legacy: LG:200-209,238-250 small Ant Card titled `Launch checklist`, Recheck icon in header-extra
- vNext now: NP:133-154 PageHeader `College · Readiness Gate` and standalone top Recheck link
- Fix: Provide header/card version with exact title, small size, caption and Recheck top right, honoring old shell widths/padding

## G2-19-029-007  [P2] GAP  facet F02 Intro  effort S
- Legacy: LG:248-250 `Everything that has to be true before this college can be handed over.`
- vNext now: NP:135-153 descriptive runtime limitation and persisted DB copy
- Fix: Use legacy introductory text in compact card, put cautious runtime caveat in visually secondary footnote

## G2-19-029-008  [P2] GAP  facet F02 Hero  effort M
- Legacy: LG:263-282 status icon and 12x14 padded rounded banner colored by READY/WARN/BLOCK
- vNext now: NP:135-142 StatusBadge in PageHeader, then four metric tiles NP:156-178
- Fix: Restore legacy status hero with icon, sentence, explanation and 8px radius; tiles can live on optional details page

## G2-19-029-009  [P2] GAP  facet F02 Group order  effort M
- Legacy: LG:284-313 first `Must fix before launch`, then `Recommended`, with red/gold count tags
- vNext now: NP:180-199 Must fix then disclosure Recommended setup, followed full check list
- Fix: Keep both lists directly visible inside card, recommended visible without disclosure when warning exists

## G2-19-029-010  [P2] GAP  facet F02 Row anatomy  effort M
- Legacy: LG:105-147 li flex gap10 border-top #f0f0f0, icon left, title+why+fix middle, action right
- vNext now: NP:180-192 uses bullet list with plain check label/remediation and a generic link
- Fix: Recreate action row icon/title/consequence/What to do/button alignment; include keyboard-accessible tooltip for unmapped code

## G2-19-029-011  [P2] GAP  facet F02 Footer DNS  effort S
- Legacy: LG:315-320 displays DNS TXT warning only if meta.requireVerifiedDomains true
- vNext now: NP:151-153 general runtime verification warning regardless of verification policy
- Fix: Surface policy-specific `This platform requires web addresses to be DNS-verified...` only when the runtime policy says so

## G2-19-029-012  [P2] GAP  facet F03 Recheck button  effort S
- Legacy: LG:243-245 icon ReloadOutlined `Recheck` visible in card header; LG:167-188 loads
- vNext now: NP:144-150 `Recheck persisted readiness →` link reloads route
- Fix: Match compact Recheck icon label, loading disabled state, and scope-aware refresh without misleading cache

## G2-19-029-013  [P2] GAP  facet F03 Blocker markers  effort S
- Legacy: LG:121-125 red CloseCircleFilled for blockers, amber ExclamationCircleFilled warnings
- vNext now: NP:185-190 plain bullets; NP:260-267 PASS/FAIL/UNKNOWN text badge
- Fix: Add equivalent icon and severity coloring before each fix row (screen-reader label too), separate blockers from warnings

## G2-19-029-014  [P2] GAP  facet F03 Count chips  effort S
- Legacy: LG:284-302 Tag red blocker count, Tag gold recommended count
- vNext now: NP:156-178 StatTile passed/failed/unknown/total, no equivalent section count tags
- Fix: Restore count Tags near both section names and preserve counts when filtered view is active

## G2-19-029-015  [P2] GAP  facet F03 Unknown code tooltip  effort S
- Legacy: LG:108-143 unmapped codes render raw title plus InfoCircle tooltip `This check has no description yet — raise it with the platform team.`
- vNext now: NM:11-21 fixed typed check IDs; NP:241-274 renders defined labels, no unknown-code fallback
- Fix: Preserve fail-safe fallback for future API codes in compatibility adapter; never silently drop an unmapped blocker

## G2-19-029-021  [P2] MISSING  facet F04 Branding warning  effort M
- Legacy: LG:60-65 MISSING_LOGO from LB:216-220 is recommendation, not blocking
- vNext now: NM:11-21 ten checks omit branding completely
- Fix: Restore `No logo` advisory with legacy explanation and `Fix in Branding`, never make logo mandatory for login

## G2-19-029-028  [P2] GAP  facet F06 College selection  effort M
- Legacy: LG:149-156 college via prop fixedCollegeId; LH:170-185 header scope selector, no local edit of college ID
- vNext now: NP:74-85 collegeId route param; selected by visit
- Fix: Ensure explicit active-college label and safely update page when platform selector changes

## G2-19-029-030  [P2] GAP  facet F07 Error fallback  effort S
- Legacy: LG:252-260 `Launch checklist could not be loaded`, raw safe message and Retry button
- vNext now: NERR:14-35 `Could not evaluate college readiness`, Recheck and Colleges fallback
- Fix: Exact legacy title/detail in compact card with Retry action; keep standalone full-page recoverability

## G2-19-029-031  [P2] GAP  facet F07 Scope missing  effort S
- Legacy: LG:200-210 informative `Pick a college first`
- vNext now: NP:81-85 missing/invalid route ID notFound; NP:106-108 notFound on unavailable
- Fix: Embedded card should show info and selected scope, not 404, while invalid explicit URL still 404

## G2-19-029-033  [P2] GAP  facet F08 Copy detail  effort M
- Legacy: LG:136-139 `What to do:` plus individual fix sentence
- vNext now: NP:185-190 short check remediation then `Fix or verify this requirement →`
- Fix: Display both *why it matters* and *What to do* for each blocker/advisory, mapped per legacy CHECK_INFO table

## G2-19-029-038  [P2] MISSING  facet F10 Branding read  effort M
- Legacy: LB:171-178 and 218-220 check branding/logo field or college logo
- vNext now: NS:185-197 facts read roles/departments/programs/domains but not logo; NM lacks it
- Fix: Fetch logo existence for optional warning with college-scoped permission; don't misclassify unavailable branding as pass

## G2-19-029-045  [P2] GAP  facet F13 Loading spinner  effort M
- Legacy: LG:237-247 Card loading={loading}; LG:167-188 Recheck flips loading and prevents obsolete responses
- vNext now: NLOAD:1-15 GracefulPageLoading under standalone PageHeader
- Fix: Use legacy card loading overlay/skeleton in embedded mode and disable Recheck while pending; full-page fallback can remain

## G2-19-029-052  [P2] GAP  facet F16 Responsive  effort M
- Legacy: LG:112-145 flex row icon/text/action can wrap via Space, LH:185-200 card under tab
- vNext now: NP:156-178 tiles 2→4 columns and NP:216-228 filters 4 columns; different density
- Fix: Verify 320/768/1024 widths; legacy fix button stays touch-sized and does not clip or drift off card

## G2-19-029-053  [P2] GAP  facet F17 Status accessibility  effort M
- Legacy: LG:263-282 role=status for hero, warning/blocker icons visual-only, unknown Tooltip via Ant
- vNext now: NP:140 Badge, NP:183 status paragraph, NP:260-265 badges
- Fix: Add role=status for refreshed hero, aria-hidden decorative icons, accessible error + count change announcements

## G2-19-029-054  [P2] GAP  facet F17 Fix navigation  effort M
- Legacy: LG:76-99 scrollIntoView on DOM id or router.push; no explicit focus management after smooth scroll
- vNext now: NL:14-16 uses link href; NP:188-190 native focusable Link
- Fix: If restoring same-page scroll action, move focus to target card heading and honor reduced-motion preference

## G2-19-029-055  [P2] GAP  facet F18 Exact copy  effort M
- Legacy: LG:216-250 legacy success/warning/block header, `Everything that has to be true...`; LG:284-305 section labels
- vNext now: NP:55-65 new `Ready on this checklist`, `Incomplete evidence`, and `Go-live checks`
- Fix: Maintain precise legacy launch-checklist copy for DOMAIN login verdict and separate modern all-criteria readiness terminology

## G2-19-029-056  [P2] GAP  facet F18 Unknown code  effort S
- Legacy: LG:108-143 fallback title=raw code, explanation link to platform team
- vNext now: NM:11-21 fixed 10 check IDs, no unknown runtime code adaptation
- Fix: Log unknown source codes and display actionable generic fallback instead of silently omitting them

## G2-19-029-057  [P2] GAP  facet F19 Query volume  effort L
- Legacy: LB:164-176 domain/branding + LB:224-241 3 academic counts
- vNext now: NS:185-429 queries 11 independent sources in parallel; NP:100-114 pulls all
- Fix: Cache scoped aggregate snapshot briefly with explicit Recheck bypass; bound expensive counts and preserve error/UNKNOWN per source

## G2-19-029-060  [P2] GAP  facet F21 Internal dependencies  effort M
- Legacy: LG:12 TenantAdminService and parent LH:185-200 domain/branding cards
- vNext now: NP:22-23 readiness service and NL:14-16 routes to established settings pages
- Fix: Validate all remediation links resolve to exact selected college and preserve return-to-checklist context
