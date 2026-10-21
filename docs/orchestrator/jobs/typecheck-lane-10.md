# Job: fix TypeScript errors (lane chat-10)

These 6 errors come from tsc --noEmit on origin/main. For each: open the file, fix the cause with valid strict TypeScript (no any, no ts-ignore, no new packages), keep visual output and behaviour identical, then re-read the file for matching tags, imports and duplicate attributes. Tick [x] and write ONE proof line per error in docs/audit/ux/typecheck-lane-10.md. Push to chatgpt/chat-10-b with [chat-10]. Then continue your other queue.

- [x] src/app/api/projects/[projectId]/mentor-delivery-review-export/route.ts(22,13): error TS2339: Property 'enabled' does not exist on type '{ project: { id: string; title: string; status: string; }; query: { projectId: string; status: "ALL" | "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED"; fe
- [x] src/app/api/projects/[projectId]/mentor-delivery-review-export/route.ts(29,28): error TS2339: Property 'enabled' does not exist on type '{ project: { id: string; title: string; status: string; }; query: { projectId: string; status: "ALL" | "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED"; fe
- [x] src/components/placements/tpo-week-hour-calendar.tsx(247,66): error TS2322: Type '(confirmed?: boolean) => void' is not assignable to type 'MouseEventHandler<HTMLButtonElement>'.
- [x] src/components/placements/tpo-week-hour-calendar.tsx(261,21): error TS18048: 'review.prompts.length' is possibly 'undefined'.
- [x] src/components/shell/route-transition.tsx(21,4): error TS2322: Type 'number' is not assignable to type 'Timeout'.
- [x] src/components/verification/CollegeVerificationPanel.tsx(204,111): error TS17001: JSX elements cannot have multiple attributes with the same name.
