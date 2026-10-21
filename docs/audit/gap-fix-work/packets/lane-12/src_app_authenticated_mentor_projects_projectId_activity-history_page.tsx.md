# Work packet: edit src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-19-017-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy repo fetches project-scoped and meeting-key-scoped edit history `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:20-24`
- vNext now: vNext mentor Activity page reads generic event history, not typed before/after meeting history `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:36-41` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Implement typed meeting revision query or prove general event materialization equivalent.

## G2-19-017-029  [P1] GAP  facet F11  effort M
- Legacy: Legacy history DTO exposes actor and before/after fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- vNext now: vNext Activity page withholds actor identity and raw metadata to mentors `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Design permission-dependent summary vs full diff; ensure no secrets leak.

## G2-19-017-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy revision JSON is free-form Object and may contain private fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48`
- vNext now: vNext candidate notes typed JSONB but generic event UI redacts metadata `src/db/schema/project-audit-staged.ts:17-30` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Allowlist before/after field projection, redact private links/contact info.

## G2-19-017-053  [P1] GAP  facet F23  effort L
- Legacy: Legacy typed history can reconstruct changed fields/before/after `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-51`
- vNext now: vNext generic event feed explicitly does not claim to contain every historic action `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:140-142`
- Fix: Treat generic feed as supplement, not substitute for typed source audit.

## G2-19-017-021  [P3] GAP  facet F08  effort S
- Legacy: Legacy entity/DTO itself has no toast/error copy, just persisted revision `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:17-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectMeetingHistoryDTO.java:8-21`
- vNext now: vNext generic Activity page has EmptyState `No recorded project activity` `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx:122-124`
- Fix: Make typed history absence distinguish not implemented from no activity.
