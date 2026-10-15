"use client";
import {useRouter,usePathname,useSearchParams} from "next/navigation";
import {updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
export type TpoFilterField={key:string;label:string;urlKey?:string;options:readonly {value:string;label:string}[]};
export function TpoGridFilterPanel({fields}:{fields:readonly TpoFilterField[]}){
 const router=useRouter(),pathname=usePathname(),query=useSearchParams();
 function update(field:TpoFilterField,value:string){
  const key=field.urlKey??"filter."+field.key;
  const params=updateTpoGridQuery(new URLSearchParams(query.toString()),{[key]:value});
  router.replace(pathname+(params.size?"?"+params.toString():""));
 }
 return <aside aria-label="Grid filters" className="w-full min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3">
  <h2 className="font-semibold">Filters</h2>
  {fields.map(field=><label key={field.key} className="block text-sm">{field.label}
   <select className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-2" value={query.get(field.urlKey??"filter."+field.key)??""} onChange={event=>update(field,event.target.value)}>
    <option value="">All</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
   </select>
  </label>)}
 </aside>;
}
