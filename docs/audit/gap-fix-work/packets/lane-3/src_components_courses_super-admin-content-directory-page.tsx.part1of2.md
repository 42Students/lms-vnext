# Work packet: edit src/components/courses/super-admin-content-directory-page.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-17-003-008  [P1] MISSING  facet F03  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-65 no-college displays warning and optionally Video policy card for type=video.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 no-college renders only EmptyState, policy control absent.
- Fix: Render platform-global watched-threshold policy even when college is unselected on Videos route.

## G2-17-003-012  [P1] GAP  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:224-280 reads by selected course/lesson/class, with class ID 0 generic and class-specific views.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:93-132 uses selected offering, lesson, delivery, audience filters for broad directory.
- Fix: Map legacy course/lesson/class scopes into offering/lesson/delivery query and preselect when entering old link.

## G2-17-003-020  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:52-61 global setting watched threshold default90, min1 max100, suffix%.
- vNext now: src/modules/platform-settings/legacy-setting-specs.ts:97-105 catalogs key as global int1..100; src/components/courses/super-admin-content-directory-page.tsx:62-65 does not render any corresponding input here.
- Fix: Restore policy field at video tab or prominent link directly to editable global settings, even without college selected.

## G2-17-003-029  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:70-74 switches rendered components by query; docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:532-669 then calls createLessonContent/getLessonContents and R2 presign.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:89-91 delegates to server backed authoring; src/modules/courses/lesson-content-service.ts:100-110 normalizes new content input, separate CRUD API.
- Fix: Build old VIDEO upload plus content linking and server-side scoped authoring, retain schema compatibility.

## G2-17-003-032  [P1] GAP  facet F11  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:48-61 platform-wide video policy editable with no college selected, scopeType='GLOBAL'.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 returns early when no college; src/modules/platform-settings/legacy-setting-specs.ts:97-105 records global setting but no rendered control.
- Fix: Offer global policy on no-college screen and restrict edits to privileged Super Admin.

## G2-17-003-054  [P1] MISSING  facet F23  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:48-63 Video policy accessible with no college selected and separate resources/live component by query.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-65 returns early without policy; src/modules/courses/super-admin-content-directory-model.ts:21-34 separates page paths.
- Fix: Restore no-college global policy and add old deep-link alias.

## G2-19-002-004  [P1] MISSING  facet F01  effort M
- Legacy: No scoped college still shows GLOBAL watched threshold Video policy card `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-63`
- vNext now: vNext immediately returns selected-college EmptyState and no global policy editor `src/components/courses/super-admin-content-directory-page.tsx:62-64`
- Fix: Restore Super Admin GLOBAL `course.watchedThresholdPercent` editor in no-college Videos state.

## G2-19-002-012  [P1] MISSING  facet F03  effort M
- Legacy: Legacy export/refresh toolbar embedded in Existing Content Card `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1573-1594`
- vNext now: vNext content directory shows Filter, Clear filters, pagination but no content export/refresh toolbar `src/components/courses/super-admin-content-directory-page.tsx:93-104` `src/components/courses/super-admin-content-directory-page.tsx:130-168`
- Fix: Add CSV export + explicit refresh actions with legacy placement.

## G2-19-002-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy columns Title Type Order Students Content Action `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:967-1082`
- vNext now: vNext articles contain title/status, lesson/course/cohort, order, visible badge, URLs/actions `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Render six named legacy table columns and status/link cells, with responsive fallback.

## G2-19-002-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy Students badge tests content `active!==false && enabled!==false` only `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:978-979`
- vNext now: vNext effective visible checks content PUBLISHED, lesson/path/offering/course states `src/modules/courses/super-admin-content-directory-model.ts:43-50` `src/components/courses/super-admin-content-directory-page.tsx:143-145`
- Fix: Explicitly present `Visible` vs effective visibility, preserve publish-ancestry security, explain divergent badges.

## G2-19-002-017  [P1] GAP  facet F04  effort L
- Legacy: Legacy file preview uses public https link or authenticated `/file/stream` key resolver `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:985-1026`
- vNext now: vNext `safePublicCourseContentUrl` only, never exposes nonpublic object storage in list `src/components/courses/super-admin-content-directory-page.tsx:25-26` `src/components/courses/super-admin-content-directory-page.tsx:148-149`
- Fix: Offer audited private playback/download via signed URLs where authorized; don't expose private storage keys.

## G2-19-002-046  [P1] MISSING  facet F08  effort M
- Legacy: Legacy reorder success `Order updated for this class.` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:949-961`
- vNext now: vNext no section reorder action in this directory `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Implement reorder feedback with view-staleness guard.

## G2-19-002-055  [P1] GAP  facet F10  effort L
- Legacy: Legacy content URL open backed by `getFileUrl` authenticated stream for bare keys `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1008-1026`
- vNext now: vNext list exposes only safe public URL; asset management via separate video service `src/components/courses/super-admin-content-directory-page.tsx:148-149` `src/modules/courses/lesson-video-service.ts:413-436`
- Fix: Add permissioned transient playback URL action for private file-backed content.

## G2-19-002-063  [P1] GAP  facet F13  effort S
- Legacy: Legacy no college shows warning + GLOBAL Video policy exception `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-63`
- vNext now: vNext only EmptyState no global policy `src/components/courses/super-admin-content-directory-page.tsx:62-64`
- Fix: Match no-college policy exception while forbidding college content access.

## G2-19-002-068  [P1] MISSING  facet F14  effort M
- Legacy: Legacy content export file `lesson-content.csv` with 9 named fields including points/deadline/active/enabled `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1575-1592`
- vNext now: vNext content directory lacks CSV export `src/components/courses/super-admin-content-directory-page.tsx:93-168`
- Fix: Add CSV endpoint/toolbar with exactly legacy field names and filtered lesson/class scope.

## G2-19-002-080  [P1] MISSING  facet F18  effort S
- Legacy: Legacy `The video "watched" threshold is platform-wide` with instruction to clear college `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1132-1142`
- vNext now: vNext no policy banner even when Videos selected `src/components/courses/super-admin-content-directory-page.tsx:85-93`
- Fix: Restore exact policy warning and unscoped editing link.

## G2-19-002-086  [P1] MISSING  facet F20  effort M
- Legacy: Legacy late class reorder response ignored if view changed `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:949-959`
- vNext now: vNext no reorder implemented; action confirm snapshot absent on that surface `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Add selected lesson/delivery version/snapshot to ignore stale reorder confirmations.

## G2-19-002-091  [P1] GAP  facet F21  effort L
- Legacy: Legacy class ordering uses dnd-kit and backend ClassContentOrderRequest `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:8-24` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:617-632`
- vNext now: vNext admin list not linked to lesson-content-order service `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Attach audited order service to selected-section full content view.

## G2-19-002-100  [P1] MISSING  facet F23  effort M
- Legacy: Legacy Videos unscoped global threshold card only when college not selected `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-63`
- vNext now: vNext no policy editor here `src/components/courses/super-admin-content-directory-page.tsx:62-64`
- Fix: Return global policy editor under clear-college state, preserving unscoped write guards.

## G2-9-025-015  [P1] GAP  facet F04  effort M
- Legacy: Materials column equals mixed FILE/LINK count from contentDataDTO `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:313-313`
- vNext now: Linked materials count is 1 if public external URL else 0; ignores private files/multiple links `src/components/courses/super-admin-content-directory-page.tsx:143-147`
- Fix: Query and display all authorized material entries, not URL boolean.
