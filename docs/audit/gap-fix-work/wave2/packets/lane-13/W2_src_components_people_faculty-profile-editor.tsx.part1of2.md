# Work packet (wave 2): edit src/components/people/faculty-profile-editor.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/faculty-profile-controller.md, docs/audit/gap2/lane-20/teacher-profile.md

## G2-1-003-006  [P2] GAP  facet F02  effort S
- Legacy: `ProfileSectionsPanel.js:63-69` Education before Certifications, Experiences, Skills, Publications, Awards, Metadata.
- vNext now: `faculty-profile-editor.tsx:107-134` shows Skills/Metadata first, then Awards/Publications/Experiences/Certifications/Education/Languages.
- Fix: Reorder sections without undoing improved editorial polish structure.

## G2-1-003-010  [P2] GAP  facet F03  effort M
- Legacy: `ProfileSectionsPanel.js:309,468` has manual reload buttons per section.
- vNext now: `faculty-profile-editor.tsx:74-83` offers page reload only after conflict; section components have discard and save.
- Fix: Expose refresh latest section with unsaved-change confirmation to match functionality.

## G2-1-003-012  [P2] GAP  facet F04  effort S
- Legacy: `PersonalDetailsDTO.java:10-12` wire `gender`, `dob`, `bloodGroup`.
- vNext now: `faculty-profile-document.ts:123-134` uses `gender`, `dateOfBirth`, `bloodGroup`, editor `faculty-profile-editor.tsx:25`.
- Fix: Map old dob to dateOfBirth and preserve imported values without silent loss.

## G2-1-003-016  [P2] GAP  facet F04  effort S
- Legacy: `AddressDTO.java:10-20` has current/permanent addresses plus legacy city/state/pincode shared trio.
- vNext now: `faculty-profile-document.ts:75-102` retains all 11 keys; editor `faculty-profile-editor.tsx:26,99-102` only renders eight and not legacy trio.
- Fix: Show legacy city/state/pincode values when populated and provide managed migration.

## G2-1-003-017  [P2] GAP  facet F04  effort M
- Legacy: `EducationDTO.java:17-50` contains examDetails map and isRecentEducation, qualifyingExam/rank and certificateUpload.
- vNext now: `faculty-profile-document.ts:152-194` schema supports examDetails/isRecentEducation/qualifyingExam/rank and receipt ID; editor `faculty-profile-editor.tsx:29` omits examDetails form.
- Fix: Provide structured exam-details editing/viewing and receipt download; never store raw URL.

## G2-1-003-018  [P2] GAP  facet F04  effort L
- Legacy: `CertificationDTO.java:11-26`, `ExperienceDTO.java:12-31` carry certificateUpload, internshipCertificateUpload and offerLetterUpload strings.
- vNext now: `faculty-profile-document.ts:195-237` replaces with receipt UUIDs; `faculty-profile-editor.tsx:30-31` excludes managed document fields.
- Fix: Add secure read-only attachment indicators and authorized replacement/receipt workflow.

## G2-1-003-031  [P2] GAP  facet F06  effort M
- Legacy: `ProfileSectionsPanel.js:243-271` saves single object directly; `:353-369,391-408` add/update lists via row endpoints.
- vNext now: `faculty-profile-editor.tsx:47-71` sends `{section,value,expectedVersion}` for full section, can hold local unsaved edits.
- Fix: Preserve explicit Submit/Cancel distinction with per-section save/pending indicators; note new version field.

## G2-1-003-042  [P2] GAP  facet F09  effort M
- Legacy: `ProfileSectionsPanel.js:489-507` shows all sections as collapsible panels through AntD Collapse.
- vNext now: `faculty-profile-editor.tsx:86-135` uses navigation anchors and section cards without legacy collapse wrapper; repeatable rows collapsible.
- Fix: Match legacy section-level collapse/expand defaults and keyboard semantics.

## G2-1-003-055  [P2] GAP  facet F13  effort M
- Legacy: `ProfileSectionsPanel.js:205-230,278-309` per-section Spin, server error, reload, empty view; list `:318-347,414-468` similar.
- vNext now: `teacher/profile/details/page.tsx:21-24` whole-page blocking migration warning; `faculty-profile-editor.tsx:78-85` error, pending and success inline.
- Fix: Add per-section loading/error/retry and accessible empty state matching old while keeping database-blocker honest.

## G2-1-003-063  [P2] GAP  facet F16  effort M
- Legacy: `ProfileSectionsPanel.js:130-162,205-317` AntD responsive form/description grids and compact inline buttons.
- vNext now: `faculty-profile-repeatable.tsx:63-157` mobile stacked min-h-11 controls, wider desktop; `faculty-profile-editor.tsx:86-91` horizontally scrollable nav.
- Fix: Live compare desktop/tablet/375px cards and form label stacks; preserve accessible hit targets.

## G2-1-003-066  [P2] GAP  facet F18  effort S
- Legacy: `ProfileSectionsPanel.js:54-69` section labels 'Personal Details', 'Identity Documents', 'Social Profiles', 'Work Experience', 'Publications & Research', 'Awards & Recognitions'.
- vNext now: `faculty-profile-editor.tsx:95-134` labels 'Personal details', 'Social profiles', 'Experience', 'Publications', 'Awards', identity absent.
- Fix: Restore literal legacy section titles with consistent case, preserving layout hierarchy.

## G2-1-003-068  [P2] GAP  facet F18  effort M
- Legacy: `profileSectionSchemas.js:41-44` uses 'Mobile Number', 'Alternate Phone', 'Email'.
- vNext now: `faculty-profile-editor.tsx:24-33` has no contact section, `teacher/profile/page.tsx:13-14` displays Email/Mobile read-only.
- Fix: Add contact section and match labels for authorized editor, without exposing private identity unnecessarily.

## G2-20-030-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy Personal Details card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:938-958`)
- vNext now: New personalDetails section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:95-98`)
- Fix: Restore Personal Details section position and legacy card presentation

## G2-20-030-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy Experience card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:959-990`)
- vNext now: New experiences section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:117-120`)
- Fix: Restore Experience section position and legacy card presentation

## G2-20-030-010  [P2] GAP  facet F02  effort M
- Legacy: Legacy Education/Qualification card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:991-1022`)
- vNext now: New education section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:125-129`)
- Fix: Restore Education/Qualification section position and legacy card presentation

## G2-20-030-011  [P2] GAP  facet F02  effort M
- Legacy: Legacy Certifications card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1055-1086`)
- vNext now: New certifications section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:121-124`)
- Fix: Restore Certifications section position and legacy card presentation

## G2-20-030-012  [P2] GAP  facet F02  effort M
- Legacy: Legacy Skills card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1119-1141`)
- vNext now: New skills section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:107-108`)
- Fix: Restore Skills section position and legacy card presentation

## G2-20-030-013  [P2] GAP  facet F02  effort M
- Legacy: Legacy Languages card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1142-1173`)
- vNext now: New languages section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:130-134`)
- Fix: Restore Languages section position and legacy card presentation

## G2-20-030-014  [P2] GAP  facet F02  effort M
- Legacy: Legacy Publications & Research card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1229-1260`)
- vNext now: New publications section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:113-116`)
- Fix: Restore Publications & Research section position and legacy card presentation

## G2-20-030-015  [P2] GAP  facet F02  effort M
- Legacy: Legacy Awards & Recognitions card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1261-1292`)
- vNext now: New awards section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:109-112`)
- Fix: Restore Awards & Recognitions section position and legacy card presentation

## G2-20-030-016  [P2] GAP  facet F02  effort M
- Legacy: Legacy Social Profiles card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1293-1313`)
- vNext now: New socialProfiles section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:103-106`)
- Fix: Restore Social Profiles section position and legacy card presentation

## G2-20-030-018  [P2] GAP  facet F02  effort M
- Legacy: Legacy Address card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1341-1361`)
- vNext now: New address section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:99-102`)
- Fix: Restore Address section position and legacy card presentation

## G2-20-030-020  [P2] GAP  facet F02  effort M
- Legacy: Legacy Additional Information card appears at the prescribed grid position (`docs/legacy-source/frontend/src/components/profile/about.js:1387-1408`)
- vNext now: New metadata section moved into different flat stack order (`src/components/people/faculty-profile-editor.tsx:107-109`)
- Fix: Restore Additional Information section position and legacy card presentation

## G2-20-030-023  [P2] MISSING  facet F03  effort M
- Legacy: ProfileCompleteness progress component visible directly after UserInfo (`docs/legacy-source/frontend/src/components/profile/about.js:928-934`)
- vNext now: No completeness score or bar on summary or details (`src/app/(authenticated)/teacher/profile/page.tsx:19-49`, `src/components/people/faculty-profile-editor.tsx:73-135`)
- Fix: Port completion score and CTA consistent with legacy

## G2-20-030-024  [P2] GAP  facet F03  effort M
- Legacy: Every editable card has Edit pencil and repeatables have Add plus at header (`docs/legacy-source/frontend/src/components/profile/about.js:938-973`, `docs/legacy-source/frontend/src/components/profile/about.js:994-1005`, `docs/legacy-source/frontend/src/components/profile/about.js:1143-1155`)
- vNext now: Section forms have persistent fields with Save/Discard; no card-header Edit/Add controls (`src/components/people/faculty-profile-editor.tsx:92-135`, `src/components/people/faculty-profile-text-section.tsx:39-69`)
- Fix: Reuse legacy header actions and collapsed read-only presentation until Edit/Add

## G2-20-030-025  [P2] GAP  facet F03  effort M
- Legacy: Legacy partial-load Alert includes showIcon and Retry sections (`docs/legacy-source/frontend/src/components/profile/about.js:903-914`)
- vNext now: Editor uses generic error Alert + reload profile only on version/other failures (`src/components/people/faculty-profile-editor.tsx:74-85`)
- Fix: Expose per-section read failures and retry failed sections without wiping good data

## G2-20-030-027  [P2] GAP  facet F04  effort S
- Legacy: Legacy empty profile fields show 'Not specified' and DOB DD-MM-YYYY (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:73-110`, `docs/legacy-source/frontend/src/components/profile/userInfo.js:17-26`)
- vNext now: New summary empty shows 'Not provided'; editor date ISO YYYY-MM-DD (`src/app/(authenticated)/teacher/profile/page.tsx:35-42`, `src/components/people/faculty-profile-editor.tsx:25-26`)
- Fix: Restore field-level legacy placeholders and formatted DOB display

## G2-20-030-030  [P2] GAP  facet F05  effort M
- Legacy: Legacy view uses card grid not a table; section repeatables have list-specific Add/Edit/Delete actions (`docs/legacy-source/frontend/src/components/profile/about.js:938-1086`, `docs/legacy-source/frontend/src/components/profile/about.js:1119-1292`)
- vNext now: New repeatables are editor sections with individual maxItems controls; no table in overview (`src/components/people/faculty-profile-editor.tsx:109-134`, `src/app/(authenticated)/teacher/profile/page.tsx:19-50`)
- Fix: Match list item order, item display and action modes in legacy repeatables

## G2-20-030-031  [P2] GAP  facet F05  effort M
- Legacy: Legacy faculty repeatable items are in endpoint-provided order; update/delete index-based (`docs/legacy-source/frontend/src/api/Services/ProfileService.js:267-305`, `docs/legacy-source/frontend/src/components/profile/about.js:295-347`)
- vNext now: New repeatables persist UUID receipts and document arrays (`src/components/people/faculty-profile-editor.tsx:109-134`, `src/modules/people/faculty-profile-document.ts:124-149`)
- Fix: Retain visible item sequence and correct per-row update/delete targeting

## G2-20-030-032  [P2] GAP  facet F06  effort M
- Legacy: Legacy personal Gender is searchable/select choices; DOB AntD DatePicker DD-MM-YYYY; Blood Group select enumerated (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:10-14`, `docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:98-120`)
- vNext now: New three native text/date fields: gender Input, date native date, bloodGroup Input (`src/components/people/faculty-profile-editor.tsx:24-25`, `src/components/people/faculty-profile-text-section.tsx:45-59`)
- Fix: Restore Gender/Blood Group enumerations and DOB picker/format

## G2-20-030-034  [P2] GAP  facet F06  effort M
- Legacy: Legacy section cards start in read mode and enter editing on per-card Edit/Add (`docs/legacy-source/frontend/src/components/profile/about.js:81-99`, `docs/legacy-source/frontend/src/components/profile/about.js:938-973`)
- vNext now: Details page editor fields always visible if profile storage ready (`src/app/(authenticated)/teacher/profile/details/page.tsx:21-25`, `src/components/people/faculty-profile-editor.tsx:92-135`)
- Fix: Default to read mode and enter editable mode via action

## G2-20-030-035  [P2] GAP  facet F06  effort M
- Legacy: Legacy repeatable sections allow immediate item Add/Edit/Delete through dedicated service calls (`docs/legacy-source/frontend/src/components/profile/about.js:295-348`, `docs/legacy-source/frontend/src/components/profile/about.js:421-499`)
- vNext now: New draft mutation persists whole section on Save; deletions staged (`src/components/people/faculty-profile-editor.tsx:109-134`, `src/modules/people/faculty-self-section-model.ts:37-80`)
- Fix: Clarify save timing and align item-level action affordances

## G2-20-030-050  [P2] GAP  facet F09  effort L
- Legacy: Legacy per-card edit/add dialogs and item-specific confirmations (`docs/legacy-source/frontend/src/components/profile/about.js:938-1018`, `docs/legacy-source/frontend/src/components/profile/about.js:1140-1292`)
- vNext now: New repeatable editor sections with inline changes and global reload confirm (`src/components/people/faculty-profile-editor.tsx:73-135`)
- Fix: List and restore each existing card action/modal behavior

## G2-20-030-052  [P2] GAP  facet F10  effort L
- Legacy: Legacy indexed POST/PUT/DELETE for awards, experiences, qualifications, languages etc (`docs/legacy-source/frontend/src/api/Services/ProfileService.js:267-305`, `docs/legacy-source/frontend/src/components/profile/about.js:295-349`, `docs/legacy-source/frontend/src/components/profile/about.js:774-817`)
- vNext now: New section PATCH /api/people/faculty-self-document with expectedVersion (`src/app/api/people/faculty-self-document/route.ts:16-27`, `src/components/people/faculty-profile-editor.tsx:47-63`)
- Fix: Preserve item CRUD outcome and source-specific authorization in single-section patch

## G2-20-030-069  [P2] GAP  facet F16  effort M
- Legacy: Legacy AntD profile cards xs24, xl12 with 20px gutters; top info full width (`docs/legacy-source/frontend/src/components/profile/about.js:915-940`, `docs/legacy-source/frontend/src/components/profile/about.js:959-962`)
- vNext now: vNext stacked editor sections with sm2 field grid and slim overview definition list (`src/components/people/faculty-profile-editor.tsx:92-135`, `src/app/(authenticated)/teacher/profile/page.tsx:32-45`)
- Fix: Match old two-column cards at xl, phone stacking and spacings

## G2-20-030-074  [P2] GAP  facet F18  effort S
- Legacy: Legacy 'Contacts', 'Identity Documents', 'Additional Information' (`docs/legacy-source/frontend/src/components/profile/about.js:1320-1323`, `docs/legacy-source/frontend/src/components/profile/about.js:1366-1369`, `docs/legacy-source/frontend/src/components/profile/about.js:1392-1395`)
- vNext now: vNext 'Contact details' separate, identity absent, 'metadata' generic editor (`src/app/(authenticated)/teacher/profile/contacts/page.tsx:8-10`, `src/components/people/faculty-profile-editor.tsx:107-109`)
- Fix: Restore legacy headings and original position

## G2-1-003-067  [P3] GAP  facet F18  effort S
- Legacy: `profileSectionSchemas.js:26-29` uses 'Date of Birth (YYYY-MM-DD)' and 'Blood Group'.
- vNext now: `faculty-profile-editor.tsx:25` uses 'Date of birth', 'Blood group' and HTML date control.
- Fix: Preserve legacy hints/capitalization as visible helper text; keep native date input.

## G2-20-030-068  [P3] GAP  facet F15  effort S
- Legacy: Legacy profile updates trigger local profileUpdated CustomEvent but no external email from page (`docs/legacy-source/frontend/src/components/profile/about.js:267-271`, `docs/legacy-source/frontend/src/components/profile/about.js:295-319`)
- vNext now: vNext success state updated and receipt version increment, no email in route (`src/components/people/faculty-profile-editor.tsx:60-67`, `src/app/api/people/faculty-self-document/route.ts:16-27`)
- Fix: Preserve in-app profile completeness refresh event equivalent; no email parity identified

## G2-20-030-073  [P3] GAP  facet F18  effort S
- Legacy: Legacy title 'Profile', section heading 'Education/Qualification' (`docs/legacy-source/frontend/src/pages/teacher/profile.js:121-125`, `docs/legacy-source/frontend/src/components/profile/about.js:994-997`)
- vNext now: vNext title 'Profile', editor section label 'Education' (`src/app/(authenticated)/teacher/profile/page.tsx:20-22`, `src/components/people/faculty-profile-editor.tsx:125-129`)
- Fix: Restore exact section heading and labels for cloned interface

## G2-20-030-076  [P3] GAP  facet F18  effort S
- Legacy: Legacy profile form placeholders 'Select Gender', 'Select date of birth', 'Not specified' (`docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:73-120`)
- vNext now: vNext personal fields use labeled generic inputs, fallback 'Not provided' (`src/components/people/faculty-profile-editor.tsx:24-25`, `src/app/(authenticated)/teacher/profile/page.tsx:35-42`)
- Fix: Restore placeholders and empty-value copy
