import {z} from "zod";
export const learnerApplicationUrlSchema=z.object({
q:z.string().trim().max(100).optional().default(""),
view:z.enum(["all","progress","completed"]).optional().default("all"),
stage:z.string().max(64).optional().default("all"),
sort:z.enum(["activity","company","oldest","stage"]).optional().default("activity"),
page:z.string().regex(/^(?:[1-9][0-9]{0,3}|10000)$/).transform(Number).optional().default(1),
applicationId:z.string().uuid().optional(),
}).strict();
export function readLearnerApplicationUrl(raw:string){
const params=new URLSearchParams(raw.startsWith("?")?raw.slice(1):raw);
const keys=[...params.keys()];
if(new Set(keys).size!==keys.length)return learnerApplicationUrlSchema.parse({});
const result=learnerApplicationUrlSchema.safeParse(Object.fromEntries(params.entries()));
return result.success?result.data:learnerApplicationUrlSchema.parse({});
}
export function updateLearnerApplicationUrl(current:string,changes:Record<string,string|null>){
const allowed=["q","view","stage","sort","page","applicationId"];
const query=new URLSearchParams(),old=new URLSearchParams(current);
for(const key of allowed){const v=old.get(key);if(v)query.set(key,v);}
for(const [key,value] of Object.entries(changes)){
if(!allowed.includes(key))continue;
if(!value||value==="all")query.delete(key);else query.set(key,value);
}
if(!Object.prototype.hasOwnProperty.call(changes,"page"))query.delete("page");
return learnerApplicationUrlSchema.safeParse(Object.fromEntries(query.entries())).success?query.toString():"";
}
