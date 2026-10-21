import Link from "next/link";
type SettingsKey="season"|"rules"|"job-types"|"after-college"|"prep-readiness"|"blocked-dates"|"see"|"team"|"trusted"|"branding"|"notifications"|"recruiters"|"templates"|"notices"|"public-page"|"public-link";
/** Exactly five legacy-visible settings sections. Hidden panels and persisted
 * settings stay accessible by direct scoped URLs, never silently destroyed. */
export const TPO_SETTINGS_NAV_GROUPS=[
 {title:"Placement policy",items:[
  {id:"rules",label:"Placement rules",href:"/tpo/settings/rules"},
  {id:"job-types",label:"Job types",href:"/tpo/settings/job-types"},
  {id:"after-college",label:"After college",href:"/tpo/settings/after-college"},
 ]},
 {title:"People",items:[
  {id:"team",label:"Placement team",href:"/tpo/settings/team"},
  {id:"recruiters",label:"Recruiters",href:"/tpo/settings/recruiters"},
 ]},
] as const;
export function TpoSettingsNav({active,compact=false,unsaved=false}:{
  active:SettingsKey;compact?:boolean;unsaved?:boolean;
}) {
 return <nav aria-label="Settings sections"
   className={"min-w-0 space-y-4 " + (compact?"w-full":"md:sticky md:top-4 md:mr-6 md:w-56 md:shrink-0")}>
  {unsaved?<span role="status" className="inline-flex rounded border border-border px-2 py-1 text-xs font-semibold text-warning-text">Unsaved changes</span>:null}
  {TPO_SETTINGS_NAV_GROUPS.map(group=><section key={group.title}
    aria-label={group.title} className="min-w-0 space-y-2">
    <h2 className="text-xs font-semibold uppercase tracking-[0.105em] text-muted-foreground">{group.title}</h2>
    <div className="flex min-w-0 flex-col items-stretch gap-1">{group.items.map(item=>
      <Link key={item.id} href={item.href} aria-current={active===item.id?"page":undefined}
        className={active===item.id
          ?"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-3 text-sm font-semibold text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
          :"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border-l-[3px] border-transparent px-3 text-sm text-body hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"}>
        {item.label}
      </Link>)}</div>
   </section>)}
 </nav>;
}
