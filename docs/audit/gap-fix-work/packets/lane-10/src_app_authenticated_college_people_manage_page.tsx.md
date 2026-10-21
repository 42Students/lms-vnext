# Work packet: edit src/app/(authenticated)/college/people/manage/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md

## G2-15-013-029  [P2] GAP  facet F07  effort S
- Legacy: No auth -> 401 Authentication required. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:122-124`)
- vNext now: Missing college admin redirects dashboard. (`src/app/(authenticated)/college/people/manage/page.tsx:52-55`)
- Fix: Ensure search API returns consistent 401 for callers and route redirects only for UI.

## G2-15-013-031  [P2] MISSING  facet F07  effort S
- Legacy: Unknown selection learner -> 404. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:277-284`)
- vNext now: New actions on memberships; no selection metric endpoint. (`src/app/(authenticated)/college/people/manage/page.tsx:43-50`)
- Fix: Return not-found on inaccessible selected student.

## G2-15-013-032  [P3] GAP  facet F07  effort S
- Legacy: Search success message Learners retrieved. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:137-137`)
- vNext now: New list simply renders; no equivalent response envelope or label. (`src/app/(authenticated)/college/people/manage/page.tsx:118-125`)
- Fix: Map compatibility API success/message where reused client expects it.

## G2-15-013-034  [P3] MISSING  facet F08  effort S
- Legacy: Selection recorded response after increment popularity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchController.java:287-288`)
- vNext now: Person membership action doesn't emit matching confirmation. (`src/app/(authenticated)/college/people/manage/page.tsx:43-50`)
- Fix: If supported, emit Selection recorded only after persisted usage.
