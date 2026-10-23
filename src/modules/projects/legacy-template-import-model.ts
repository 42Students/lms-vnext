import {createHash} from "node:crypto";
import {z} from "zod";
import {normalizeLegacyProjectBlueprint,projectTemplateBlueprintSchema,
 type ProjectTemplateBlueprint} from "./validation";

/** Read-only import crosswalk. Legacy IDs and lifecycle strings are provenance,
 * not a substitute for current template permissions or publication actions.
 * The caller must supply a valid vNext actor and selected-college assignment.
 */
const oldId=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const oldDate=z.union([z.string().trim().max(40),z.null()]).optional();
const template=z.object({
 id:oldId,
 slug:z.string().trim().min(1).max(80),
 title:z.string().trim().min(1).max(160),
 summary:z.string().max(4000).nullable().optional(),
 courseLabel:z.string().max(160).nullable().optional(),
 phase:z.string().max(80).nullable().optional(),
 status:z.string().trim().min(1).max(40).default("IN_PROGRESS"),
 lifecycleStatus:z.enum(["DRAFT","PUBLISHED","ARCHIVED"]).default("DRAFT"),
 templateVersion:z.number().int().min(1).max(100000).default(1),
 publishedAt:oldDate,
 archivedAt:oldDate,
 organizationId:oldId.nullable().optional(),
 collegeId:oldId.nullable().optional(),
 overview:z.unknown().nullable().optional(),
 sprints:z.unknown().nullable().optional(),
 tasks:z.unknown().nullable().optional(),
 resources:z.unknown().nullable().optional(),
 delivery:z.unknown().nullable().optional(),
 meetings:z.unknown().nullable().optional(),
 activity:z.unknown().nullable().optional(),
}).passthrough();

function localTimestamp(raw:string|null|undefined):string|null{
 if(!raw)return null;
 // Old JVM LocalDateTime values have no time zone. Match the source college
 // convention explicitly rather than interpreting in the migration host zone.
 const local=raw.match(/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d)(?::(\d\d))?(?:\.\d{1,9})?$/);
 const full=local?local[1]+"T"+local[2]+":"+(local[3]??"00")+"+05:30":raw;
 const parsed=new Date(full);
 return Number.isFinite(parsed.getTime())?parsed.toISOString():null;
}

/** Stable NSRIT UUIDv5 identity used by the historical superadmin redirect.
 * Global template scope is intentional: a legacy college ID never grants
 * membership in an unrelated current college.
 */
export function importedProjectTemplateUuid(legacyId:number):string{
 const parsed=oldId.parse(legacyId);
 const namespace=Buffer.from("6f1c2a524e0b5c539a710d5b7a3e91c4","hex");
 const digest=createHash("sha1").update(namespace).update(
  Buffer.from("project_templates:project_template:"+parsed,"utf8")).digest();
 const bytes=Buffer.from(digest.subarray(0,16));
 bytes[6]=((bytes[6] ?? 0)&0x0f)|0x50;
 bytes[8]=((bytes[8] ?? 0)&0x3f)|0x80;
 const hex=bytes.toString("hex");
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),
  hex.slice(16,20),hex.slice(20)].join("-");
}

export type LegacyProjectTemplateImportPlan={
 ok:boolean;
 errors:readonly string[];
 templateId:string|null;
 legacyId:number|null;
 catalog:{
  slug:string;title:string;summary:string|null;
  courseLabel:string|null;phase:string|null;
  lifecycleStatus:"DRAFT"|"PUBLISHED"|"ARCHIVED";workflowStatus:string;
  sourceVersion:number;sourcePublishedAt:string|null;sourceArchivedAt:string|null;
 }|null;
 blueprint:ProjectTemplateBlueprint|null;
 /** Source-only snapshot for project_template_legacy_events.snapshot. */
 sourceSnapshot:Record<string,unknown>|null;
 /** Imported publish states are NEVER granted by raw JSON alone. */
 requiresManualPublicationReview:boolean;
};

/** Plan the exact seven legacy JSON sections without inventing release links
 * or quietly dropping unknown fields. Invalid blueprints stay historical only.
 * The import worker must persist a snapshot with timestamp/status provenance
 * before publishing a verified and author-approved vNext version.
 */
export function planLegacyProjectTemplateImport(raw:unknown):LegacyProjectTemplateImportPlan{
 const parsed=template.safeParse(raw);
 if(!parsed.success)return {
  ok:false,errors:parsed.error.issues.map(issue=>issue.path.join(".")+": "+issue.message),
  templateId:null,legacyId:null,catalog:null,blueprint:null,
  sourceSnapshot:null,requiresManualPublicationReview:true,
 };
 const data=parsed.data;
 const errors:string[]=[];
 const publishedAt=localTimestamp(data.publishedAt);
 const archivedAt=localTimestamp(data.archivedAt);
 if(data.publishedAt&&!publishedAt)errors.push("publishedAt: invalid legacy timestamp");
 if(data.archivedAt&&!archivedAt)errors.push("archivedAt: invalid legacy timestamp");
 const overview=data.overview&&typeof data.overview==="object"&&!Array.isArray(data.overview)
   ? data.overview : {};
 // The legacy project UI accepted additional JSON; preserving it in the source
 // event guarantees that rejected keys are not silently imported as executable
 // releases/tasks. A blueprint that fails strict schema validation is inert.
 const candidate=normalizeLegacyProjectBlueprint({
  overview,
  releases:[],
  sprints:data.sprints??[],
  tasks:data.tasks??[],
  resources:data.resources??[],
  delivery:data.delivery??undefined,
  meetings:data.meetings??undefined,
  activity:data.activity??undefined,
  legacy:{
   courseLabel:data.courseLabel??null,phase:data.phase??null,
   status:data.status,lifecycleStatus:data.lifecycleStatus,
  },
 });
 const checked=projectTemplateBlueprintSchema.safeParse(candidate);
 if(!checked.success)errors.push(...checked.error.issues.map(issue=>
  "blueprint."+issue.path.join(".")+": "+issue.message));
 return {
  ok:errors.length===0,
  errors,templateId:importedProjectTemplateUuid(data.id),legacyId:data.id,
  catalog:{
   slug:data.slug,title:data.title,summary:data.summary??null,
   courseLabel:data.courseLabel??null,phase:data.phase??null,
   lifecycleStatus:data.lifecycleStatus,workflowStatus:data.status,
   sourceVersion:data.templateVersion,
   sourcePublishedAt:publishedAt,sourceArchivedAt:archivedAt,
  },
  blueprint:checked.success?checked.data:null,
  // The source snapshot is audit-only, never trusted as current active rules.
  sourceSnapshot:{...data},
  requiresManualPublicationReview:true,
 };
}
