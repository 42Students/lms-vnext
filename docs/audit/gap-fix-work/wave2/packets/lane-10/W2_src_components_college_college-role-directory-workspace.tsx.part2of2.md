# Work packet (wave 2): edit src/components/college/college-role-directory-workspace.tsx (part 2 of 2)

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md

## G2-6-001-006  [P2] GAP  facet F03  effort S
- Legacy: Old primary action `Register faculty` with plus icon `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:950-957`
- vNext now: New action `Register New Faculty` without plus icon `src/components/college/college-role-directory-workspace.tsx:91-93` `src/components/admin/person-onboard-dialog.tsx:118-127`
- Fix: Match exact action caption, plus glyph, and placement

## G2-6-001-007  [P2] GAP  facet F03  effort S
- Legacy: Old overview description directs teaching allocation to Faculty Assignment `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:940-949`
- vNext now: New description omits Faculty Assignment and focuses on teaching information `src/components/college/college-role-directory-workspace.tsx:84-90`
- Fix: Restore original description and add explicit Faculty Assignment navigation hint

## G2-6-001-008  [P2] GAP  facet F03  effort S
- Legacy: Old roster Refresh button alongside Export CSV `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1275-1309`
- vNext now: New workspace has import/export links but no dedicated Refresh control `src/components/college/college-role-directory-workspace.tsx:119-132` `src/components/college/college-role-directory-workspace.tsx:352-364`
- Fix: Add accessible Refresh action preserving filters

## G2-6-001-009  [P2] GAP  facet F03  effort S
- Legacy: Old overview has fourth statistic `Visible now` reflecting filtered roster `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:942-949`
- vNext now: New renders `Visible now: Not tracked`, a different concept `src/components/college/college-role-directory-workspace.tsx:133-140`
- Fix: Show filtered-row count, not online presence, using result totals

## G2-6-001-010  [P2] GAP  facet F04  effort M
- Legacy: Old roster separate Name and Department cells `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-785`
- vNext now: New Person cell embeds name/email; Teaching assignments is context column `src/components/college/college-role-directory-workspace.tsx:408-435`
- Fix: Recreate distinct name and department columns, preserving responsive card variant

## G2-6-001-011  [P2] GAP  facet F04  effort M
- Legacy: Old Mobile field directly displayed as contactMobile `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:780-790`
- vNext now: New directory routes user to a contact card instead `src/components/college/college-role-directory-workspace.tsx:409-418`
- Fix: Add mobile display only with need-to-know masking policy and permission check

## G2-6-001-012  [P2] GAP  facet F04  effort M
- Legacy: Old Type tag maps enum to human labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:22-28` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:783-792`
- vNext now: New employment context sits in directory filters; no Type tag in rows `src/components/college/college-role-directory-workspace.tsx:408-452`
- Fix: Render faculty-type badge with legacy title case from employmentType

## G2-6-001-013  [P2] GAP  facet F04  effort S
- Legacy: Old Gender is visible in roster `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:786-797`
- vNext now: New row columns omit gender `src/components/college/college-role-directory-workspace.tsx:408-453`
- Fix: Restore Gender column where permitted or document deliberate privacy exception

## G2-6-001-015  [P2] GAP  facet F04  effort S
- Legacy: Old missing Name/Department/Type use dash `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-797`
- vNext now: New missing email explicitly says `No email recorded` on mobile `src/components/college/college-role-directory-workspace.tsx:369-372`
- Fix: Standardize all legacy empty placeholders by field and viewport

## G2-6-001-016  [P2] GAP  facet F05  effort M
- Legacy: Old Ant Table has Name sort comparator and 25 default rows with 25,50,100,200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-774` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New DataTable uses URL-backed default name order and 10,25,50 sizes `src/components/college/college-role-directory-workspace.tsx:403-454` `src/components/college/college-role-directory-workspace.tsx:335-340` `src/modules/people/college-role-directory-model.ts:5-39`
- Fix: Offer 100/200 sizes or document server limit; preserve Name default ascending

## G2-6-001-017  [P2] GAP  facet F05  effort S
- Legacy: Old inline filters Department, Type, Status `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1343-1359`
- vNext now: New filters Department, Employment Type, Membership Status plus Advanced filter fold `src/components/college/college-role-directory-workspace.tsx:154-165` `src/components/college/college-role-directory-workspace.tsx:202-228`
- Fix: Match labels and inline initial filter positions while retaining advanced extras

## G2-6-001-019  [P2] GAP  facet F05  effort M
- Legacy: Old autocomplete selection narrows rows to one selected faculty and Clear Search resets `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:291-330`
- vNext now: New search submits URL text filter across roster `src/components/college/college-role-directory-workspace.tsx:142-152` `src/modules/people/college-role-directory-service.ts:262-280`
- Fix: Support scoped selected-member search behavior and clear affordance

## G2-6-001-020  [P2] GAP  facet F05  effort M
- Legacy: Old table actions are 8 distinct icon buttons in right-pinned action column `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:803-936`
- vNext now: New responsive row More actions contains edit/audit/profile/lifecycle; no pinned actions `src/components/college/college-role-directory-workspace.tsx:389-399` `src/components/college/college-role-directory-workspace.tsx:440-450`
- Fix: Restore individually discoverable actions, right pin on tablet, tooltips and accessible names

## G2-6-001-050  [P2] GAP  facet F13  effort M
- Legacy: Old load failure banner `Could not load faculty` + Retry `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1317-1320`
- vNext now: New directory service call not locally caught in workspace `src/components/college/college-role-directory-workspace.tsx:79-82`
- Fix: Provide dedicated retryable roster error state

## G2-6-001-051  [P2] GAP  facet F13  effort S
- Legacy: Old no-data text `No faculty found. Register faculty members to get started.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1371`
- vNext now: New `No role memberships are recorded in this college.` `src/components/college/college-role-directory-workspace.tsx:356-363`
- Fix: Restore exact empty copy and registration CTA

## G2-6-001-055  [P2] GAP  facet F14  effort M
- Legacy: Old export `faculty.csv` 6 columns including Mobile, Gender `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1283-1305`
- vNext now: New visible/export CSV endpoints with 1,000 cap `src/components/college/college-role-directory-workspace.tsx:121-130` `src/components/college/college-role-directory-workspace.tsx:483-486`
- Fix: Align export column order, filename and visible-filter semantics

## G2-6-001-060  [P2] GAP  facet F17  effort S
- Legacy: Old each action button has descriptive aria-label based on faculty name `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:803-935`
- vNext now: New more-actions content is named mostly by component props; details expander labels generic `More actions` `src/components/college/college-role-directory-workspace.tsx:389-395`
- Fix: Add per-row accessible names and distinct context for repeated action groups

## G2-6-001-061  [P2] GAP  facet F17  effort M
- Legacy: Old autocomplete uses Ant AutoComplete focus and dropdown options `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1322-1341`
- vNext now: New text search uses native search input, form submission `src/components/college/college-role-directory-workspace.tsx:142-153`
- Fix: Restore accessible combobox semantics, keyboard option selection and focus management

## G2-6-001-062  [P2] GAP  facet F18  effort S
- Legacy: Old visible form heading `Register New Faculty` and list `Registered Faculty` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:978-981` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1275-1278`
- vNext now: New button/dialog `Register New Faculty`, list header `Faculty` `src/components/admin/person-onboard-dialog.tsx:118-127` `src/components/college/college-role-directory-workspace.tsx:84-99`
- Fix: Keep registered-faculty section heading and registration button's older caption

## G2-6-001-063  [P2] GAP  facet F18  effort S
- Legacy: Old filter placeholder `All types`, `Any status` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1343-1352`
- vNext now: New `All employment types` and `All statuses` `src/components/college/college-role-directory-workspace.tsx:154-165` `src/components/college/college-role-directory-workspace.tsx:215-222`
- Fix: Restore exact legacy placeholder labels

## G2-6-001-066  [P2] MISSING  facet F19  effort M
- Legacy: Old suggestion limit 15 and popular 10 `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:153-159` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:239-242`
- vNext now: New roster search has no equivalent suggestion requests `src/components/college/college-role-directory-workspace.tsx:142-152`
- Fix: Restore bounded 15-result suggestion endpoint or document performance-driven alternative
