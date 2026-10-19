import Link from "next/link";
type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
export const TPO_SETTINGS_NAV_GROUPS=[
 {title:"Placement policy",items:[
  {id:"season",label:"Placement seasons",href:"/tpo/settings/season"},
  {id:"rules",label:"Placement Rules",href:"/tpo/settings/rules"},
  {id:"job-types",label:"Job types",href:"/tpo/settings/job-types"},
  {id:"after-college",label:"After college",href:"/tpo/settings/after-college"},
  {id:"prep-readiness",label:"Prep readiness",href:"/tpo/settings/prep-readiness"},
  {id:"blocked-dates",label:"Blocked dates",href:"/tpo/settings/blocked-dates"},
 ]},
 {title:"People",items:[
  {id:"trusted",label:"Trusted domains",href:"/tpo/settings/trusted"},
  {id:"recruiters",label:"Recruiters",href:"/tpo/settings/recruiters"},
  {id:"team",label:"Placement Team",href:"/tpo/settings/team"},
  {id:"public-link",label:"Public recruiter link",href:"/tpo/settings/public-link"},
 ]},
 {title:"Students and companies",items:[
  {id:"notices",label:"Student Notices & Preparation",href:"/tpo/settings/notices"},
  {id:"notifications",label:"My Notifications",href:"/tpo/settings/notifications"},
  {id:"templates",label:"Email templates",href:"/tpo/settings/templates"},
  {id:"see",label:"What Companies See",href:"/tpo/settings/see"},
  {id:"public-page",label:"Public placements",href:"/tpo/settings/public-page"},
  {id:"branding",label:"Placement Branding",href:"/tpo/settings/branding"},
 ]},
] as const;
export function TpoSettingsNav({active}:{active:SettingsKey}){
 return <nav aria-label="TPO placement settings sections" className="min-w-0 space-y-4 md:sticky md:top-4 md:float-left md:mr-6 md:w-56">
  {TPO_SETTINGS_NAV_GROUPS.map(group=><section key={group.title} aria-label={group.title} className="space-y-2">
   <h2 className="text-xs font-semibold uppercase tracking-[0.105em] text-muted-foreground">{group.title}</h2>
   <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">{group.items.map(item=><Link key={item.id} href={item.href}
    aria-current={active===item.id?"page":undefined}
    className={active===item.id?
     "inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-3 text-sm font-semibold text-[var(--lms-primary-text)] sm:min-h-9 md:w-full":
     "inline-flex min-h-11 items-center rounded-[var(--lms-control-radius,9px)] border-l-[3px] border-transparent bg-transparent px-3 text-sm text-body hover:bg-[var(--lms-primary-subtle)] sm:min-h-9 md:w-full"}>
    {item.label}</Link>)}</div>
  </section>)}
 </nav>;
}
