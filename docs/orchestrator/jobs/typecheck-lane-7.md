# Job: fix TypeScript errors (lane chat-7)

These 7 errors come from tsc --noEmit on origin/main. For each: open the file, fix the cause with valid strict TypeScript (no any, no ts-ignore, no new packages), keep visual output and behaviour identical, then re-read the file for matching tags, imports and duplicate attributes. Tick [x] and write ONE proof line per error in docs/audit/ux/typecheck-lane-7.md. Push to chatgpt/chat-7-b with [chat-7]. Then continue your other queue.

- [x] src/app/api/placements/offers/[offerId]/actions/route.ts(33,9): error TS2345: Argument of type 'Record<string, unknown>' is not assignable to parameter of type '{ action: "ACCEPT"; } | { action: "DECLINE"; reason?: string | null | undefined; } | { action: "WITHDRAW"; reason: string; }'.
- [x] src/components/courses/faculty-lesson-authoring.tsx(843,33): error TS2322: Type '{ children: Element[]; key: Mode; defaultOpen: boolean; className: string; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [x] src/components/projects/template-metadata-edit-control.tsx(45,78): error TS2322: Type '{ children: Element[]; className: string; defaultOpen: boolean; }' is not assignable to type 'DetailedHTMLProps<DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>'.
- [x] src/components/ui/date-range-picker.tsx(37,38): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [x] src/components/ui/date-range-picker.tsx(38,56): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [x] src/components/ui/date-range-picker.tsx(39,56): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
- [x] src/components/ui/date-range-picker.tsx(40,36): error TS2322: Type 'string | number | undefined' is not assignable to type 'string | undefined'.
