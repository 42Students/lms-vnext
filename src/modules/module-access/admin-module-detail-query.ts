import {z} from "zod";
import {adminModuleOverrideFilterSchema} from "./admin-override-filter-model";

const decimalPage=z.union([
 z.number().int().min(1).max(10000),
 z.string().regex(/^[1-9][0-9]*$/)
  .transform(Number).pipe(z.number().int().min(1).max(10000)),
]);
/** Production-selected college scope always comes from the route and context.
 * URL filters never select a different tenant or a different authenticated user.
 */
export const adminModuleDetailQuerySchema=z.strictObject({
 module:adminModuleOverrideFilterSchema,
 scope:z.enum(["DEPARTMENT","PROGRAM","COHORT","SECTION","MEMBERSHIP"]).optional(),
 locks:z.enum(["ALL","LOCKED"]).default("ALL"),
 storedState:z.enum(["ALL","ON","OFF"]).default("ALL"),
 scopeId:z.uuid().optional(),
 page:decimalPage.default(1),
}).superRefine((input,ctx)=>{
 if(input.scopeId&&!input.scope)
  ctx.addIssue({code:"custom",path:["scope"],message:"Specify a scope type with scope ID"});
});
export type AdminModuleDetailQuery=z.output<typeof adminModuleDetailQuerySchema>;
export type AdminModuleDetailPageQuery=AdminModuleDetailQuery&{academicPage:number};
export function parseAdminModuleDetailPageParams(
 raw:Record<string,string|string[]|undefined>,
):AdminModuleDetailPageQuery|null{
 const allowed=new Set(["module","scope","locks","storedState","scopeId","page","academicPage"]);
 if(Object.keys(raw).some(key=>!allowed.has(key))||
    Object.values(raw).some(Array.isArray))return null;
 const academicInput=raw.academicPage;
 const academicPage=academicInput===undefined?1:
  typeof academicInput==="string"&&/^[1-9][0-9]*$/.test(academicInput)?Number(academicInput):NaN;
 if(!Number.isSafeInteger(academicPage)||academicPage>10000)return null;
 const parsed=adminModuleDetailQuerySchema.safeParse({
  module:raw.module||undefined,scope:raw.scope||undefined,
  locks:raw.locks||undefined,storedState:raw.storedState||undefined,
  scopeId:raw.scopeId||undefined,page:raw.page||undefined,
 });
 return parsed.success?{...parsed.data,academicPage}:null;
}
