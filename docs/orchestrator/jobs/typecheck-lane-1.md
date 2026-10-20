# Job: fix TypeScript errors (lane chat-1)

These 8 errors come from tsc --noEmit on origin/main. For each: open the file, fix the cause with valid strict TypeScript (no any, no ts-ignore, no new packages), keep visual output and behaviour identical, then re-read the file for matching tags, imports and duplicate attributes. Tick [x] and write ONE proof line per error in docs/audit/ux/typecheck-lane-1.md. Push to chatgpt/chat-1-b with [chat-1]. Then continue your other queue.

- [ ] src/app/(authenticated)/admin/colleges/[collegeId]/branding/loading.tsx(12,62): error TS2322: Type '"form"' is not assignable to type '"directory" | "card" | undefined'.
- [ ] src/app/(authenticated)/tpo/companies/[companyId]/page.tsx(162,33): error TS2322: Type 'string | number' is not assignable to type 'string'.
- [ ] src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx(67,67): error TS2322: Type '{ children: Element[]; className: string; defaultOpen: boolean; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [ ] src/app/(authenticated)/tpo/settings/prep-readiness/error.tsx(5,10): error TS2741: Property 'description' is missing in type '{ title: string; action: Element; }' but required in type 'ErrorStateProps'.
- [ ] src/components/attendance/faculty-attendance-schedule-editor.tsx(130,50): error TS2322: Type '{ children: Element[]; key: string; defaultOpen: boolean; className: string; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [ ] src/components/projects/mentor-task-details-edit.tsx(108,18): error TS2322: Type '{ children: Element[]; defaultOpen: boolean; className: string; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [ ] src/components/tpo/recruiter-leads-workspace.tsx(1030,16): error TS2322: Type '(visibleKeys: readonly string[]) => Element' is not assignable to type 'ReactNode'.
- [ ] src/modules/people/super-admin-person-audit-service.ts(29,13): error TS2769: No overload matches this call.
