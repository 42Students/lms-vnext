import {z} from "zod";
export const tpoDriveEditSchema=z.object({
 confirmed:z.literal(true),expectedUpdatedAt:z.iso.datetime({offset:true})
  .transform(value=>new Date(value).toISOString()),
 reason:z.string().trim().min(10).max(1000),
 title:z.string().trim().min(2).max(200),description:z.string().trim().min(1).max(20000),
 locations:z.array(z.string().trim().min(1).max(120)).max(20),
 openings:z.number().int().positive().max(100000).nullable(),
 minimumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
 maximumAnnualCtcInr:z.number().int().min(0).max(100000000).nullable(),
}).strict();
export type TpoDriveEditInput=z.infer<typeof tpoDriveEditSchema>;
export function evaluateTpoDriveEdit(status:string,seasonStatus:string|null,input:TpoDriveEditInput){
 if(status!=="DRAFT"||seasonStatus!=="ACTIVE")return "READ_ONLY" as const;
 if(input.minimumAnnualCtcInr!==null&&input.maximumAnnualCtcInr!==null&&
   input.maximumAnnualCtcInr<input.minimumAnnualCtcInr)return "INVALID_CTC" as const;
 if(new Set(input.locations.map(x=>x.toLowerCase())).size!==input.locations.length)
   return "DUPLICATE_LOCATION" as const;
 return "ALLOW" as const;
}
