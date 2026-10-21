# Work packet: edit src/modules/courses/college-content-aggregate-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/college-admin-lesson-content.md

## G2-18-007-019  [P1] MISSING  facet F04  effort M
- Legacy: Old VIDEO external or file proxy key renders View button (`LessonContent.js:1001-1033`).
- vNext now: New catalogue explicitly omits storage key and playback URL, no View (`college-content-aggregate-service.ts:35-38,82-103`; `college-content-aggregate.tsx:275-279`).
- Fix: Add click-to-resolve signed View endpoint under courses.manage; never include raw key.

## G2-18-007-058  [P1] GAP  facet F12  effort L
- Legacy: Old video tab admits VIDEO and YOUTUBE, live-only LIVE_CLASS (`LessonContent.js:92-125`).
- vNext now: New catalogue can list both formats but authoring only YOUTUBE (`college-content-aggregate-service.ts:122-125`; `college/videos/page.tsx:32-37`).
- Fix: Make VIDEO write possible or mark explicitly unsupported with migration strategy.

## G2-18-007-084  [P1] GAP  facet F22  effort L
- Legacy: Old Resource `resource_materials`, html_content and text stored in JSON (`AdminResources.js:265-284`; `LessonContents.java:39-41`).
- vNext now: New notes/externalUrl plus gated material table (`courses.ts:387-391`; `college-content-aggregate-service.ts:160-172`).
- Fix: Migrate JSON material array/HTML, preserve file keys and counts.
