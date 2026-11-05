import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
/** COL-placements-18: College Admin routes only—never link College Admin into TPO-gated reports. */
export function CollegeReportNavigation(){
 const links=[
  {href:"/college/hiring-dashboard",label:"Hiring funnel and companies"},
  {href:"/college/placements/readiness-by-department",label:"By department"},
  {href:"/college/placements/retention",label:"Data retention report"},
  {href:"/college/placements/student-lookup",label:"Student placement lookup"},
 ] as const;
 return <nav aria-label="College placement reports" className="space-y-2 print:hidden">
  <Heading level={2}>Placement reports</Heading>
  <p className="text-xs text-muted-foreground">These reports use College Admin access and contain only data recorded for your college.</p>
  <div className="flex flex-wrap gap-3">
   {links.map(link=><ButtonLink variant="secondary" key={link.href} href={link.href}>
     {link.label}</ButtonLink>)}
  </div>
 </nav>;
}
