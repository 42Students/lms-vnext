import {z} from "zod";
import {
  createProjectInstanceInputSchema,
  normalizeLegacyProjectBlueprint,
  projectTemplateBlueprintSchema,
} from "./validation";

/** A boundary for explicitly imported old-LMS projects. A numeric ID by
 * itself is never an authorization grant: the caller supplies a trusted,
 * selected-college crosswalk before calling the normal scoped create service.
 * The service must still re-check memberships and the pinned template.
 */
const legacyId=z.number().int().positive().safe();
const legacyInput=z.object({
  id:legacyId,
  collegeId:legacyId,
  templateId:legacyId.nullable().optional(),
  classId:legacyId.nullable().optional(),
  mentorId:legacyId.nullable().optional(),
  learnerIds:z.array(legacyId).max(500).default([]),
  title:z.string().trim().min(1).max(160),
  slug:z.string().trim().max(160).optional(),
  summary:z.string().trim().max(2000).nullable().optional(),
  phase:z.string().trim().max(120).nullable().optional(),
  progressPercent:z.number().int().min(0).max(100).default(0),
  blocker:z.string().trim().max(4000).nullable().optional(),
  nextAction:z.string().trim().max(4000).nullable().optional(),
  dueLabel:z.string().trim().max(80).nullable().optional(),
  status:z.string().default("PLANNED"),
  blueprint:z.unknown().optional(),
}).passthrough();

type LegacyIdMaps={
  selectedCollegeId:string;
  legacyCollegeId:number;
  templates:ReadonlyMap<number,string>;
  sections:ReadonlyMap<number,string>;
  mentors:ReadonlyMap<number,string>;
  learners:ReadonlyMap<number,string>;
  /** Explicit default assigned template for historical template-less projects.
   * The importer may not invent or silently publish a tenant template.
   */
  templateForManualWorkspace?:string;
};

function slugOf(title:string,original:string|undefined,legacyId:number){
  const source=(original?.trim()||title).toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
    .replace(/^-|-$/g,"");
  const prefix=(source||"project").slice(0,65).replace(/-$/g,"");
  return prefix+"-"+legacyId;
}

export type LegacyWorkspaceImportPlan={
  ok:boolean;
  errors:string[];
  input:z.infer<typeof createProjectInstanceInputSchema>|null;
  legacy:{
    id:number;collegeId:number;templateId:number|null;
    classId:number|null;status:string;slug:string|null;
  }|null;
  normalizedBlueprint:unknown|null;
};

export function planLegacyProjectWorkspaceImport(
  raw:unknown,maps:LegacyIdMaps,
):LegacyWorkspaceImportPlan{
  const parsed=legacyInput.safeParse(raw);
  if(!parsed.success){
    return {ok:false,errors:parsed.error.issues.map(issue=>
      issue.path.join(".")+": "+issue.message),
      input:null,legacy:null,normalizedBlueprint:null};
  }
  const data=parsed.data;
  const errors:string[]=[];
  if(data.collegeId!==maps.legacyCollegeId){
    errors.push("College ID does not match the selected college");
  }
  const selected=maps.selectedCollegeId;
  if(!z.string().uuid().safeParse(selected).success){
    errors.push("Selected college must be a UUID");
  }
  const templateId=data.templateId===undefined||data.templateId===null?
    maps.templateForManualWorkspace:maps.templates.get(data.templateId);
  if(!templateId){
    errors.push(data.templateId?"Template ID has no assigned vNext mapping":
      "Assign a published template before importing a manual workspace");
  }
  const sectionId=data.classId?maps.sections.get(data.classId):undefined;
  if(data.classId&&!sectionId)errors.push("Class ID has no matching active section");
  const primaryMentorMembershipId=data.mentorId?maps.mentors.get(data.mentorId):undefined;
  if(data.mentorId&&!primaryMentorMembershipId){
    errors.push("Mentor ID has no active college membership");
  }
  const learnerMembershipIds:string[]=[];
  for(const id of data.learnerIds){
    const mapped=maps.learners.get(id);
    if(!mapped)errors.push("Learner ID "+id+" has no active college membership");
    else learnerMembershipIds.push(mapped);
  }
  if(new Set(learnerMembershipIds).size!==learnerMembershipIds.length){
    errors.push("One vNext learner membership was mapped more than once");
  }
  // A completed or archived old workspace must be imported as PLANNED and
  // reconciled by an authorized lifecycle action, not made active silently.
  const initialStatus=data.status==="ACTIVE"?"ACTIVE":"PLANNED";
  const candidate={
    collegeId:selected,templateId:templateId??"",
    slug:slugOf(data.title,data.slug,data.id),
    title:data.title,
    summary:data.summary??undefined,
    sectionId,primaryMentorMembershipId,learnerMembershipIds,
    phase:data.phase??undefined,progressPercent:data.progressPercent,
    blocker:data.blocker??undefined,nextAction:data.nextAction??undefined,
    dueLabel:data.dueLabel??undefined,initialStatus,
  };
  const validated=createProjectInstanceInputSchema.safeParse(candidate);
  if(!validated.success){
    errors.push(...validated.error.issues.map(issue=>
      issue.path.join(".")+": "+issue.message));
  }
  const normalizedBlueprint=data.blueprint===undefined?null:
    normalizeLegacyProjectBlueprint(data.blueprint);
  if(normalizedBlueprint!==null){
    const checked=projectTemplateBlueprintSchema.safeParse(normalizedBlueprint);
    if(!checked.success){
      errors.push(...checked.error.issues.map(issue=>
        "blueprint."+issue.path.join(".")+": "+issue.message));
    }
  }
  return {
    ok:errors.length===0,
    errors,
    input:errors.length===0&&validated.success?validated.data:null,
    legacy:{id:data.id,collegeId:data.collegeId,
      templateId:data.templateId??null,classId:data.classId??null,
      status:data.status,slug:data.slug??null},
    normalizedBlueprint,
  };
}
