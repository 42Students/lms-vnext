import {z} from "zod";
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{
 const date=new Date(value+"T12:00:00.000Z");
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
});
export const tpoCalendarUrlSchema=z.object({
 date:day.optional(),
 view:z.enum(["week","month","agenda"]).optional(),
 company:z.string().trim().max(150).optional(),
 kind:z.enum(["","ROUND","APPLICATION_DEADLINE","FOLLOW_UP","BLOCKED"]).optional(),
}).strict();
export function parseTpoCalendarUrl(raw:unknown){return tpoCalendarUrlSchema.safeParse(raw);}

/** Client viewport is authoritative for the legacy 768px calendar breakpoint.
 * Pass an explicit URL view when present; it must override responsive defaults. */
export function tpoCalendarViewForViewport(
 viewportWidth:number,
 explicitView?:"agenda"|"week"|"month",
):"agenda"|"week"|"month"{
 return explicitView??(viewportWidth<768?"agenda":"week");
}

/** Server fallback until the client viewport is known; never use UA as width. */
export function initialTpoCalendarView(userAgent:string):"agenda"|"week"{
 return /Android|iPhone|iPad|iPod|Mobile|Mobi/i.test(userAgent)?"agenda":"week";
}
