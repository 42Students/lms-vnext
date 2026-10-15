import Link from "next/link";
import {notFound} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {getSuperAdminLearnerAccessTrace} from "@/modules/module-access/admin-trace-service";
import {studentRuleCards} from "@/modules/module-access/admin-student-rule-model";
export const dynamic="force-dynamic";
export default async function SuperAdminStudentRules({params}:{params:Promise<{collegeId:string;membershipId:string}>}){
 const {collegeId,membershipId}=await params;
 if(!z.uuid().safeParse(collegeId).success||!z.uuid().safeParse(membershipId).success)notFound();
 const result=await getSuperAdminLearnerAccessTrace(await getCurrentRequestContext(),collegeId,{membershipId});
 if(!result?.selected)notFound();
 const student=result.selected;
 return <div className="space-y-6">
  <Link href={"/admin/features/"+encodeURIComponent(collegeId)+"/trace?membershipId="+encodeURIComponent(membershipId)}
   className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">← Learner access trace</Link>
  <PageHeader eyebrow="Super Admin · Module Access" title="Student overrides and locks"
   description={"Stored membership rules for "+(student.displayName||"Unnamed learner")+" in "+result.college.name+". No email or mobile details are exposed."}/>
  <p className="rounded-xl border border-border bg-surface-subtle p-4 text-sm text-body">
   These values are persisted at the learner membership scope. Inherit is not Off, and broader locked rules can override stored values. Placements ignores membership-level rules.
  </p>
  <div className="grid min-w-0 gap-3 sm:grid-cols-3">
   {studentRuleCards(student.modules).map(rule=><article key={rule.module} className="rounded-xl border border-border bg-surface p-4">
    <h2 className="font-semibold text-foreground">{rule.label}</h2>
    <p className="mt-2 text-sm text-body">Stored: {rule.state}{rule.locked?" · Locked":""}</p>
    <p className="mt-2 text-xs text-muted-foreground">{rule.consequence}</p>
   </article>)}
  </div>
  <p className="text-xs text-muted-foreground">Inspection only. No setting is changed here; updates require a separately authorized, auditable action.</p>
 </div>;
}
