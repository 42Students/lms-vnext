import Link from "next/link";
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

export default async function CollegeCreateProjectPage({
  searchParams,
}:{searchParams:Promise<{mode?:string}>}) {
  const selected=(await searchParams).mode;
  const mode=selected==="teams"||selected==="cohort"?selected:"single";
  const context=await getCurrentRequestContext();
  const collegeId=getProjectAdminCollegeId(context);
  if(!collegeId)return <div className="min-w-0 space-y-4">
    <PageHeader title="Create workspace" description="Select a college to continue."/>
    <ErrorState title="No college selected"
      description="Choose a college from the account switcher before creating a workspace."
      action={<Link href="/college/projects" className="md:min-h-9 lms-inline-link inline-flex min-h-11 items-center text-link underline md:min-h-[var(--lms-control-height)] hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Back to workspaces</Link>}/>
  </div>;
  if(mode!=="single")await requireTeamCreationAuthority(context,collegeId);
  const templates=await listAssignedProjectTemplates(context,collegeId);
  const options=templates.map(template=>({
    templateId:template.templateId,title:template.title,version:template.version,summary:template.summary,
  }));
  return <div className="min-w-0 space-y-5 md:space-y-6">
    <ProjectAdminNav basePath="/college/projects" active="workspaces"/>
    <PageHeader title="Create workspace"
      description="Choose the published template and learners for this workspace."
      actions={<Link href="/college/projects" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline lms-inline-link md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center">Back to workspaces</Link>} />
    <nav aria-label="Workspace creation modes" className="flex flex-wrap gap-3 border-b border-border pb-3">
      {([
        {key:"single",label:"Single workspace"},
        {key:"teams",label:"Teams from a class"},
        {key:"cohort",label:"Whole class or cohort"},
      ] as const).map(item=><Link key={item.key}
        aria-current={mode===item.key?"page":undefined}
        href={"/college/projects/create?mode="+item.key}
        className={mode===item.key
          ?"inline-flex min-h-11 items-center border-b-2 border-[var(--lms-primary)] font-semibold text-[var(--lms-primary-text)] md:min-h-9"
          :"inline-flex min-h-11 items-center font-semibold text-body hover:text-[var(--lms-primary-text)] md:min-h-9"}>
        {item.label}
      </Link>)}
    </nav>
    {templates.length===0?<Banner tone="warning">
      No published Project template is assigned to this college.
    </Banner>:mode==="single"?
      <CreateProjectControl standalone collegeId={collegeId} basePath="/college/projects" templates={options}/>:
      <ClassTeamWorkspaceCreator collegeId={collegeId} userId={context.user.id}
        basePath="/college/projects" templates={options}/>
    }
  </div>;
}
