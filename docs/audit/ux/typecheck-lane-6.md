# Typecheck lane 6 — source-only proof

Base: chatgpt/chat-6-b after fast-forward/rebase against origin/main. No TypeScript/CI executed per lane restriction. Each fix was inspected for strict types and JSX/import/attribute shape.

- [x] `src/app/api/placements/applications/[applicationId]/offers/route.ts(36,9)` — Service argument is now unknown, matching readTpoBulkRequestBody's Record<string,unknown>; issuePlacementOfferInputSchema.parse still validates the entire payload before use; removed unused imported input type. No route copy/HTTP behavior changed.
- [x] `src/components/courses/assignment-submission-control.tsx(331,84)` — Only render the final confirmation when submissionType is TEXT or LINK; TypeScript narrows the union for learnerAssignmentFinalConfirmation without casting; FILE flow and modal copy unchanged.
- [x] `src/components/projects/project-resource-controls.tsx(111,117)` — Replaced unsupported details.defaultOpen with native typed details.open; preserved the same metadata-derived initial expanded condition, details content and labels.
- [x] `src/components/tracker/tracker-report-form.tsx(210,64)` — Evidence disclosure uses HTMLDetailsElement.open instead of invalid defaultOpen with the identical Boolean(draft.evidenceLink) expression and unchanged children.
- [x] `src/components/tracker/tracker-report-form.tsx(220,92)` — Similar issues disclosure uses HTMLDetailsElement.open instead of invalid defaultOpen with the identical Boolean(similarQuery.trim()) expression, aria-label and children.
- [x] `src/modules/placements/tpo-interview-slot-service.ts(440,57)` — Required placementApplicationRoundExceptions.requestId is sourced from the latest approved ROUND_RESCHEDULE matching application and round; guard fails closed when no valid request exists, preserving FK provenance and Drizzle insert typing without a cast.
