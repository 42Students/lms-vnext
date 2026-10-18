import {z} from "zod";

export const tpoPrepReadinessSaveSchema=z.strictObject({
 courseIds:z.array(z.string().uuid()).max(40)
  .refine(ids=>new Set(ids).size===ids.length,"Duplicate course"),
 minimumCompleted:z.number().int().min(0).max(40),
 expectedVersion:z.union([z.iso.datetime({offset:true}),z.literal("none")]),
}).refine(row=>row.minimumCompleted<=row.courseIds.length,"Minimum exceeds required courses");

export function tpoPrepReadinessSamePolicy(raw:unknown,input:{courseIds:readonly string[];minimumCompleted:number}):boolean{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const current=raw as Record<string,unknown>;
 if(!Array.isArray(current.courseIds)||current.courseIds.length!==input.courseIds.length)return false;
 return Number.isInteger(current.minimumCompleted)&&current.minimumCompleted===input.minimumCompleted &&
  current.courseIds.every((id,index)=>typeof id==="string"&&id===input.courseIds[index]);
}
