import Link from "next/link";
import { Tabs } from "@/components/ui/tabs";

const tabs = [
 {label:"Overview",suffix:""},
 {label:"Applications",suffix:"/applications"},
 {label:"Schedule",suffix:"/schedule"},
 {label:"Settings",suffix:"/settings"},
] as const;

/** Consistent four-tab Super Admin drive navigation; scoped pages authorize access. */
export function SuperAdminDriveTabs({jobId,active}:{
 jobId:string;active:"Overview"|"Applications"|"Schedule"|"Settings";
}) {
 const base="/admin/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="space-y-3">
  <nav aria-label="Drive breadcrumb" className="flex flex-wrap gap-2 text-sm">
   <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/admin/placements/drives">Drives</Link>
   <span aria-hidden="true">›</span><span>Drive workspace</span>
  </nav>
  <Tabs ariaLabel="Drive tabs" renderPanel={false} value={active}
   items={tabs.map(tab => ({value:tab.label,label:tab.label,href:base+tab.suffix}))} />
 </div>;
}
