import {getCurrentRequestContext} from "@/auth/request-context";
import {CreateProjectControl} from "@/components/projects/project-create-control";
import {ClassTeamWorkspaceCreator} from "@/components/projects/class-team-workspace-creator";
import {requireTeamCreationAuthority} from "@/modules/projects/class-team-roster-service";
import {Banner} from "@/components/ui/banner";
import {ProjectAdminNav} from "@/components/projects/project-admin-nav";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {listAssignedProjectTemplates} from "@/modules/projects/template-service";
import {getProjectAdminCollegeId} from "@/modules/projects/admin-college-scope";
import {AuthorizationError} from "@/modules/permissions/policy";
import { TextLink } from "@/components/ui/text-link";
import { z } from "zod";

export default async function CollegeCreateProjectPage({
  searchParams,
}:{searchParams:Promise<{mode?:string;templateId?:string}>}) {
  const query=await searchParams;
  const selected=query.mode;
  const mode=selected==="teams"||selected==="cohort"?selected:"single";
  const context=await getCurrentRequestContext();
  const collegeId=getProjectAdminCollegeId(context);
  const back=<TextLink href="/college/projects" className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">
    Back to workspaces
  </TextLink>;
  // Keep the Projects tab strip in the college shell while recovering scope.
  if(!collegeId)return <div className="min-w-0 space-y-5">
    <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
    <PageHeader title="Create project workspace"
      description="Every workspace starts from a template — pick one below."
      actions={back}/>
    <Banner tone="warning">
      <strong>Admin not assigned to a college.</strong>{" "}
      You must be assigned to a college before creating project workspaces.
    </Banner>
  </div>;
  if(mode!=="single")await requireTeamCreationAuthority(context,collegeId);
  let templates:Awaited<ReturnType<typeof listAssignedProjectTemplates>>;
  try {
    templates=await listAssignedProjectTemplates(context,collegeId);
  } catch(error) {
    if(error instanceof AuthorizationError)throw error;
    const retryTemplateId = typeof query.templateId === "string" && z.uuid().safeParse(query.templateId).success
      ? "&templateId="+encodeURIComponent(query.templateId)
      : "";
    return <div className="min-w-0 space-y-5">
      <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
      <PageHeader title="Create project workspace"
        description="Every workspace starts from a template — pick one below."
        actions={back}/>
      <ErrorState title="Templates could not be loaded"
        description="Assigned published templates are unavailable. Retry before creating a workspace."
        action={<TextLink href={"/college/projects/create?mode="+mode+"&retry=1"+retryTemplateId}
          className="inline-flex min-h-11 items-center md:min-h-9">Try again</TextLink>}/>
    </div>;
  }
  // Only honor deep-linked templates assigned and published for this college.
  const requested=query.templateId;
  const selectedTemplateId=templates.some(template=>template.templateId===requested)?requested:undefined;
  const options=templates.map(template=>({
    templateId:template.templateId,title:template.title,version:template.version,summary:template.summary,
  }));
  return <div className="min-w-0 space-y-5 md:space-y-6">
    <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
    <PageHeader title="Create project workspace"
      description="Every workspace starts from a template — pick one below."
      actions={back}/>
    <section aria-label="Create project workspace" className="min-w-0 rounded-xl border border-border bg-surface p-4 md:p-6">
      <nav aria-label="Workspace creation modes" className="mb-5 flex flex-wrap gap-2">
        {([
          {key:"single",label:"Single workspace"},
          {key:"teams",label:"Teams from a class"},
          {key:"cohort",label:"Whole class or cohort"},
        ] as const).map(item=><TextLink variant="bare" key={item.key}
          aria-current={mode===item.key?"page":undefined}
          href={"/college/projects/create?mode="+item.key+(selectedTemplateId?"&templateId="+encodeURIComponent(selectedTemplateId):"")}
          className={mode===item.key
            ?"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-primary-subtle px-3 text-sm font-semibold text-[var(--lms-primary-text)] md:min-h-9"
            :"inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-body hover:bg-primary-subtle hover:text-[var(--lms-primary-text)] md:min-h-9"}>
          {item.label}
        </TextLink>)}
      </nav>
      {templates.length===0?<Banner tone="warning">
        No published Project template is assigned to this college.
      </Banner>:mode==="single"?
        <CreateProjectControl standalone collegeId={collegeId} basePath="/college/projects" templates={options}/>:
        <ClassTeamWorkspaceCreator key={mode} collegeId={collegeId} userId={context.user.id}
          basePath="/college/projects" templates={options}
          initialTemplateId={selectedTemplateId} initialMode={mode==="cohort"?"INDIVIDUAL":"TEAMS"}/>
      }
    </section>
  </div>;
}
