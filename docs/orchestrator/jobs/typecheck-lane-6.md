# Job: fix TypeScript errors (lane chat-6)

These 6 errors come from tsc --noEmit on origin/main. For each: open the file, fix the cause with valid strict TypeScript (no any, no ts-ignore, no new packages), keep visual output and behaviour identical, then re-read the file for matching tags, imports and duplicate attributes. Tick [x] and write ONE proof line per error in docs/audit/ux/typecheck-lane-6.md. Push to chatgpt/chat-6-b with [chat-6]. Then continue your other queue.

- [x] src/app/api/placements/applications/[applicationId]/offers/route.ts(36,9): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type '{ roleTitle: string; kind?: "OFFER" | "LOI" | undefined; annualCtcInr?: number | null | undefined; joiningDate?: string | null |
- [x] src/components/courses/assignment-submission-control.tsx(331,84): error TS2345: Argument of type 'SubmissionType' is not assignable to parameter of type '"LINK" | "TEXT"'.
- [x] src/components/projects/project-resource-controls.tsx(111,117): error TS2322: Type '{ children: Element[]; className: string; defaultOpen: boolean; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [x] src/components/tracker/tracker-report-form.tsx(210,64): error TS2322: Type '{ children: Element[]; className: string; defaultOpen: boolean; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [x] src/components/tracker/tracker-report-form.tsx(220,92): error TS2322: Type '{ children: (Element | null)[]; "aria-label": string; className: string; defaultOpen: boolean; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [x] src/modules/placements/tpo-interview-slot-service.ts(440,57): error TS2769: No overload matches this call.
