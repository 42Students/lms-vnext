import {notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "@/modules/projects/access";
import {getProjectInstanceWorkspace} from "@/modules/projects/instance-service";
import {mentorStudentVisibilityPreview}
  from "@/modules/projects/mentor-student-visibility-preview-model";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

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
   <TextLink href={back+"?tab=overview"} className="text-sm">
     ← Back to Mentor project
   </TextLink>
   <div>
     <Heading level={1} size="2xl">Student-visible project preview</Heading>
     <p className="mt-2 text-sm text-muted-foreground">
       This is a read-only visibility check, not a signed-in student's account.
       Personal assignments, learner permissions, inbox state and external provider
       access still require an actual learner-session acceptance test.
     </p>
   </div>
   <section className="space-y-2 border-b pb-4" aria-label="Shared project overview">
     <Heading level={2} size="xl">{visible.project.title}</Heading>
     <p>Status: {visible.project.status.replaceAll("_"," ")}</p>
     <p>{visible.project.summary||"No shared project summary recorded."}</p>
   </section>
   <section className="space-y-2" aria-label="Visible Sprint plan">
     <Heading level={2} size="lg">Sprints · {visible.sprints.length}</Heading>
     {visible.sprints.length===0?<p>No sprints recorded.</p>:<ul className="space-y-2">
       {visible.sprints.map(item=><li key={item.id} className="border-b py-2">
         {item.title} · {item.status.replaceAll("_"," ")}
       </li>)}
     </ul>}
   </section>
   <section className="space-y-2" aria-label="Shared task board">
     <Heading level={2} size="lg">Project tasks · {visible.tasks.length}</Heading>
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
     <Heading level={2} size="lg">
       Shared resources · {visible.resources.length}
     </Heading>
     {visible.resources.length===0?<p>No active team-visible resources.</p>:<ul className="space-y-3">
       {visible.resources.map(item=><li key={item.id} className="border-b py-2">
         <strong>{item.title}</strong>
         {item.description?<p className="whitespace-pre-wrap">{item.description}</p>:null}
         {item.url?<TextLink href={item.url} rel="noopener noreferrer"
           className="inline-flex py-2 text-sm">Open resource ↗</TextLink>:
           <p className="text-xs text-muted-foreground">
             No public link. An authorized uploaded file may require a signed download.
           </p>}
       </li>)}
     </ul>}
   </section>
 </main>;
}
