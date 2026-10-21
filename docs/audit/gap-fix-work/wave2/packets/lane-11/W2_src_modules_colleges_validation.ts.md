# Work packet (wave 2): edit src/modules/colleges/validation.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-controller.md

## G2-3-028-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:11-30`
- vNext now: `src/modules/colleges/validation.ts:21-33`
- Fix: Legacy all text address/location max255; vNext city/state/country max128 and postalCode max32. Document contract change.

## G2-3-028-028  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:15-16`
- vNext now: `src/modules/colleges/validation.ts:15-19`
- Fix: Legacy backend accepts uniqueId up to 255; frontend slug validates 3-63. VNext backend now rejects non-slug historic data.

## G2-3-028-029  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/CollegeDTO.java:43-43`
- vNext now: `src/modules/colleges/validation.ts:21-24`
- Fix: Legacy orgId primitive int, vNext organizationId UUID and active parent requirement; migration must map.

## G2-3-028-046  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CollegeServiceImpl.java:155-190`
- vNext now: `src/modules/colleges/validation.ts:35-50`
- Fix: Legacy domain host upsert on college create/edit; vNext basic mutation does not.
