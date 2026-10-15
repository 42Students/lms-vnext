import {z} from "zod";
const filters=z.enum(["ALL","NOT_STARTED","IN_PROGRESS","COMPLETED","UNMEASURED"]).catch("ALL");
export type LearnerCourseProgressFilter=z.infer<typeof filters>;
type Card={summary:{itemsCompleted:number;itemsTotal:number}};
/** Progress classes are derived from real tracked item counts, not a guessed percentage. */
export function learnerCourseMatchesProgress(row:Card,input:unknown):boolean{
 const filter=filters.parse(input);
 const {itemsCompleted,itemsTotal}=row.summary;
 if(filter==="ALL")return true;
 if(filter==="UNMEASURED")return itemsTotal===0;
 if(itemsTotal<=0)return false;
 if(filter==="NOT_STARTED")return itemsCompleted===0;
 if(filter==="COMPLETED")return itemsCompleted>=itemsTotal;
 return itemsCompleted>0 && itemsCompleted<itemsTotal;
}
