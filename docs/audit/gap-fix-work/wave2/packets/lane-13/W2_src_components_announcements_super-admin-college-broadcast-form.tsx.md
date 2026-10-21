# Work packet (wave 2): edit src/components/announcements/super-admin-college-broadcast-form.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-10-002-003  [P2] GAP  facet F01  effort S
- Legacy: New announcement top-right primary action opens composer `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:66-69`
- vNext now: Header right action toggles Include deleted; broadcast composer is below filters in Disclosure `src/app/(authenticated)/admin/announcements/page.tsx:128-140` `src/app/(authenticated)/admin/announcements/page.tsx:180-180` `src/components/announcements/super-admin-college-broadcast-form.tsx:57-59`
- Fix: Put New announcement primary button in page head that opens broadcast composer

## G2-10-002-005  [P2] GAP  facet F02  effort M
- Legacy: Composer is detached 600px AsyncModal outside feed `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-109`
- vNext now: Composer appears as collapsible in-page Disclosure within report stream `src/components/announcements/super-admin-college-broadcast-form.tsx:57-109` `src/app/(authenticated)/admin/announcements/page.tsx:180-180`
- Fix: Convert placement-cell composer to old dialog geometry and flow

## G2-10-002-007  [P2] GAP  facet F03  effort S
- Legacy: Main explanation says To placement cells. Each one gets a bell and reads it under Announcements > From 42. `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:68-69`
- vNext now: Broadcast explanation includes active TPO bells scheduled future and no SMS/email `src/components/announcements/super-admin-college-broadcast-form.tsx:57-58`
- Fix: Restore legacy introductory text; put new delivery caveats as supplementary help

## G2-10-002-021  [P2] GAP  facet F06  effort M
- Legacy: Selected colleges are searchable multi-select with Pick colleges placeholder `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:90-95`
- vNext now: Selected colleges are checkbox list in expandable details panel `src/components/announcements/super-admin-college-broadcast-form.tsx:65-72`
- Fix: Restore searchable multi-select and matching placeholder

## G2-10-002-023  [P2] GAP  facet F06  effort S
- Legacy: Body labeled Announcement as textarea six rows maxLength 8000 with count `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:83-85`
- vNext now: Body labeled Message; textarea 8000 shows custom status counter `src/components/announcements/super-admin-college-broadcast-form.tsx:73-76`
- Fix: Restore Announcement label six-row height showCount and old count positioning

## G2-10-002-024  [P2] MISSING  facet F06  effort S
- Legacy: Legacy textarea placeholder Links starting with https:// become clickable. `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:83-85`
- vNext now: No body placeholder in vNext broadcast form `src/components/announcements/super-admin-college-broadcast-form.tsx:75-76`
- Fix: Restore exact explanatory placeholder

## G2-10-002-028  [P2] GAP  facet F06  effort S
- Legacy: Legacy new modal pin checkbox Pin it to the top initially false `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:37-41` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:104-108`
- vNext now: Checkbox Pin for recipients initially false `src/components/announcements/super-admin-college-broadcast-form.tsx:23-24` `src/components/announcements/super-admin-college-broadcast-form.tsx:95-97`
- Fix: Restore legacy pin label

## G2-10-002-039  [P2] GAP  facet F09  effort M
- Legacy: Legacy New and Edit actions open AsyncModal width 600; confirm button Send to every placement cell (N), Send to the picked placement cells, or Save `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-81`
- vNext now: New broadcast opens inline Disclosure and Review dialog Consent and publish `src/components/announcements/super-admin-college-broadcast-form.tsx:57-59` `src/components/announcements/super-admin-college-broadcast-form.tsx:100-107`
- Fix: Restore legacy primary modal labels and geometry; preserve explicit consent if required

## G2-10-002-062  [P2] GAP  facet F16  effort M
- Legacy: Legacy composer modal 600px wide and Antd mobile reflows from modal body `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-109`
- vNext now: New disclosure full width, two-column timing controls from md, 44px mobile targets `src/components/announcements/super-admin-college-broadcast-form.tsx:57-59` `src/components/announcements/super-admin-college-broadcast-form.tsx:91-107`
- Fix: Match modal width and mobile scroll/footer behavior at 375 768 1280

## G2-10-002-067  [P2] GAP  facet F18  effort S
- Legacy: Legacy main action New announcement; modal heading New announcement to placement cells `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:68-68` `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-79`
- vNext now: Disclosure heading New announcement to placement cells; page action Include deleted `src/app/(authenticated)/admin/announcements/page.tsx:128-138` `src/components/announcements/super-admin-college-broadcast-form.tsx:57-57`
- Fix: Restore page head New announcement action and preserve dialog heading

## G2-10-002-068  [P2] GAP  facet F18  effort S
- Legacy: Legacy field is Announcement with helper Links starting with https:// become clickable. `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:83-85`
- vNext now: New field Message and no https helper placeholder `src/components/announcements/super-admin-college-broadcast-form.tsx:73-76`
- Fix: Restore exact field label and helper copy

## G2-10-002-069  [P2] GAP  facet F18  effort S
- Legacy: Legacy button confirmation Send to every placement cell (N) or Send to the picked placement cells `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:78-80`
- vNext now: New Review placement-cell announcement then Consent and publish `src/components/announcements/super-admin-college-broadcast-form.tsx:100-106`
- Fix: Match the audience-aware wording in the final confirmation while retaining explicit consent

## G2-19-024-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy `New announcement` action, inline CTA links, helper text; superadmin/announcements.js:68-69,78-106
- vNext now: Composer `New announcement to placement cells` Disclosure and consent button; super-admin-college-broadcast-form.tsx:57-109
- Fix: Restore old top-level action, button labels, fields, icons and helper text; keep explicit consent as extra review step if required.

## G2-19-024-011  [P2] GAP  facet F05  effort S
- Legacy: Audience radio Every placement cell by default vs Some placement cells searchable Select; superadmin/announcements.js:34-37,87-96
- vNext now: Default SELECTED_COLLEGES, selection expanded details/checkboxes; super-admin-college-broadcast-form.tsx:14-22,59-68
- Fix: Default ALL_COLLEGES and adopt legacy searchable multi-select with matching count and empty state.

## G2-19-024-012  [P2] GAP  facet F06  effort S
- Legacy: Create/edit Title required ≤200, body required ≤8000; frontend rules `Give it a title`, `Write the announcement`; superadmin/announcements.js:82-85; PlacementAnnouncementService.java:605-615
- vNext now: Zod min1/max200, min1/max8000; super-admin-college-broadcast-model.ts:2-13; super-admin-college-broadcast-form.tsx:71-77
- Fix: Keep lengths but emit exact field-level wording and old `Announcement` label.

## G2-10-002-025  [P3] GAP  facet F06  effort S
- Legacy: Optional button label placeholder Read more and URL placeholder https://… `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:99-103`
- vNext now: Button label placeholder View Details; URL placeholder https://example.com `src/components/announcements/super-admin-college-broadcast-form.tsx:77-87`
- Fix: Use old placeholders and compact side-by-side 36 percent label layout

## G2-10-002-065  [P3] GAP  facet F17  effort S
- Legacy: Legacy pinned icon aria-label Pinned; async dialog has close and submitting state `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:64-68` `docs/legacy-source/frontend/src/components/tpo/ui/AsyncModal.jsx:8-18`
- vNext now: New Pinned text and accessible confirm dialog with pending guard `src/components/announcements/announcement-admin-workspace.tsx:295-300` `src/components/announcements/super-admin-college-broadcast-form.tsx:102-107`
- Fix: Restore pinned icon and maintain explicit aria-label
