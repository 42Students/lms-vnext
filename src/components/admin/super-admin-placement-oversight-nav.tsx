import Link from "next/link";
const oversightLinks=[
 {href:"/admin/placements/drives",label:"All drives"},
 {href:"/admin/placements/interviews",label:"Interviews"},
 {href:"/admin/placements/shortlisted",label:"Shortlisted"},
 {href:"/admin/placements/job-settings",label:"Job Settings"},
 {href:"/admin/placements/hiring",label:"Hiring"},
 {href:"/admin/placements/analytics",label:"Company-wise Hiring Report"},
 {href:"/admin/placements/offers",label:"Offers"},
 {href:"/admin/placements/joining",label:"Joining"},
 {href:"/admin/placements/seasons",label:"Seasons"},
 {href:"/admin/placements/screenings",label:"Screening"},
] as const;
export function SuperAdminPlacementOversightNav(){
 return <nav aria-label="Super Admin placement oversight" className="flex min-w-0 flex-wrap gap-2">
  {oversightLinks.map(link=><Link key={link.href} href={link.href}
   className="inline-flex min-h-10 max-w-full items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
   {link.label}</Link>)}
 </nav>;
}
