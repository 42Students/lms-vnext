import type {AdminLearnerProfileSection} from "@/modules/people/admin-learner-profile-sections-model";
import { Heading } from "@/components/ui/heading";
import { Disclosure } from "@/components/ui/disclosure";

/** Legacy ProfileSectionsPanel sections in a read-only scoped Super Admin view.
 * A profile document's private identifiers never leave the server projection. */
export function AdminLearnerProfileSections({name,sections}:{
 name:string;sections:readonly AdminLearnerProfileSection[];
}){
 return <section aria-label={"Profile — "+name} className="min-w-0 space-y-3 border-t border-border pt-4">
  <Heading level={2} size="lg" className="leading-7 text-[var(--lms-heading)]">
   {"Profile — "+name}
  </Heading>
  <p className="text-sm text-body">
   Selected-college learner profile · Read only. Sensitive identity and private file
   details are available only through their separately authorized workflows.
  </p>
  <div className="min-w-0 divide-y divide-border border-y border-border">
   {sections.map((section,index)=><Disclosure key={section.key} title={<>
     <span>{section.label}</span>
     <span className="shrink-0 text-xs font-normal text-muted-foreground">
      {section.present?"On file":"Not recorded"}
     </span>
    </>} defaultOpen={index===0||index===1||index===2} className="min-w-0" preserveSummary summaryClassName="flex min-h-11 items-center justify-between gap-3">
    <div className="min-w-0 px-2 pb-4">
     {section.entries.length?<dl className="grid min-w-0 gap-x-6 gap-y-2 text-sm md:grid-cols-2">
      {section.entries.map((entry,i)=><div key={i} className="min-w-0 border-b border-border py-2">
       <dt className="text-xs font-semibold text-muted-foreground">{entry.label}</dt>
       <dd className="mt-1 break-words [overflow-wrap:anywhere] text-body">{entry.value}</dd>
      </div>)}
     </dl>:<p role="status" className="text-sm text-muted-foreground">
      {section.present?"Details are stored but have no shareable public fields.":"No details recorded."}
     </p>}
    </div>
   </Disclosure>)}
  </div>
 </section>;
}
