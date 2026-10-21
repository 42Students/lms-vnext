import "server-only";
import {sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getSuperAdminCollegeModuleAccess} from "./admin-read-service";
import {listCollegeModuleScopePage} from "./admin-descendant-rule-write";

/** Unlike the persisted-rule directory this read enumerates every academic
 * node, including inheriting nodes with no module_access_rules row.
 * Pages of 500 bound memory for large colleges; parent IDs allow the
 * client to reconstruct a stable tree across pages without guessing names.
 */
export async function readCompleteCollegeModuleTree(
 context:RequestContext,collegeId:string,page=1,
){
 const overview=await getSuperAdminCollegeModuleAccess(context,collegeId);
 if(!overview)return null;
 const academic=await listCollegeModuleScopePage(context,overview.college.id,page);
 const ids=academic.items.map(item=>item.scopeId);
 type ParentRow={scopeType:string;scopeId:string;parentType:string;parentId:string};
 const parents=ids.length?await getDb().execute<ParentRow>(sql`
  with scoped as (
   select 'DEPARTMENT'::text as "scopeType",d.id::text as "scopeId",
    'COLLEGE'::text as "parentType",d.college_id::text as "parentId"
    from departments d where d.college_id=${overview.college.id}::uuid
   union all select 'PROGRAM',p.id::text,'DEPARTMENT',p.department_id::text
    from programs p join departments d on d.id=p.department_id
    where d.college_id=${overview.college.id}::uuid
   union all select 'COHORT',c.id::text,'PROGRAM',c.program_id::text
    from cohorts c join programs p on p.id=c.program_id
    join departments d on d.id=p.department_id
    where d.college_id=${overview.college.id}::uuid
   union all select 'SECTION',s.id::text,'COHORT',s.cohort_id::text
    from sections s join cohorts c on c.id=s.cohort_id
    join programs p on p.id=c.program_id
    join departments d on d.id=p.department_id
    where d.college_id=${overview.college.id}::uuid
  )
  select "scopeType","scopeId","parentType","parentId"
   from scoped where "scopeId" in (${sql.join(ids.map(id=>sql`${id}`),sql`,`)})
 `):null;
 const byNode=new Map((parents?.rows??[]).map(parent=>[
  parent.scopeType+":"+parent.scopeId,parent,
 ]));
 return {
  root:{scopeType:"COLLEGE" as const,scopeId:overview.college.id,
   label:overview.college.name,modules:overview.modules},
  items:academic.items.map(item=>{
   const parent=byNode.get(item.scopeType+":"+item.scopeId);
   return {...item,parentScopeType:parent?.parentType??null,
    parentScopeId:parent?.parentId??null};
  }),
  page:academic.page,total:academic.total,totalPages:academic.totalPages,
  hasMore:academic.hasMore,pageSize:500,
  // The separate directory shows persisted overrides; this inventory
  // is always complete with respect to the selected academic page.
  includesInheritedOnly:true,
 };
}
