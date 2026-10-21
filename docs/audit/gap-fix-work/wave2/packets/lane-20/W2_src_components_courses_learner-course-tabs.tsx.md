# Work packet (wave 2): edit src/components/courses/learner-course-tabs.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-courses-courseid-catchall.md

## G2-17-006-041  [P3] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/layouts/CourseTabsLayout.js:62-66 PageShell ariaLabel 'Course workspace', tabsAriaLabel 'Course sections'.
- vNext now: src/components/courses/learner-course-tabs.tsx:19 ariaLabel 'Course workspace' not Course sections; src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx:164 nav 'Course navigation'.
- Fix: Set tabs accessible label to 'Course sections' and preserve back nav semantics.
