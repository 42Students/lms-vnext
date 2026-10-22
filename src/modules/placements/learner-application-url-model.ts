import {z} from "zod";
export const learnerApplicationUrlSchema=z.object({
q:z.string().trim().max(100).optional().default(""),
view:z.enum(["all","progress","completed"]).optional().default("progress"),
stage:z.string().max(64).optional().default("all"),
sort:z.enum(["activity","company","oldest","stage"]).optional().default("activity"),
page:z.string().regex(/^(?:[1-9][0-9]{0,3}|10000)$/).transform(Number).optional().default(1),
applicationId:z.string().uuid().optional(),
}).strict();
export function readLearnerApplicationUrl(raw:string){
const params=new URLSearchParams(raw.startsWith("?")?raw.slice(1):raw);
const allowed=["q","view","stage","sort","page","applicationId"] as const;
const safe:Record<string,string>={};
for(const key of allowed){
 const values=params.getAll(key);
 if(values.length!==1)continue;
 // Validate each independent facet without losing other valid selections.
 const candidate=values[0];
 if(candidate!==undefined&&learnerApplicationUrlSchema.safeParse({[key]:candidate}).success)safe[key]=candidate;
}
// Legacy links used ?show=live|ended|all; an application-specific
// notice link must not disappear behind a narrower saved view.
const showValues=params.getAll("show");
if(!("view" in safe)&&showValues.length===1){
 const show=showValues[0];
 safe["view"]=show==="all"?"all":show==="ended"?"completed":"progress";
}
if(safe["applicationId"])safe["view"]="all";
return learnerApplicationUrlSchema.parse(safe);
}
export function updateLearnerApplicationUrl(current:string,changes:Record<string,string|null>){
const allowed=["q","view","stage","sort","page","applicationId"];
const query=new URLSearchParams(),old=new URLSearchParams(current);
for(const key of allowed){const values=old.getAll(key);if(values.length===1&&values[0]&&learnerApplicationUrlSchema.safeParse({[key]:values[0]}).success)query.set(key,values[0]);}
// Unlike the old shallow router.replace({query:{show}}), keep bounded
// search, sorting and selected application deep links when switching tabs.
// This intentional vNext behavior avoids losing a notification destination.
for(const [key,value] of Object.entries(changes)){
if(!allowed.includes(key))continue;
if(!value||(value==="all"&&key!=="view"))query.delete(key);
else if(learnerApplicationUrlSchema.safeParse({[key]:value}).success)query.set(key,value);
else query.delete(key);
}
if(!Object.prototype.hasOwnProperty.call(changes,"page"))query.delete("page");
if(query.has("applicationId"))query.set("view","all");
return learnerApplicationUrlSchema.safeParse(Object.fromEntries(query.entries())).success?query.toString():"";
}
