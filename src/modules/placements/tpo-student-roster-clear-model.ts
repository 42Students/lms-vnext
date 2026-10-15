/** Reset only roster data filters; preserve presentation choices and never leak raw CSV state. */
export function tpoStudentRosterClearHref(pageSize:number,columns?:string){
 const params=new URLSearchParams();
 if([25,50,100].includes(pageSize)&&pageSize!==25)params.set("pageSize",String(pageSize));
 const trimmed=columns?.slice(0,800);
 if(trimmed)params.set("columns",trimmed);
 const query=params.toString();
 return "/tpo/students"+(query?"?"+query:"");
}
