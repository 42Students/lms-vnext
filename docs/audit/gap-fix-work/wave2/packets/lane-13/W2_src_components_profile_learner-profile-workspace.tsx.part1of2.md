# Work packet (wave 2): edit src/components/profile/learner-profile-workspace.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-1/learner-profile.md, docs/audit/gap2/lane-3/qualification.md

## G2-1-011-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1200`: learner GET and PUT /{learnerId}/job-preferences exchange JobPreferencesDTO.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:661-670`,`src/components/profile/learner-profile-workspace.tsx:921-959`: profile Job Preferences read card and Edit dialog, saved as profile document.
- Fix: Document migrated REST shape and embedded-document update contract.

## G2-1-011-002  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:85-92`: legacy six jobPreferences fields in ordered config.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:661-671`: four visible Value rows, 2-column grid.
- Fix: Restore missing two preferences in read card with legacy ordering.

## G2-1-011-003  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:86`: `Role Preference` singular.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:931-937`: `Role Preference (multiple)` plus comma list.
- Fix: Keep legacy label where exact UI parity matters and explain multi-role enhancement.

## G2-1-011-004  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:90`: `Exam Slot Preference` field.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:661-671`,`src/components/profile/learner-profile-workspace.tsx:930-958`: no exam slot view/edit control.
- Fix: Add Morning/Afternoon/Evening field, persisted in profile document.

## G2-1-011-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1190-1197`: PUT partial JobPreferencesDTO via @Valid, nullable properties.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:926-956`: Save replaces profile document jobPreferences snapshot.
- Fix: Preserve patch semantics for omitted preferences in old clients.

## G2-1-011-023  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:944-975`: service creates row when absent, saves six nullable fields, re-reads.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:926-929`: saves whole JSON profile document.
- Fix: Ensure atomic profile save and partial update compatibility across tabs.

## G2-1-011-026  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:28-29`: examples Day Shift, Night Shift, Flexible, Remote.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:945-950`: Day/Night/Rotational/Flexible; no Remote option.
- Fix: Map Remote either to location choice or work-shift display preserving meaning.

## G2-1-011-027  [P2] MISSING  facet F12  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:14`: exam slot has Morning/Afternoon/Evening examples.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:930-958`: no exam slot field.
- Fix: Add three selectable slots with an unspecified option.

## G2-1-011-028  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:925-939`: no DB row returns nullable fields and jobNotificationsEnabled=true.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:661-671`: empty values rendered via Value, missing flag entirely.
- Fix: Show Not specified for missing prefs and `On` for default notifications.

## G2-1-011-034  [P2] MISSING  facet F17  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:15`: jobNotificationsEnabled is Boolean, should be binary.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:930-958`: no checkbox/toggle accessible name.
- Fix: Add switch with description and keyboard interaction.

## G2-1-011-035  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/profileSectionSchemas.js:86-91`: exact Role Preference / Specific Role Preference / Work Shift Preference / Preferred Employment City / Exam Slot Preference / Job Notifications Enabled.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:667-670`,`src/components/profile/learner-profile-workspace.tsx:931-955`: only four labels, Role Preference (multiple).
- Fix: Restore literal labels and case, preserving helpful multiple roles hint.

## G2-11-031-028  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:40-48: cancel prompts unsaved changes via Modal.
- vNext now: src/components/profile/learner-profile-workspace.tsx:775-1030: Dialog/Confirm for edit flows.
- Fix: Compare modal button/title and dirty state.

## G2-11-031-046  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:138: 'Primary Mobile Number (10 digits)' placeholder.
- vNext now: src/components/profile/learner-profile-workspace.tsx:785-810: alternate only.
- Fix: Maintain primary mobile hint on verified edit route.

## G2-1-004-005  [P2] GAP  facet F02  effort M
- Legacy: `ProfileSectionsPanel.js:481-507` renders collapsible cards from legacy section list.
- vNext now: `src/components/profile/learner-profile-workspace.tsx:129-137` builds flat profile cards and dialog editing.
- Fix: Reproduce section disclosure and hierarchy while keeping safety-related improvements.

## G2-1-004-007  [P2] GAP  facet F03  effort M
- Legacy: `ProfileSectionsPanel.js:293-310,432-468` actions Edit/Save/Cancel/Reload and Add/Remove with red confirmation.
- vNext now: `learner-profile-workspace.tsx:285-397` uses modals, guarded saves, per-collection editing and toast.
- Fix: Restore action affordance labels, icon/hit-area and cancellation behavior.

## G2-1-004-013  [P2] GAP  facet F04  effort M
- Legacy: `ContactDTO.java:20-27` primary/alternate mobile plus contact email.
- vNext now: `learner-contact-model.ts:4-16` edits alternatePhone/contactEmail; primary stays canonical identity, `learner-profile-workspace.tsx:351-390`.
- Fix: Preserve primary-vs-alternate mapping and displayed value ownership.

## G2-1-004-014  [P2] GAP  facet F04  effort L
- Legacy: `EducationDTO.java:17-50` institutionName, grade, maxGrade, examDetails and certificateUpload.
- vNext now: `learner-profile-workspace.tsx:73-84` uses institution, gradeObtained, maxGrade and no certificate field.
- Fix: Map all education fields and private certificate receipts; preserve exam metadata.

## G2-1-004-015  [P2] GAP  facet F04  effort M
- Legacy: `CertificationDTO.java:11-26` authority/certificationDate/validityDate/certificateLink and upload.
- vNext now: `learner-profile-workspace.tsx:95-102` uses issuingAuthority/issueDate/expiryDate/credentialUrl; upload absent.
- Fix: Add legacy property mapping and private receipt UI.

## G2-1-004-016  [P2] GAP  facet F04  effort M
- Legacy: `ExperienceDTO.java:12-31` from/to, salary, certificates plus organization/designation.
- vNext now: `learner-profile-workspace.tsx:61-71` uses startDate/endDate/compensation and omits certificates.
- Fix: Map date/salary and private proof references.

## G2-1-004-017  [P2] GAP  facet F04  effort M
- Legacy: `LearnerProfileController.java:904-957` project profile CRUD using `ProjectDTO` fields.
- vNext now: `learner-profile-workspace.tsx:89-94` uses skills, githubUrl/projectUrl without legacy project date fields.
- Fix: Map skillsUsed/liveUrl and retain dates or record explicit deprecation.

## G2-1-004-019  [P2] GAP  facet F04  effort M
- Legacy: `LearnerProfileController.java:1148-1175` metadata free-form `Map<String,Object>`.
- vNext now: `learner-profile-workspace.tsx:118-121` typed metadata key/type/value rows.
- Fix: Preserve scalar types and key/order mapping in conversion.

## G2-1-004-022  [P2] GAP  facet F05  effort M
- Legacy: `LearnerProfileServiceImpl.java:469-505` education college search and grade values via backend.
- vNext now: `learner-profile-workspace.tsx:73-84` free text institution and a local select.
- Fix: Back institution picker with scoped, searchable catalogue.

## G2-1-004-034  [P2] GAP  facet F09  effort M
- Legacy: `ProfileSectionsPanel.js:205-317,318-468` edits inline and confirms deletion with Popconfirm.
- vNext now: `learner-profile-workspace.tsx:194-211,285-397` modal drafts, guarded actions, confirm flow.
- Fix: Match legacy modal/edit hierarchy and focus rules without removing safer confirmation.

## G2-1-004-043  [P2] GAP  facet F12  effort S
- Legacy: `LearnerProfileServiceImpl.java:492-495` grading choices `CGPA`, `Percentage`, `Grade`, `GPA`.
- vNext now: `learner-profile-workspace.tsx:79` omits `GPA`.
- Fix: Add GPA option without overwriting existing GPA entries.

## G2-1-004-045  [P2] GAP  facet F13  effort M
- Legacy: `LearnerProfileController.java:295-324` 400/404/409 with wrapped error; `ProfileSectionsPanel.js:205-230` loading and retry.
- vNext now: `learner-profile-workspace.tsx:299-301` toast + local draft, academic fallback `learn/profile/page.tsx:87`.
- Fix: Add distinct 404,401,409,503 and offline state with actionable retry.

## G2-1-004-048  [P2] GAP  facet F14  effort L
- Legacy: `EducationDTO.java:50`, `CertificationDTO.java:25`, `ExperienceDTO.java:26-27` reference proof upload fields.
- vNext now: `learner-profile-workspace.tsx:73-108` collection forms omit file pickers.
- Fix: Implement private receipt reference selectors and secure preview.

## G2-1-004-053  [P2] GAP  facet F18  effort S
- Legacy: `profileSectionSchemas.js:67-84` labels 'Institution Name', 'Grade', 'Max Grade'.
- vNext now: `learner-profile-workspace.tsx:73-84` uses 'Institution', 'Grade obtained', 'Maximum grade'.
- Fix: Match literal labels/helpers where clone copy applies.

## G2-1-004-058  [P2] GAP  facet F20  effort S
- Legacy: `ProfileSectionsPanel.js:374-408` Add/Delete commits immediately.
- vNext now: `learner-profile-workspace.tsx:285-303` edits draft and guarded Save.
- Fix: Make unsaved pending deletion and discard explicit.

## G2-1-031-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:915-933,937-955: UserInfo, ProfileCompleteness, card grid with personal details first.
- vNext now: src/components/profile/learner-profile-workspace.tsx:531-651: checklist and profile header, Contacts before others, no same AntD grid.
- Fix: Reorder cards and use old header/accent/two-column grid.

## G2-1-031-006  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:38,915-955: cards with #BDE9FA header, AntD Row gutter20.
- vNext now: src/components/profile/learner-profile-workspace.tsx:129-138,651-775: border-bottom single-column sections with plain headings.
- Fix: Restore card borders, accent and gutters.

## G2-1-031-009  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:152: RefreshStatus 'Refreshing profile…'.
- vNext now: src/components/profile/learner-profile-workspace.tsx:545-548: manual Refresh profile button/status, no identical global RefreshStatus.
- Fix: Show in-flight refresh status on visibility update.

## G2-1-031-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:41-66: Edit pencil and Add plus icons on each Card.
- vNext now: src/components/profile/learner-profile-workspace.tsx:652-762: text Buttons Edit/Add/Delete, different icon/placement.
- Fix: Clone pencil/plus header actions and exact disabled states.

## G2-1-031-019  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:928-933: completeness block after UserInfo.
- vNext now: src/components/profile/learner-profile-workspace.tsx:599-648: checklist/coverage percentage shown in different place.
- Fix: Match completeness location and progress visuals.

## G2-1-031-044  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:153-162: stale data + RefreshStatus/Alert.
- vNext now: src/components/profile/learner-profile-workspace.tsx:222-300: preserves draft on refresh, but no same visible banner.
- Fix: Show status for failed refresh.

## G2-1-031-048  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/profile.js:122-129,148-174: scroll PageShell, responsive profile cards from About xs24/xl12.
- vNext now: src/components/profile/learner-profile-workspace.tsx:129-138,651-775: border-bottom full-width sections, mobile quick links.
- Fix: Match old two-column cards and responsive margins.

## G2-1-031-054  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:1430-1486: resume literals 'Resume uploaded', 'View resume', 'Replace resume', 'Upload resume from Drive'.
- vNext now: src/components/profile/learner-profile-workspace.tsx:573-582: not all legacy actions shown.
- Fix: Restore resume labels/actions in profile.

## G2-3-017-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:668-722`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-527`, `src/modules/people/learner-profile-section-recovery-model.ts:2-23`
- Fix: Legacy `GET/POST /{learnerId}/education`, PUT/DELETE by positional index and profile About qualifications panel; vNext learner workspace handles owned `education` collection via section-save action and stable item ID. Preserve old deep links, display hierarchy and label.

## G2-3-017-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:600-666`
- vNext now: `src/modules/people/learner-education-picker-model.ts:1-24`, `src/components/profile/learner-profile-workspace.tsx:71-83`
- Fix: Legacy exposes education/config, exam-configs, exam-config/{examCode}, grading-types and colleges-autocomplete endpoints; vNext education type/exam pickers use static lists and field controls. Restore dynamic source options with fallbacks.

## G2-3-017-003  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:23-55`, `122-205`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:71-83`, `478-511`
- Fix: Legacy Qualification adds/edits in cascading education/program/specialization control with institution AutoComplete and exam-specific subfields; vNext uses generic collection editor fields. Match section grouping and dependent selects.

## G2-3-017-004  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:152-165`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:714-735`
- Fix: Legacy education list ordered recent qualification first, then startYear and endYear descending; vNext document collection rendered in array order. Provide stable recent-first academic date sort.
