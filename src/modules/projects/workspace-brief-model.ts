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
 // Historic workspaces sometimes carry the full, untouched template overview
 // in an `overview` map, while vNext writes five native fields at top level.
 // A top-level explicit empty value wins over inherited template defaults.
 const nested=envelope.overview&&typeof envelope.overview==="object"&&
  !Array.isArray(envelope.overview)
  ?envelope.overview as Record<string,unknown>:{};
 const raw={...nested,...envelope};
 const list=(data:unknown):string[]=>Array.isArray(data)
  ?data.filter((item):item is string=>typeof item==="string")
  :typeof data==="string"?data.split(/\r?\n/).map(s=>s.trim()).filter(Boolean):[];
 const fallback={
  goal:typeof raw.goal==="string"?raw.goal:"",
  description:typeof raw.description==="string"?raw.description:"",
  deliverables:list(raw.deliverables),
  completionConditions:list(raw.completionConditions??raw.definitionOfDone),
  personas:list(raw.personas),
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
 const nested=source.overview&&typeof source.overview==="object"&&
  !Array.isArray(source.overview)?source.overview as Record<string,unknown>:{};
 const original={...nested,...source};
 const opaqueFacts=Object.fromEntries(Object.entries(original).filter(([key])=>
  !["goal","description","deliverables","definitionOfDone","completionConditions",
    "personas","overview"].includes(key)));
 return {brief:parseWorkspaceBrief(original),opaqueFacts};
}
/** A planned draft can be empty; active/published projects cannot be cleared
 * to a zero-deliverable brief. Match the legacy field validation literally. */
export function publishedWorkspaceBriefError(brief:WorkspaceBrief):string|null {
 return brief.deliverables.some(item=>item.trim().length>0)
  ?null:"Add at least one deliverable.";
}
