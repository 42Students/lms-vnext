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
 const raw=value&&typeof value==="object"&&!Array.isArray(value)
  ?value as Record<string,unknown>:{};
 const list=(data:unknown):string[]=>Array.isArray(data)
  ?data.filter((item):item is string=>typeof item==="string")
  :typeof data==="string"?data.split(/\\r?\\n/).map(s=>s.trim()).filter(Boolean):[];
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
  deliverables:[],completionConditions:[],personas:[],
 };
}
/** A planned draft can be empty; active/published projects cannot be cleared
 * to a zero-deliverable brief. Match the legacy field validation literally. */
export function publishedWorkspaceBriefError(brief:WorkspaceBrief):string|null {
 return brief.deliverables.some(item=>item.trim().length>0)
  ?null:"Add at least one deliverable.";
}
