# Job: fix every TypeScript error (lane chat-2)

32 errors from `tsc --noEmit` on origin/main. Open each file, fix the error with valid strict TypeScript (no `any`, no ts-ignore, no new packages), keep the visual output identical. Tick [x] and write ONE proof line per error in docs/audit/ux/typecheck-lane-2.md. Push to chatgpt/chat-2-b with [chat-2].

- [ ] src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx(110,8): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/app/(authenticated)/learn/attendance/calendar/page.tsx(82,10): error TS2304: Cannot find name 'DateInput'.
- [ ] src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx(49,33): error TS2322: Type 'string | number' is not assignable to type 'string'.
- [ ] src/app/(authenticated)/tpo/companies/[companyId]/page.tsx(195,33): error TS2322: Type 'string | number' is not assignable to type 'string'.
- [ ] src/app/api/placements/applications/[applicationId]/offers/route.ts(36,9): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type '{ roleTitle: string; kind?: "OFFER" | "LOI" | undefined; annualCtcInr?: number | n
- [ ] src/app/api/placements/offers/[offerId]/actions/route.ts(33,9): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type '{ action: "ACCEPT"; } | { action: "DECLINE"; reason?: string | null | undefined; } | { action
- [ ] src/app/api/placements/offers/[offerId]/joining/route.ts(33,9): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type '{ status: "JOINED" | "DID_NOT_JOIN" | "DEFERRED"; joiningDate?: string | null | undefined; re
- [ ] src/app/api/projects/[projectId]/mentor-delivery-review-export/route.ts(22,13): error TS2339: Property 'enabled' does not exist on type '{ project: { id: string; title: string; status: string; }; query: { projectId: string; status: "ALL" | "DRAFT" | "SUB
- [ ] src/app/api/projects/[projectId]/mentor-delivery-review-export/route.ts(29,28): error TS2339: Property 'enabled' does not exist on type '{ project: { id: string; title: string; status: string; }; query: { projectId: string; status: "ALL" | "DRAFT" | "SUB
- [ ] src/components/academics/learner-class-schedule.tsx(505,80): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/admin/lecture-hall-manager.tsx(275,58): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/admin/lecture-hall-manager.tsx(281,64): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/admin/lecture-hall-manager.tsx(286,60): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/admin/lecture-hall-manager.tsx(296,58): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/admin/lecture-hall-manager.tsx(306,58): error TS17001: JSX elements cannot have multiple attributes with the same name.
- [ ] src/components/placements/college-hiring-funnel.tsx(72,47): error TS2322: Type 'string | number' is not assignable to type 'string'.
- [ ] src/components/placements/placement-candidate-evidence-editor.tsx(351,19): error TS2322: Type '{ type: string; checked: boolean; onChange: (event: ChangeEvent<HTMLInputElement, HTMLInputElement>) => void; }' is not assignable to type 'IntrinsicAttributes
- [ ] src/components/placements/tpo-week-hour-calendar.tsx(246,66): error TS2322: Type '(confirmed?: boolean) => void' is not assignable to type 'MouseEventHandler<HTMLButtonElement>'.
- [ ] src/components/placements/tpo-week-hour-calendar.tsx(260,21): error TS18048: 'review.prompts.length' is possibly 'undefined'.
- [ ] src/components/projects/project-workspace.tsx(322,74): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
- [ ] src/components/shell/route-progress.tsx(41,7): error TS2322: Type 'number' is not assignable to type 'Timeout'.
- [ ] src/components/shell/route-progress.tsx(42,7): error TS2322: Type 'number' is not assignable to type 'Timeout'.
- [ ] src/components/shell/route-progress.tsx(44,7): error TS2322: Type 'number' is not assignable to type 'Timeout'.
- [ ] src/components/shell/route-transition.tsx(21,4): error TS2322: Type 'number' is not assignable to type 'Timeout'.
- [ ] src/components/tpo/recruiter-leads-workspace.tsx(1027,16): error TS2322: Type '(visibleKeys: readonly string[]) => Element' is not assignable to type 'ReactNode'.
- [ ] src/components/ui/date-range-picker.tsx(37,38): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [ ] src/components/ui/date-range-picker.tsx(38,56): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [ ] src/components/ui/date-range-picker.tsx(39,56): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [ ] src/components/ui/date-range-picker.tsx(40,36): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [ ] src/components/ui/popover.tsx(21,18): error TS7053: Element implicitly has an 'any' type because expression of type '"data-slot"' can't be used to index type '{ id?: string | undefined; slot?: string | undefined; style?: CSSProperties | undefined; title?
- [ ] src/modules/people/super-admin-person-audit-service.ts(29,13): error TS2769: No overload matches this call.
- [ ] src/modules/placements/tpo-interview-slot-service.ts(440,57): error TS2769: No overload matches this call.
