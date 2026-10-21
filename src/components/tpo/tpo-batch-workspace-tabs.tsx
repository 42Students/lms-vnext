import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";

const primary = [
 {slug:"students",label:"Students"},{slug:"rules",label:"Rules"},{slug:"history",label:"History"},
] as const;
const secondary = [
 {slug:"",label:"Overview"},{slug:"classes",label:"Classes"},
 {slug:"registrations",label:"Registrations"},
] as const;
type TabSlug=typeof primary[number]["slug"]|typeof secondary[number]["slug"];
/** Preserve three legacy primary tabs, keeping vNext role/workspace pages reachable. */
export function TpoBatchWorkspaceTabs({batchId,active,students}:{
 batchId:string;active:TabSlug;students?:number;
}){
 const prefix="/tpo/batches/"+encodeURIComponent(batchId);
 return <div className="min-w-0 space-y-2">
  <Tabs ariaLabel="Batch eligibility tabs" value={active} renderPanel={false}
   items={primary.map(tab=>({
    value:tab.slug,label:tab.label,
    count:tab.slug==="students"?students:undefined,
    href:prefix+"/"+tab.slug,
   }))}/>
  <nav aria-label="Additional batch workspaces" className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs">
   {secondary.map(tab=><Link key={tab.slug||"overview"} href={prefix+(tab.slug?"/"+tab.slug:"")}
    aria-current={active===tab.slug?"page":undefined}
    className={"inline-flex min-h-9 items-center font-semibold underline underline-offset-4 "+
     (active===tab.slug?"text-primary-text":"text-muted-foreground hover:text-primary-text")}>
    {tab.label}
   </Link>)}
  </nav>
 </div>;
}
