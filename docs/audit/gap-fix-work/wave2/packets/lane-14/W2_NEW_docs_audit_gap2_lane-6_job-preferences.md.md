# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-6/job-preferences.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-6/job-preferences.md

## G2-6-019-001  [P2] GAP  facet F01  effort M
- Legacy: Learner profile GET/PUT /{learnerId}/job-preferences (LearnerProfileController.java:1176-1203).
- vNext now: vNext profile Job Preferences card and Edit Job Preferences dialog (learner-profile-workspace.tsx:661-672,921-959).
- Fix: Document route consolidation into profile section document and keep link/access to preferences.

## G2-6-019-003  [P2] GAP  facet F02  effort S
- Legacy: Legacy legacy-copy catalogue orders 6 fields Role, Specific Role, Shift, City, Exam Slot, Job Notifications (profileSectionSchemas.js:85-92).
- vNext now: vNext profile card shows only first 4 fields (learner-profile-workspace.tsx:661-671).
- Fix: Display missing Exam Slot Preference and Job Notifications Enabled in exact order.

## G2-6-019-005  [P2] GAP  facet F03  effort M
- Legacy: Legacy six fields incl notification boolean in profile section catalogue (profileSectionSchemas.js:85-92).
- vNext now: vNext Edit preferences CTA, four read values, no notification toggle (learner-profile-workspace.tsx:661-671).
- Fix: Add labeled notification switch and exam slot picker/summary or link to unified notification settings.

## G2-6-019-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy rolePreference single nullable string (JobPreferences.java:22-23).
- vNext now: vNext rolePreferences is array max20, each max100 (profile-validation.ts:509-518).
- Fix: Define round-trip normalization for comma-delimited legacy string and multi-role profile list.

## G2-6-019-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy specificRolePreference unrestricted TEXT (JobPreferences.java:25-26).
- vNext now: vNext max200 (profile-validation.ts:511-512).
- Fix: Audit long legacy values, truncate only with user confirmation or increase bound.

## G2-6-019-011  [P2] GAP  facet F04  effort S
- Legacy: Legacy preferredEmploymentCity string nullable, no entity max (JobPreferences.java:31-32).
- vNext now: vNext city max120 (profile-validation.ts:514).
- Fix: Set compatible max/validation and sanitize imported city names.

## G2-6-019-021  [P2] MISSING  facet F06  effort S
- Legacy: Legacy profile DTO includes examSlotPreference (JobPreferencesDTO.java:9-16).
- vNext now: vNext edit dialog only role, specific role, shift, city (learner-profile-workspace.tsx:930-957).
- Fix: Add exam slot dropdown with Morning, Afternoon, Evening and null choice.

## G2-6-019-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy preferred role is singular text in DTO (JobPreferencesDTO.java:9-11).
- vNext now: vNext edit role multi-select implemented via comma-separated Input maxLength800 (learner-profile-workspace.tsx:931-936).
- Fix: Recreate legacy role picker or explicit multi-select and preserve commas within role labels.

## G2-6-019-026  [P2] GAP  facet F09  effort M
- Legacy: Legacy preference editor appears in learner profile section (profileSectionSchemas.js:85-92).
- vNext now: vNext dedicated Edit Job Preferences dialog title and Save/Cancel (learner-profile-workspace.tsx:921-959).
- Fix: Clone legacy form trigger, modal title, close conditions and field order after inspecting old frontend render.

## G2-6-019-042  [P2] GAP  facet F18  effort S
- Legacy: Legacy headings Role Preference, Specific Role Preference, Work Shift Preference, Preferred Employment City, Exam Slot Preference, Job Notifications Enabled (profileSectionSchemas.js:85-92).
- vNext now: vNext read card matches first four, omits last two (learner-profile-workspace.tsx:661-671).
- Fix: Restore literal labels and section wording without abbreviation.

## G2-6-019-043  [P2] GAP  facet F18  effort S
- Legacy: Legacy work shift sample strings Day Shift, Night Shift, Flexible, Remote (JobPreferences.java:28-29).
- vNext now: vNext dropdown Day, Night, Rotational, Flexible (learner-profile-workspace.tsx:942-951).
- Fix: Provide display mapping or exact old options incl Remote if confirmed by old picker.

## G2-6-019-049  [P2] GAP  facet F22  effort M
- Legacy: Legacy job_notifications_enabled NOT NULL true (JobPreferences.java:41-45).
- vNext now: VNext two Boolean preference columns each NOT NULL true (placements.ts:334-341).
- Fix: Define exact backfill split and default semantics for disable-all vs partial.
