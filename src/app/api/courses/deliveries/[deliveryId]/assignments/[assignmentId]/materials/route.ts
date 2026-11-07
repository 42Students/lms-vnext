import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listOwnLearnerAssignmentMaterialLinks,commandFacultyAssignmentMaterialLink}
 from "@/modules/courses/learner-assignment-materials-service";
import { route } from "@/security/route";
export const runtime="nodejs";
type Params={params:Promise<{deliveryId:string;assignmentId:string}>};
async function handleGET(_request:Request,{params}:Params){
 try{
  const {deliveryId,assignmentId}=await params;
  const result=await listOwnLearnerAssignmentMaterialLinks(
   await getCurrentRequestContext(),assignmentId,deliveryId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
async function change(request:Request,params:Params["params"]){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const {deliveryId,assignmentId}=await params;
  const input=await request.json();
  const result=await commandFacultyAssignmentMaterialLink(
   await getCurrentRequestContext(),assignmentId,deliveryId,input);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
async function handlePOST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return change(request,params);
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
async function handleDELETE(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 return change(request,params);
}
export const DELETE = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
