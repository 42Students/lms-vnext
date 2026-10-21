# Work packet (wave 2): edit src/modules/placements/tpo-crm-validation.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u022-tpo-recruiter-lead-controller.md

## G2-14-022-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy lead source pickable 7 options plus MANUAL/IMPORT internal `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:45-76`
- vNext now: New input source validator supports same labels plus import path `src/modules/placements/tpo-crm-validation.ts:26-46`
- Fix: Verify default source order and whether IMPORT appears in manual dropdown

## G2-14-022-009  [P2] GAP  facet F04  effort S
- Legacy: Legacy add fields name,emailOrPhone,otherContact,designation,companyName,source `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:42-52`
- vNext now: New create takes email and phone separately plus optional followup `src/modules/placements/tpo-crm-validation.ts:48-60`
- Fix: Accept older primary/secondary contact layout and designation field

## G2-14-022-016  [P2] GAP  facet F06  effort S
- Legacy: Legacy primary emailOrPhone required and 8+ digit phone if no email `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:95-104`
- vNext now: New email or phone required, normalized phone validator `src/modules/placements/tpo-crm-validation.ts:4-20` `src/modules/placements/tpo-crm-validation.ts:48-61`
- Fix: Match exact min digit/format and validation text

## G2-14-022-018  [P2] GAP  facet F06  effort M
- Legacy: Legacy edit source omitted unchanged; blank resets MANUAL/IMPORT `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:68-80` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadService.java:151-158`
- vNext now: New update source nullable/optional, result depends on patch semantics `src/modules/placements/tpo-crm-validation.ts:98-110` `src/modules/placements/tpo-crm-service.ts:605-655`
- Fix: Reproduce explicit omitted-vs-null source behavior and fallback

## G2-14-022-019  [P2] GAP  facet F06  effort M
- Legacy: Legacy add followup takes LocalDateTime dueAt and optional note `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:115-125`
- vNext now: New dueAt expects ISO datetime with offset, required future when creating in same flow `src/modules/placements/tpo-crm-validation.ts:56-57` `src/modules/placements/tpo-crm-validation.ts:81-89`
- Fix: Map local IST date/time and permit historical overdue import

## G2-14-022-054  [P2] GAP  facet F18  effort S
- Legacy: Legacy call/email/meeting/note validation exact text `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterLeadController.java:101-113`
- vNext now: New enum code failure lacks legacy text `src/modules/placements/tpo-crm-validation.ts:69-80`
- Fix: Restore exact client-facing wording
