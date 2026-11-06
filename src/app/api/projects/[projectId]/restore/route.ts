import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {restoreProjectInstance} from "@/modules/projects/instance-restore-service";
export const runtime="nodejs";
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {projectId}=params;
    const payload:unknown=await request.json();
    if(payload&&typeof payload==="object"&&!Array.isArray(payload)&&
      "collegeId" in payload){
      const claimed=(payload as {collegeId?:unknown}).collegeId;
      if(typeof claimed!=="string"||claimed!==context.adminScope?.collegeId)
        return NextResponse.json({error:"PROJECT_NOT_FOUND"},{status:404});
    }
    const clean=payload&&typeof payload==="object"&&!Array.isArray(payload)?
      Object.fromEntries(Object.entries(payload).filter(([key])=>key!=="collegeId")):payload;
    const project=await restoreProjectInstance(context,projectId,clean);
    return NextResponse.json({project,data:project,status:"OK",message:"Project restored"});
  },
);
