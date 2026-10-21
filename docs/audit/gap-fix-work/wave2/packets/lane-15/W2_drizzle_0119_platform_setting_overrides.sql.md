# Work packet (wave 2): edit drizzle/0119_platform_setting_overrides.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u021-app-setting.md

## G2-14-021-053  [P2] GAP  facet F22  effort M
- Legacy: Legacy default uniqueness key fixed after V138 nullable global rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AppSettingRepository.java:13-23`
- vNext now: New composite PK strict sentinel `drizzle/0119_platform_setting_overrides.sql:1-11`
- Fix: Deduplicate GLOBAL key rows newest-first before import
