import Link from "next/link";
const tabs=[
 {label:"Overview",suffix:""},
 {label:"Applications",suffix:"/applications"},
 {label:"Schedule",suffix:"/schedule"},
 {label:"Settings",suffix:"/settings"},
] as const;
/** Consistent four-tab Super Admin drive navigation; scoped pages perform server authorization. */
export function SuperAdminDriveTabs({jobId,active}:{
 jobId:string;active:"Overview"|"Applications"|"Schedule"|"Settings";
}){
 const base="/admin/placements/jobs/"+encodeURIComponent(jobId);
 return <div className="space-y-3">
  <nav aria-label="Drive breadcrumb" className="flex flex-wrap gap-2 text-sm">
   <Link className="font-semibold text-primary-text underline" href="/admin/placements/drives">Drives</Link>
   <span aria-hidden="true">›</span><span>Drive workspace</span>
  </nav>
  <nav aria-label="Drive tabs" className="flex flex-wrap gap-2">
    {tabs.map(tab=><Link key={tab.label} href={base+tab.suffix}
       aria-current={tab.label===active?"page":undefined}
       className={"inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold "+
        (tab.label===active?"border-primary bg-primary-subtle text-primary-text":"border-border bg-surface text-body")}>
       {tab.label}</Link>)}
  </nav>
 </div>;
}
