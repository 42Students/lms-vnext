import {z} from "zod";
export type TpoBatchFacetState="In placements"|"Not started"|"Finished";
const states=["In placements","Not started","Finished"] as const;
const query=z.object({
 states:z.array(z.enum(states)).max(3),
 programs:z.array(z.string().trim().min(1).max(100)).max(50),
 departments:z.array(z.string().trim().min(1).max(100)).max(50),
 finalYears:z.array(z.coerce.number().int().min(1900).max(2200)).max(40),
}).strict();
export type TpoBatchFacetQuery=z.infer<typeof query>;
export type TpoBatchFacetRow={program:string;department:string;endYear:number|null;
 placementState:TpoBatchFacetState};
function values(raw:unknown):unknown[]{
 if(raw===undefined||raw===null||raw==="")return [];
 return Array.isArray(raw)?raw:[raw];
}
export function parseTpoBatchFacetQuery(raw:{
 facetState?:unknown;facetProgram?:unknown;facetDepartment?:unknown;facetFinalYear?:unknown;
},available:readonly {program:string;department:string;endYear:number|null}[]){
 const selected=query.safeParse({
  states:values(raw.facetState),programs:values(raw.facetProgram),
  departments:values(raw.facetDepartment),finalYears:values(raw.facetFinalYear),
 });
 if(!selected.success)return selected;
 const allowedPrograms=new Set(available.map(row=>row.program));
 const allowedDepartments=new Set(available.map(row=>row.department));
 const allowedYears=new Set(available.flatMap(row=>row.endYear===null?[]:[row.endYear]));
 if(selected.data.programs.some(s=>!allowedPrograms.has(s))||
  selected.data.departments.some(s=>!allowedDepartments.has(s))||
  selected.data.finalYears.some(y=>!allowedYears.has(y))){
  return query.safeParse({states:["INVALID"],programs:[],departments:[],finalYears:[]});
 }
 return {success:true as const,data:{
  states:[...new Set(selected.data.states)],
  programs:[...new Set(selected.data.programs)],
  departments:[...new Set(selected.data.departments)],
  finalYears:[...new Set(selected.data.finalYears)],
 }};
}
export function filterTpoBatchFacets<T extends TpoBatchFacetRow>(rows:readonly T[],filters:TpoBatchFacetQuery):T[]{
 return rows.filter(row=>
  (!filters.states.length||filters.states.includes(row.placementState))&&
  (!filters.programs.length||filters.programs.includes(row.program))&&
  (!filters.departments.length||filters.departments.includes(row.department))&&
  (!filters.finalYears.length||(row.endYear!==null&&filters.finalYears.includes(row.endYear))));
}
export function tpoBatchFacetCount<T extends TpoBatchFacetRow>(rows:readonly T[],query:TpoBatchFacetQuery){
 return filterTpoBatchFacets(rows,query).length;
}
export function tpoBatchFacetQueryPairs(query:TpoBatchFacetQuery):[string,string][]{
 return [
  ...query.states.map(value=>["facetState",value] as [string,string]),
  ...query.programs.map(value=>["facetProgram",value] as [string,string]),
  ...query.departments.map(value=>["facetDepartment",value] as [string,string]),
  ...query.finalYears.map(value=>["facetFinalYear",String(value)] as [string,string]),
 ];
}
