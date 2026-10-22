import { NextResponse } from "next/server";
import {z} from "zod";
import {normalizeLegacyProjectCreationStatus} from "@/modules/projects/validation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createProjectInstance,
  listProjectInstances,
} from "@/modules/projects/instance-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const query=new URL(request.url).searchParams;
    const collegeId=query.get("collegeId")??"";
    const pageRaw=query.get("page");
    const limitRaw=query.get("limit");
    const page=pageRaw===null?1:
      /^[1-9][0-9]{0,3}$/.test(pageRaw)?Number(pageRaw):null;
    const limit=limitRaw===null?25:
      /^[1-9][0-9]{0,2}$/.test(limitRaw)?Math.min(200,Number(limitRaw)):null;
    if(page===null||limit===null)return NextResponse.json({
      error:"INVALID_PROJECT_PAGE",message:"Use a positive page and limit (1–200).",
    },{status:400,headers:{"Cache-Control":"no-store"}});
    // Existing clients receive the full college-scoped list. Legacy paged
    // directory callers opt into the numbered response via ?paged=1.
    // All rows are still scoped and authorized by the service first.
    const projects=await listProjectInstances(context,collegeId);
    if(query.get("paged")==="1"){
      const slice=projects.slice((page-1)*limit,page*limit);
      return NextResponse.json({
        projects:slice,items:slice,total:projects.length,page,pageSize:limit,
        totalPages:Math.max(1,Math.ceil(projects.length/limit)),
        message:"Projects retrieved",status:"success",
        nextPage:page*limit<projects.length?page+1:null,
      },{headers:{"Cache-Control":"no-store"}});
    }
    return NextResponse.json({
      projects,message:"Projects retrieved",status:"success",
      legacyEndpoints:{list:"GET /api/v1/admin/projects",
        paged:"GET /api/v1/admin/projects?page={page}&limit={limit}"},
    },{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const raw:unknown=await request.json();
    const legacy=z.object({
      collegeId:z.string().uuid(),templateId:z.string().uuid().optional(),
      title:z.string().trim().min(1).max(160),
      classId:z.string().uuid().optional(),sectionId:z.string().uuid().optional(),
      mentorMembershipId:z.string().uuid().optional(),
      primaryMentorMembershipId:z.string().uuid().optional(),
      studentMembershipIds:z.array(z.string().uuid()).max(500).optional(),
      learnerMembershipIds:z.array(z.string().uuid()).max(500).optional(),
      status:z.enum(["PLANNED","ACTIVE","IN_PROGRESS","READY","BLOCKED","ARCHIVED"]).optional(),
      initialStatus:z.enum(["PLANNED","ACTIVE","IN_PROGRESS","READY","BLOCKED","ARCHIVED"]).optional(),
      slug:z.string().optional(),
    }).passthrough().safeParse(raw);
    if(!legacy.success)return NextResponse.json({error:"INVALID_PROJECT_CREATE",
      message:"Check the title, college, class and selected membership IDs."},{status:400});
    if(!legacy.data.templateId)return NextResponse.json({
      error:"PROJECT_TEMPLATE_REQUIRED",
      message:"Choose an assigned project template before creating this workspace.",
      nextAction:"ASSIGN_PROJECT_TEMPLATE",
    },{status:422,headers:{"Cache-Control":"no-store"}});
    const legacyStatus=normalizeLegacyProjectCreationStatus(
      legacy.data.initialStatus??legacy.data.status??"PLANNED",{
        ...(typeof legacy.data["phase"]==="string"?{phase:legacy.data["phase"]}:{}),
        ...(typeof legacy.data["blocker"]==="string"?{blocker:legacy.data["blocker"]}:{}),
      });
    if(!legacyStatus)return NextResponse.json({
      error:"PROJECT_INVALID_STATE",
      message:"Archived workspaces cannot be created. Create a planned workspace and archive it separately.",
    },{status:422});
    const generatedSlug=legacy.data.title.toLowerCase().normalize("NFKD")
      .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
    const canonical={
      collegeId:legacy.data.collegeId,templateId:legacy.data.templateId,
      title:legacy.data.title,slug:legacy.data.slug??generatedSlug,
      sectionId:legacy.data.sectionId??legacy.data.classId,
      primaryMentorMembershipId:legacy.data.primaryMentorMembershipId??legacy.data.mentorMembershipId,
      learnerMembershipIds:legacy.data.learnerMembershipIds??legacy.data.studentMembershipIds??[],
      initialStatus:legacyStatus.initialStatus,
      ...(typeof legacy.data["summary"]==="string"?{summary:legacy.data["summary"]}:{}),
      ...(legacyStatus.phase?{phase:legacyStatus.phase}:{}),
      ...(typeof legacy.data["progressPercent"]==="number"?{progressPercent:legacy.data["progressPercent"]}:{}),
      ...(typeof legacy.data["dueLabel"]==="string"?{dueLabel:legacy.data["dueLabel"]}:{}),
      ...(legacyStatus.blocker?{blocker:legacyStatus.blocker}:{}),
      ...(typeof legacy.data["nextAction"]==="string"?{nextAction:legacy.data["nextAction"]}:{}),
    };
    const project = await createProjectInstance(context,canonical);

    return NextResponse.json(
      { project,status:"success",message:"Project created",
        data:project,legacyResponse:{status:"success",message:"Project created",data:project},
        href:"/admin/projects/"+project.id,
        templateLink:"/admin/project-templates/"+encodeURIComponent(legacy.data.templateId) },
      {status:201,headers:{"Cache-Control":"no-store"}},
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
