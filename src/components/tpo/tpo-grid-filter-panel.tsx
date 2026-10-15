"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
export type TpoFilterField = { key: string; label: string; options: readonly { value: string; label: string }[] };
export function TpoGridFilterPanel({ fields }: { fields: readonly TpoFilterField[] }) {
 const router=useRouter(); const pathname=usePathname(); const query=useSearchParams();
 function update(key:string,value:string){ const params=new URLSearchParams(query.toString()); if(value)params.set("filter."+key,value);else params.delete("filter."+key);params.delete("page");router.replace(pathname+"?"+params.toString()); }
 return <aside aria-label="Grid filters" className="w-full min-w-0 space-y-3 rounded-lg border border-border bg-surface p-3">
  <h2 className="font-semibold">Filters</h2>
  {fields.map(field=><label key={field.key} className="block text-sm">{field.label}
  <select className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-2" value={query.get("filter."+field.key)??""} onChange={event=>update(field.key,event.target.value)}>
   <option value="">All</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}
  </select></label>)}
 </aside>;
}
