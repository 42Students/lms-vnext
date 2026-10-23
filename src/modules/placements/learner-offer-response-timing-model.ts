import {z} from "zod";
export const learnerOfferResponseTimingSchema=z.object({
  status:z.enum(["ISSUED","ACCEPTED","DECLINED","WITHDRAWN"]),
  expiresAt:z.string().datetime({offset:true}).nullable(),
  issuedAt:z.string().datetime({offset:true}),
}).strict();
export function learnerOfferResponseTiming(raw:unknown,snapshotNowIso:string){
  // The offer card includes extra presentation fields; validate only the
  // three timing fields against the strict boundary schema.
  const source:Record<string,unknown>=typeof raw==="object"&&raw!==null
    ? raw as Record<string,unknown> : {};
  const parsed=learnerOfferResponseTimingSchema.safeParse({
    status:source["status"],expiresAt:source["expiresAt"],issuedAt:source["issuedAt"],
  });
  if(!parsed.success)return {expired:true,canRespond:false,urgency:"INVALID" as const};
  const row=parsed.data;
  const now=Date.parse(snapshotNowIso);
  if(!Number.isFinite(now))throw new Error("Invalid server snapshot");
  const until=row.expiresAt===null?null:Date.parse(row.expiresAt)-now;
  const expired=until!==null&&until<=0;
  const canRespond=row.status==="ISSUED"&&!expired;
  return {expired,canRespond,
    urgency:row.status!=="ISSUED"?"RESOLVED" as const:
      expired?"EXPIRED" as const:
      until!==null&&until<=172800000?"SOON" as const:"NORMAL" as const,
  };
}
export function prioritizeLearnerOffers<T extends {status:"ISSUED"|"ACCEPTED"|"DECLINED"|"WITHDRAWN";expiresAt:string|null;issuedAt:string}>(items:readonly T[],snapshotNowIso:string):T[]{
  const rank=(item:T)=>{
    const t=learnerOfferResponseTiming(item,snapshotNowIso);
    return t.canRespond?0:item["status"]==="ISSUED"?1:2;
  };
  const time=(item:T)=>{
    const parsed=item["expiresAt"]?Date.parse(item["expiresAt"]):Number.POSITIVE_INFINITY;
    return Number.isNaN(parsed)?Number.POSITIVE_INFINITY:parsed;
  };
  const issued=(item:T)=>{const parsed=Date.parse(item["issuedAt"]);return Number.isFinite(parsed)?parsed:0;};
  return [...items].sort((a,b)=>rank(a)-rank(b)||
    (rank(a)===0?time(a)-time(b):issued(b)-issued(a)));
}
