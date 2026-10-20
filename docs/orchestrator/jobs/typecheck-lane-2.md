# Job: fix every TypeScript error (lane chat-2)

These errors come from `tsc --noEmit` on origin/main (about 30). For each: open the file, fix the cause with valid strict TypeScript (no `any`, no ts-ignore, no new packages), keep the visual output identical. After the list, re-read every touched file for matching tags, imports and duplicate attributes. Tick [x] here and write ONE proof line per item in docs/audit/ux/typecheck-lane-2.md. Push to chatgpt/chat-2-b with [chat-2]. Then go back to your dimension sweep queue.

- [ ] src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:110 TS17001 JSX element has multiple attributes with the same name
- [ ] src/app/(authenticated)/learn/attendance/calendar/page.tsx:82 TS2304 Cannot find name 'DateInput' (import it from the existing ui component)
- [ ] src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx:49 TS2322 string | number not assignable to string
- [ ] src/app/(authenticated)/tpo/companies/[companyId]/page.tsx:195 TS2322 string | number not assignable to string
- [ ] src/app/api/placements/applications/[applicationId]/offers/route.ts:36 TS2345 Record<string, unknown> not assignable to the typed offer input (parse the body with the existing zod schema)
- [ ] src/app/api/placements/offers/[offerId]/actions/route.ts:33 TS2345 Record<string, unknown> not assignable to the action union (parse with the zod schema)
- [ ] src/app/api/placements/offers/[offerId]/joining/route.ts:33 TS2345 Record<string, unknown> not assignable to the joining input (parse with the zod schema)
- [ ] src/app/api/projects/[projectId]/mentor-delivery-review-export/route.ts:22 and :29 TS2339 property 'enabled' does not exist on the result type
- [ ] src/components/placements/college-hiring-funnel.tsx:72 TS2322 string | number not assignable to string
- [ ] src/components/placements/placement-candidate-evidence-editor.tsx:351 TS2322 `type` prop not accepted by the component (use the right component or drop the prop)
- [ ] src/components/placements/tpo-week-hour-calendar.tsx:246 TS2322 (confirmed?: boolean) => void used as a MouseEventHandler (wrap it)
- [ ] src/components/placements/tpo-week-hour-calendar.tsx:260 TS18048 review.prompts.length possibly undefined
- [ ] src/components/projects/project-workspace.tsx:322 TS2322 string | undefined not assignable to string
- [ ] src/components/shell/route-progress.tsx:41, :42, :44 TS2322 number not assignable to Timeout (use ReturnType<typeof setTimeout>)
- [ ] src/components/shell/route-transition.tsx:21 TS2322 number not assignable to Timeout
- [ ] src/components/tpo/recruiter-leads-workspace.tsx:1027 TS2322 a render function passed where a ReactNode is expected (call it)
- [ ] src/components/ui/date-range-picker.tsx:37, :38, :39, :40 TS2322 string | number | undefined not assignable to string | undefined
- [ ] src/components/ui/popover.tsx:21 TS7053 'data-slot' cannot index the props type
- [ ] src/modules/people/super-admin-person-audit-service.ts:29 TS2769 eq() given string | null for a college_id column (guard the null)
- [ ] src/modules/placements/tpo-interview-slot-service.ts:440 TS2769 insert is missing required column requestId
