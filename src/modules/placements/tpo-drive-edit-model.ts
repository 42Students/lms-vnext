import {z} from "zod";
export const tpoDriveEditSchema=z.object({
 confirmed:z.literal(true),
 notifyApplicants:z.boolean().default(false),
 applicationDeadline:z.iso.datetime({offset:true}).nullable().optional(),
 minCgpaHundredths:z.number().int().min(0).max(1000).nullable().optional(),
 allowedCohortIds:z.array(z.string().uuid()).max(100)
  .refine(ids=>new Set(ids).size===ids.length,"Select each eligible batch only once.").optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true})
  .transform(value=>new Date(value).toISOString()),
 reason:z.string().trim().min(10).max(1000),
 title:z.string().trim().min(2).max(200),description:z.string().trim().min(1).max(20000),
 locations:z.array(z.string().trim().min(1).max(120)).max(20),
 openings:z.number().int().positive().max(100000).nullable(),
 minimumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
 maximumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
 fixedCtcLpa:z.number().min(0).max(1000).nullable(),
 variableCtcLpa:z.number().min(0).max(1000).nullable(),
 stipendPerMonthInr:z.number().int().min(0).max(10000000).nullable(),
 isDream:z.boolean(),
}).strict();
export type TpoDriveEditInput=z.infer<typeof tpoDriveEditSchema>;
export function evaluateTpoDriveEdit(status:string,seasonStatus:string|null,input:TpoDriveEditInput){
 if(!["DRAFT","PUBLISHED"].includes(status)||seasonStatus!=="ACTIVE")return "READ_ONLY" as const;
 if(status==="PUBLISHED"&&input.applicationDeadline===null)return "INVALID_DEADLINE" as const;
 if(input.minimumAnnualCtcInr!==null&&input.maximumAnnualCtcInr!==null&&
   input.maximumAnnualCtcInr<input.minimumAnnualCtcInr)return "INVALID_CTC" as const;
 if(input.maximumAnnualCtcInr!==null&&
   (input.fixedCtcLpa??0)+(input.variableCtcLpa??0)>input.maximumAnnualCtcInr/100000)
   return "INVALID_CTC" as const;
 if(new Set(input.locations.map(x=>x.toLowerCase())).size!==input.locations.length)
   return "DUPLICATE_LOCATION" as const;
 return "ALLOW" as const;
}
