import Link from "next/link";
type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices";
const GROUPS=[
 {title:"Placement policy",items:[
  {id:"rules",label:"Placement rules",href:"/tpo/settings/rules"},
  {id:"job-types",label:"Job types",href:"/tpo/settings/job-types"},
  {id:"after-college",label:"After college",href:"/tpo/settings/after-college"},
  {id:"prep-readiness",label:"Prep readiness",href:"/tpo/settings/prep-readiness"},
  {id:"blocked-dates",label:"Blocked dates",href:"/tpo/settings/blocked-dates"},
 ]},
 {title:"People",items:[
  {id:"team",label:"Placement team",href:"/tpo/settings/team"},
  {id:"recruiters",label:"Recruiter access",href:"/tpo/settings/recruiters"},
 ]},
 {title:"Students and companies",items:[
  {id:"notifications",label:"My notifications",href:"/tpo/settings/notifications"},
  {id:"templates",label:"Communication templates",href:"/tpo/settings/templates"},
  {id:"notices",label:"Student notices",href:"/tpo/settings/notices"},
  {id:"see",label:"What companies see",href:"/tpo/settings/see"},
  {id:"branding",label:"Branding",href:"/tpo/settings/branding"},
 ]},
] as const;
export function TpoSettingsNav({active}:{active:SettingsKey}){
 return <nav aria-label="TPO placement settings sections" className="min-w-0 space-y-4">
  {GROUPS.map(group=><section key={group.title} aria-label={group.title} className="space-y-2">
   <h2 className="text-sm font-semibold text-muted-foreground">{group.title}</h2>
   <div className="flex flex-wrap gap-2">{group.items.map(item=><Link key={item.id} href={item.href}
    aria-current={active===item.id?"page":undefined}
    className={active===item.id?
     "inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-on-primary":
     "inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-3 text-sm text-body hover:bg-primary-subtle"}>
    {item.label}</Link>)}</div>
  </section>)}
 </nav>;
}
