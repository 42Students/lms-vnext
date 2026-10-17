import {z} from "zod";

export const FINDING_STATUSES=[
 "NEW","CONFIRMED","IN_PROGRESS","FIXED_DEV","RELEASED_PROD",
 "VERIFIED","DUPLICATE","WONT_FIX","NEEDS_INFO","CANT_REPRODUCE",
] as const;
export const FINDING_SEVERITIES=["CRITICAL","HIGH","MEDIUM","LOW"] as const;
export const FINDING_KINDS=["BUG","SECURITY","DATA","UX","COPY","PERFORMANCE","ACCESSIBILITY"] as const;
export const FINDING_AREAS=[
 "ACADEMICS","ADMISSIONS","ASSESSMENTS","ATTENDANCE","AUTH","CALENDAR",
 "COURSES","CONTENT","DASHBOARD","FACULTY","INTEGRATIONS","JOBS",
 "LEARNER","MENTOR","MESSAGING","NOTIFICATIONS","PAYMENTS","PLACEMENTS",
 "PROJECTS","RECRUITER","REPORTS","SETTINGS","SUPER_ADMIN",
] as const;
export const findingStatusSchema=z.enum(FINDING_STATUSES);
export const findingSeveritySchema=z.enum(FINDING_SEVERITIES);
export const findingKindSchema=z.enum(FINDING_KINDS);
export const findingAreaSchema=z.enum(FINDING_AREAS);
export const findingFilterSchema=z.strictObject({
 view:z.enum(["OPEN","RELEASE","ALL"]).default("OPEN"),
 statuses:z.array(findingStatusSchema).max(10).default([]),
 severities:z.array(findingSeveritySchema).max(4).default([]),
 areas:z.array(findingAreaSchema).max(23).default([]),
 kinds:z.array(findingKindSchema).max(7).default([]),
 query:z.string().trim().max(150).default(""),
 page:z.coerce.number().int().min(1).max(1000).default(1),
});
export const findingMutationSchema=z.discriminatedUnion("action",[
 z.strictObject({action:z.literal("STATUS"),expectedVersion:z.number().int().nonnegative(),
   status:findingStatusSchema,note:z.string().trim().max(2000).optional()}),
 z.strictObject({action:z.literal("SEVERITY"),expectedVersion:z.number().int().nonnegative(),
   severity:findingSeveritySchema}),
 z.strictObject({action:z.literal("ASSIGNEE"),expectedVersion:z.number().int().nonnegative(),
   assignee:z.string().trim().max(150).nullable()}),
 z.strictObject({action:z.literal("DUPLICATE"),expectedVersion:z.number().int().nonnegative(),
   duplicateOf:z.string().uuid(),note:z.string().trim().max(2000).optional()}),
 z.strictObject({action:z.literal("FIX_COMMIT"),expectedVersion:z.number().int().nonnegative(),
   repo:z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/).max(180),
   sha:z.string().regex(/^[0-9a-f]{7,40}$/i)}),
 z.strictObject({action:z.literal("COMMENT"),expectedVersion:z.number().int().nonnegative(),
   note:z.string().trim().min(1).max(4000)}),
]);

const terminalNotes=new Set(["WONT_FIX","CANT_REPRODUCE","NEEDS_INFO","VERIFIED"]);
const allowedTransitions:Record<typeof FINDING_STATUSES[number],readonly typeof FINDING_STATUSES[number][]> = {
 NEW:["CONFIRMED","NEEDS_INFO","DUPLICATE","WONT_FIX","CANT_REPRODUCE"],
 CONFIRMED:["IN_PROGRESS","NEEDS_INFO","DUPLICATE","WONT_FIX","CANT_REPRODUCE"],
 IN_PROGRESS:["FIXED_DEV","NEEDS_INFO","CONFIRMED","WONT_FIX"],
 FIXED_DEV:["RELEASED_PROD","IN_PROGRESS","CONFIRMED"],
 RELEASED_PROD:["VERIFIED","IN_PROGRESS","CONFIRMED"],
 VERIFIED:["CONFIRMED"],DUPLICATE:["CONFIRMED"],WONT_FIX:["CONFIRMED"],
 NEEDS_INFO:["CONFIRMED","CANT_REPRODUCE"],CANT_REPRODUCE:["CONFIRMED"],
};
export function findingTransitionAllowed(current:string,next:string,note:string|null|undefined):boolean{
 if(!FINDING_STATUSES.includes(current as typeof FINDING_STATUSES[number])||
    !FINDING_STATUSES.includes(next as typeof FINDING_STATUSES[number]))return false;
 if(!allowedTransitions[current as typeof FINDING_STATUSES[number]].includes(next as typeof FINDING_STATUSES[number]))return false;
 if(terminalNotes.has(next)&&!note?.trim())return false;
 return true;
}
export const OPEN_FINDING_STATUSES=FINDING_STATUSES.filter(status=>
 !["VERIFIED","DUPLICATE","WONT_FIX","CANT_REPRODUCE"].includes(status));
export function findingStatusLabel(value:string):string{
 return ({NEW:"New",CONFIRMED:"Confirmed",IN_PROGRESS:"In progress",
   FIXED_DEV:"Fixed (dev)",RELEASED_PROD:"Released (prod)",VERIFIED:"Verified",
   DUPLICATE:"Duplicate",WONT_FIX:"Won't fix",NEEDS_INFO:"Needs info",
   CANT_REPRODUCE:"Can't reproduce"} as Record<string,string>)[value]??value;
}
export function findingSeverityLabel(value:string):string{
 return value.charAt(0).toUpperCase()+value.slice(1).toLowerCase();
}
