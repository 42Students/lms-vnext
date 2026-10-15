export type TpoJobTypeStatusFilter="ALL"|"ACTIVE"|"INACTIVE";
export function filterTpoJobTypes<T extends {label:string;active:boolean}>(
 types:readonly T[],search:string,status:TpoJobTypeStatusFilter,
):T[]{
 const query=search.trim().toLocaleLowerCase("en-IN");
 return types.filter(item=>(status==="ALL"||
  (status==="ACTIVE"?item.active:!item.active))&&
  (!query||item.label.toLocaleLowerCase("en-IN").includes(query)));
}
export function tpoJobTypesEmptyMessage(total:number,search:string,status:TpoJobTypeStatusFilter){
 if(total===0)return "No custom job types yet. Add one using the form above.";
 return "No "+(status==="ALL"?"":status.toLocaleLowerCase("en-IN")+" ")+"job types match"+
  (search.trim()?" that search.":" the selected filter.");
}
