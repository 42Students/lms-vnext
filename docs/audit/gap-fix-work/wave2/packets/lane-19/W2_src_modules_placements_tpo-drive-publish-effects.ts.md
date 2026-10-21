# Work packet (wave 2): edit src/modules/placements/tpo-drive-publish-effects.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-8/admin-job-service.md

## G2-2-016-030  [P2] GAP  facet F11  effort L
- Legacy: Legacy learner eligibility selects hierarchy class, batch, program, department or full college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1083-1154`)
- vNext now: VNext learner reach preview via eligibility policies and roster membership (`src/modules/placements/tpo-drive-publish-effects.ts:1-120`)
- Fix: Map targeting priority and null/all-college semantics without broadening visibility

## G2-2-016-038  [P2] GAP  facet F15  effort L
- Legacy: Legacy job notification helper and after-commit learner messaging (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1045-1077,1524-1541`)
- vNext now: VNext activity events and in-app publish-notification service (`src/modules/placements/tpo-drive-publish-effects.ts:1-120`)
- Fix: Map exact message, template, recipient and failure retry; do not send duplicate on retries

## G2-8-012-030  [P2] GAP  facet F11  effort L
- Legacy: Legacy learner eligibility selects hierarchy class, batch, program, department or full college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1083-1154`)
- vNext now: VNext learner reach preview via eligibility policies and roster membership (`src/modules/placements/tpo-drive-publish-effects.ts:1-120`)
- Fix: Map targeting priority and null/all-college semantics without broadening visibility

## G2-8-012-038  [P2] GAP  facet F15  effort L
- Legacy: Legacy job notification helper and after-commit learner messaging (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1045-1077,1524-1541`)
- vNext now: VNext activity events and in-app publish-notification service (`src/modules/placements/tpo-drive-publish-effects.ts:1-120`)
- Fix: Map exact message, template, recipient and failure retry; do not send duplicate on retries
