import { NextResponse } from "next/server";
import {z} from "zod";
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
    const collegeId =
      new URL(request.url).searchParams.get(
        "collegeId",
      ) ?? "";
    const projects = await listProjectInstances(
      context,
      collegeId,
    );

    return NextResponse.json({ projects });
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
      status:z.enum(["PLANNED","ACTIVE"]).optional(),
      initialStatus:z.enum(["PLANNED","ACTIVE"]).optional(),
      slug:z.string().optional(),
    }).passthrough().safeParse(raw);
    if(!legacy.success)return NextResponse.json({error:"INVALID_PROJECT_CREATE",
      message:"Check the title, college, class and selected membership IDs."},{status:400});
    if(!legacy.data.templateId)return NextResponse.json({
      error:"PROJECT_TEMPLATE_REQUIRED",
      message:"Choose an assigned project template before creating this workspace.",
      nextAction:"ASSIGN_PROJECT_TEMPLATE",
    },{status:422,headers:{"Cache-Control":"no-store"}});
    const body={
      ...legacy.data,
      sectionId:legacy.data.sectionId??legacy.data.classId,
      primaryMentorMembershipId:legacy.data.primaryMentorMembershipId??legacy.data.mentorMembershipId,
      learnerMembershipIds:legacy.data.learnerMembershipIds??legacy.data.studentMembershipIds??[],
      initialStatus:legacy.data.initialStatus??legacy.data.status??"PLANNED",
      slug:legacy.data.slug??legacy.data.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80),
    };
    const {classId,mentorMembershipId,studentMembershipIds,status,...canonical}=body;
    void classId;void mentorMembershipId;void studentMembershipIds;void status;
    const project = await createProjectInstance(context,canonical);

    return NextResponse.json(
      { project,status:"success",message:"Project created",
        href:"/admin/projects/"+project.id },
      {status:201,headers:{"Cache-Control":"no-store"}},
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
