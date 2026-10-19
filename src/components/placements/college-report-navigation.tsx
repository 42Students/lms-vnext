import Link from "next/link";
/** COL-placements-18: College Admin routes only—never link College Admin into TPO-gated reports. */
export function CollegeReportNavigation(){
 const links=[
  {href:"/college/hiring-dashboard",label:"Hiring funnel and companies"},
  {href:"/college/placements/readiness-by-department",label:"By department"},
  {href:"/college/placements/retention",label:"Data retention report"},
  {href:"/college/placements/student-lookup",label:"Student placement lookup"},
 ] as const;
 return <nav aria-label="College placement reports" className="space-y-2 print:hidden">
  <h2 className="font-semibold">Placement reports</h2>
  <p className="text-xs text-muted-foreground">These reports use College Admin access and contain only data recorded for your college.</p>
  <div className="flex flex-wrap gap-3">
   {links.map(link=><Link key={link.href} href={link.href}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
     {link.label}</Link>)}
  </div>
 </nav>;
}
