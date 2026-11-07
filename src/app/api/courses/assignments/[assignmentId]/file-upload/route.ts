import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { BoundedFormDataError, readBoundedFormData } from "@/lib/bounded-form-data";
import {guessContentTypeFromName,isSafeSignedUrl} from "@/modules/storage/ui-models";
import {
  issueSubmissionFileUploadGrant,
} from "@/modules/courses/assignment-submission-file-service";
import {
  assignmentFilesRuntimeEnabled,
} from "@/modules/courses/assignment-file-readiness";
import { route } from "@/security/route";

export const runtime = "nodejs";
const MAX_PROXY_UPLOAD_BYTES=10*1024*1024;

/** Legacy /api/v1/upload/presign folder=assignments now maps to
 * POST /api/courses/assignments/:assignmentId/file-upload. The receipt is
 * assignment- and delivery-scoped and is then verified before submission.
 * Other legacy folder names have separate resource-specific upload routes;
 * a global bucket writer would bypass college and membership controls. */

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

async function handlePOST(
  request: Request,
  { params }: RouteContext,
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  if (!assignmentFilesRuntimeEnabled()) {
    return NextResponse.json(
      {
        error:"DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING",
        message:"Assignment file uploads are temporarily unavailable. Ask an administrator to verify the receipt migrations and private file storage, then retry.",
      },
      { status: 503 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { assignmentId } = await params;
    // Small-file mobile fallback: the browser posts the file to this
    // authenticated same-origin endpoint rather than needing cross-origin
    // storage CORS. Large files must use a browser-to-storage signed PUT.
    if(request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")){
      let form: FormData;
      try {
        form=await readBoundedFormData(request, MAX_PROXY_UPLOAD_BYTES + 1024 * 1024);
      } catch (error) {
        if (!(error instanceof BoundedFormDataError)) throw error;
        return NextResponse.json({
          error:error.code==="BODY_TOO_LARGE"?"UPLOAD_PROXY_TOO_LARGE":"INVALID_REQUEST",
          message:error.code==="BODY_TOO_LARGE"
            ?"Server-assisted upload supports files up to 10 MiB. Use the signed direct upload for larger files."
            :"Invalid upload form.",
        },{status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"}});
      }
      const file=form.get("file");
      if(!(file instanceof File))
        return NextResponse.json({error:"INVALID_REQUEST",message:"Choose a file to upload."},{status:400});
      if(file.size<=0||file.size>MAX_PROXY_UPLOAD_BYTES)
        return NextResponse.json({error:"UPLOAD_PROXY_TOO_LARGE",
          message:"Choose a non-empty file up to 10 MiB for server-assisted upload."},{status:413});
      const folder=form.get("folder");
      if(folder!==null&&folder!=="assignments"&&folder!=="assignment-submission")
        return NextResponse.json({error:"UNSUPPORTED_UPLOAD_FOLDER"},{status:400});
      const deliveryId=form.get("deliveryId");
      if(typeof deliveryId!=="string")
        return NextResponse.json({error:"INVALID_REQUEST",message:"A course section is required."},{status:400});
      const type=file.type||guessContentTypeFromName("assignment-submission",file.name);
      if(!type)
        return NextResponse.json({error:"INVALID_REQUEST",message:"This file type is not supported."},{status:400});
      const { grant }=await issueSubmissionFileUploadGrant(context,assignmentId,{
        deliveryId,originalName:file.name,contentType:type,sizeBytes:file.size,
      });
      if(!isSafeSignedUrl(grant.uploadUrl))throw Error("STORAGE_GRANT_INVALID");
      let transferred:Response;
      try{
        transferred=await fetch(grant.uploadUrl,{
          method:"PUT",headers:grant.requiredHeaders,
          body:Buffer.from(await file.arrayBuffer()),
          cache:"no-store",signal:AbortSignal.timeout(120_000),
        });
      }catch{
        return NextResponse.json({error:"STORAGE_PROXY_NETWORK_ERROR",
          message:"Could not transfer the file to private storage. The upload is not complete. Check the connection and try again.",
          receiptId:grant.receiptId,
        },{status:502,headers:{"Cache-Control":"private, no-store"}});
      }
      if(!transferred.ok)return NextResponse.json({
        error:"STORAGE_PROXY_UPLOAD_REJECTED",
        message:"Private storage rejected the transfer. The file was not submitted. Retry the upload.",
        receiptId:grant.receiptId,
      },{status:502,headers:{"Cache-Control":"private, no-store"}});
      return NextResponse.json({
        receiptId:grant.receiptId,uploaded:true,verificationPending:true,
        message:"Transfer complete. Verify the upload receipt before submitting this assignment.",
      },{status:201,headers:{"Cache-Control":"private, no-store"}});
    }
    const bounded=await readBoundedUtf8Body(request, 8 * 1024);
    if (bounded.kind!=="OK") {
      return NextResponse.json({
        error:bounded.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"INVALID_REQUEST",
      },{status:bounded.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"}});
    }
    let body:unknown;
    try { body=JSON.parse(bounded.body); }
    catch { return NextResponse.json({error:"INVALID_REQUEST"},{status:400}); }
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const data=body as Record<string,unknown>;
    // The old /api/v1/upload/presign accepted arbitrary folder strings.
    // vNext deliberately accepts only assignment-submission files bound to
    // this authenticated assignment and delivery; no user-selected R2 key.
    if(data["folder"]!==undefined && data["folder"]!=="assignment-submission"&&data["folder"]!=="assignments")
      return NextResponse.json({
        error:"UNSUPPORTED_UPLOAD_FOLDER",
        message:"This folder requires its own authenticated upload grant.",
      },{status:400});
    const { grant }=await issueSubmissionFileUploadGrant(context,assignmentId,{
      deliveryId:data["deliveryId"] as string,
      originalName:(data["originalName"]??data["fileName"]??data["filename"]) as string,
      contentType:(data["contentType"]??data["mimeType"]??data["content-type"]??data["type"]) as string,
      sizeBytes:Number(data["sizeBytes"]??data["fileSize"]??data["content-length"]),
    });
    return NextResponse.json({
      grant,receiptId:grant.receiptId,method:grant.method,
      uploadUrl:grant.uploadUrl,expiresAt:grant.expiresAt,
      requiredHeaders:grant.requiredHeaders,
      message:"Upload permission created. Complete the signed PUT and verify the receipt before submitting. If direct upload fails due to CORS or connectivity, retry with multipart/form-data (up to 10 MiB) for this assignment and delivery.",
    },{status:201,headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
