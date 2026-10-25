import Link from "next/link";
import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "@/modules/projects/access";
import {getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {mentorStudentVisibilityPreview}
  from "@/modules/projects/mentor-student-visibility-preview-model";

/** Visibility-only preview: no student impersonation, mutation endpoints,
 * personal learner records, Mentor-only resource notes or signed file links.
 */
export default async function MentorLearnerVisibilityPreview({
 params,
}:{params:Promise<{projectId:string}>}){
 const context=await getCurrentRequestContext();
 const {projectId}=await params;
 const moduleAccess=await resolveOptionalModuleAccess(context);
 if(!moduleAccess.projects.enabled)notFound();
 const access=await requireProjectReadAccess(context,projectId).catch(()=>notFound());
 if(access.access!=="MENTOR"&&
   !(access.access==="OBSERVER"&&access.member?.role==="MENTOR"))notFound();
 if(access.project.deletedAt)notFound();
 const workspace=await getProjectInstanceWorkspace(context,projectId);
 const visible=mentorStudentVisibilityPreview({
   project:workspace.project,sprints:workspace.sprints,
   tasks:workspace.tasks,resources:workspace.resources,
 });
 const back="/mentor/projects/"+encodeURIComponent(projectId);
 return <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
   <Link href={back+"?tab=overview"} className="text-sm font-semibold underline">
     ← Back to Mentor project
   </Link>
   <div>
     <h1 className="text-2xl font-semibold">Student-visible project preview</h1>
     <p className="mt-2 text-sm text-muted-foreground">
       This is a read-only visibility check, not a signed-in student's account.
       Personal assignments, learner permissions, inbox state and external provider
       access still require an actual learner-session acceptance test.
     </p>
   </div>
   <section className="space-y-2 border-b pb-4" aria-label="Shared project overview">
     <h2 className="text-xl font-semibold">{visible.project.title}</h2>
     <p>Status: {visible.project.status.replaceAll("_"," ")}</p>
     <p>{visible.project.summary||"No shared project summary recorded."}</p>
   </section>
   <section className="space-y-2" aria-label="Visible Sprint plan">
     <h2 className="text-lg font-semibold">Sprints · {visible.sprints.length}</h2>
     {visible.sprints.length===0?<p>No sprints recorded.</p>:<ul className="space-y-2">
       {visible.sprints.map(item=><li key={item.id} className="border-b py-2">
         {item.title} · {item.status.replaceAll("_"," ")}
       </li>)}
     </ul>}
   </section>
   <section className="space-y-2" aria-label="Shared task board">
     <h2 className="text-lg font-semibold">Project tasks · {visible.tasks.length}</h2>
     {visible.tasks.length===0?<p>No active task records.</p>:<ul className="space-y-2">
       {visible.tasks.map(item=><li key={item.id} className="border-b py-2">
         <strong>{item.title}</strong>
         <p className="text-sm">{item.status.replaceAll("_"," ")}
           {" · "}{item.priority.toLowerCase()} priority
           {item.estimatePoints!==null?" · "+item.estimatePoints+" points":""}
         </p>
       </li>)}
     </ul>}
   </section>
   <section className="space-y-2" aria-label="Shared active project resources">
     <h2 className="text-lg font-semibold">
       Shared resources · {visible.resources.length}
     </h2>
     {visible.resources.length===0?<p>No active team-visible resources.</p>:<ul className="space-y-3">
       {visible.resources.map(item=><li key={item.id} className="border-b py-2">
         <strong>{item.title}</strong>
         {item.description?<p className="whitespace-pre-wrap">{item.description}</p>:null}
         {item.url?<a href={item.url} rel="noopener noreferrer"
           className="inline-flex py-2 text-sm font-semibold underline">Open resource ↗</a>:
           <p className="text-xs text-muted-foreground">
             No public link. An authorized uploaded file may require a signed download.
           </p>}
       </li>)}
     </ul>}
   </section>
 </main>;
}
