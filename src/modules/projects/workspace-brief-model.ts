import {z} from "zod";
export const workspaceBriefSchema=z.strictObject({
 goal:z.string().trim().max(2000),
 description:z.string().trim().max(4000),
 deliverables:z.array(z.string().trim().min(1).max(500)).max(50),
 completionConditions:z.array(z.string().trim().min(1).max(500)).max(50),
 personas:z.array(z.string().trim().min(1).max(500)).max(50),
});
export const updateWorkspaceBriefSchema=z.strictObject({
 brief:workspaceBriefSchema,
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
export type WorkspaceBrief=z.infer<typeof workspaceBriefSchema>;
/** Drafts may be incomplete. Published, editable workspaces cannot lose all deliverables.
 * Validate by lifecycle state, not by the role of the person editing the brief. */
export function workspaceBriefRequiresDeliverables(status:string):boolean {
 return status==="ACTIVE";
}
export const emptyWorkspaceBrief:WorkspaceBrief={
 goal:"",description:"",deliverables:[],completionConditions:[],personas:[],
};
/** Translate stored legacy overview facts to the five editable vNext fields.
 * Opaque map keys are preserved by workspace-brief-service on update; they
 * must not be sent as user-editable permissions or silently overwritten.
 */
export function parseWorkspaceBrief(value:unknown):WorkspaceBrief {
 const envelope=value&&typeof value==="object"&&!Array.isArray(value)
  ?value as Record<string,unknown>:{};
 // Tenant identity is always determined by the authorized database query,
 // not by historical overview metadata. Metadata is ignored as authority;
 // authored brief fields remain available during trusted legacy imports.
 // A trusted imported overview can carry historic tenant metadata. Never
 // treat those keys as authority, but do not erase its actual brief fields.
 // The strict editor schema excludes metadata from client writes.
 // Historic workspaces sometimes carry the full, untouched template overview
 // in an `overview` map, while vNext writes five native fields at top level.
 // A top-level explicit empty value wins over inherited template defaults.
 const nested=envelope["overview"]&&typeof envelope["overview"]==="object"&&
  !Array.isArray(envelope["overview"])
  ?envelope["overview"] as Record<string,unknown>:{};
 // Tenant identifiers and secret fields are not part of an authored brief.
 // Reject injected envelopes and always return fresh independent arrays.
 const forbidden=["collegeId","organizationId","membershipId","secret"];
 if(forbidden.some(key=>Object.hasOwn(envelope,key)||Object.hasOwn(nested,key))){
  // Historic persisted envelopes can wrap authored fields inside overview.
  // Ignore tenant metadata entirely, and never trust forged top-level fields.
  const authored=["goal","description","deliverables","definitionOfDone",
   "completionConditions","personas"];
  const clean=Object.fromEntries(Object.entries(nested).filter(([key])=>authored.includes(key)));
  return Object.keys(clean).length?parseWorkspaceBrief(clean):
   {goal:"",description:"",deliverables:[],completionConditions:[],personas:[]};
 }
 const raw={...nested,...envelope};
 const list=(data:unknown):string[]=>Array.isArray(data)
  ?data.filter((item):item is string=>typeof item==="string")
  :typeof data==="string"?data.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):[];
 const fallback={
  goal:typeof raw["goal"]==="string"?raw["goal"]:"",
  description:typeof raw["description"]==="string"?raw["description"]:"",
  deliverables:list(raw["deliverables"]),
  // An explicitly cleared native field, including a historic null, wins over
  // inherited definitionOfDone. Absence alone activates the old alias.
  completionConditions:list("completionConditions" in raw?raw["completionConditions"]:raw["definitionOfDone"]),
  personas:list(raw["personas"]),
 };
 const result=workspaceBriefSchema.safeParse(fallback);
 // Return fresh nested arrays even for malformed historical records.
 return result.success?result.data:{
  goal:fallback.goal.slice(0,2000),description:fallback.description.slice(0,4000),
  deliverables:fallback.deliverables.map(s=>s.trim().slice(0,500)).filter(Boolean).slice(0,50),
  completionConditions:fallback.completionConditions.map(s=>s.trim().slice(0,500)).filter(Boolean).slice(0,50),
  personas:fallback.personas.map(s=>s.trim().slice(0,500)).filter(Boolean).slice(0,50),
 };
}
/** Preserve legacy overviewFactsRef keys as opaque DB-sourced values.
 * Never accept opaque fields from the editor in an update request. This helper
 * is only for historical full-copy import/migration and must be used with
 * a separately authorized persisted source, not unchecked client JSON.
 */
export function translateLegacyWorkspaceOverview(value:unknown):{
 brief:WorkspaceBrief;opaqueFacts:Record<string,unknown>;
}{
 const source=value&&typeof value==="object"&&!Array.isArray(value)
  ?value as Record<string,unknown>:{};
 const nested=source["overview"]&&typeof source["overview"]==="object"&&
  !Array.isArray(source["overview"])?source["overview"] as Record<string,unknown>:{};
 const original={...nested,...source};
 const opaqueFacts=Object.fromEntries(Object.entries(original).filter(([key])=>
  !["goal","description","deliverables","definitionOfDone","completionConditions",
    "personas","overview","collegeId","organizationId","membershipId"].includes(key)));
 return {brief:parseWorkspaceBrief(original),opaqueFacts};
}
/** A planned draft can be empty; active/published projects cannot be cleared
 * to a zero-deliverable brief. Match the legacy field validation literally. */
export function publishedWorkspaceBriefError(brief:WorkspaceBrief):string|null {
 return brief.deliverables.some(item=>item.trim().length>0)
  ?null:"Add at least one deliverable.";
}
