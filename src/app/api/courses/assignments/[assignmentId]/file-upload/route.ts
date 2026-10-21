import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {
  createAssignmentFileUploadGrant,
} from "@/modules/courses/assignment-file-service";
import {
  assignmentFilesRuntimeEnabled,
} from "@/modules/courses/assignment-file-readiness";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function POST(
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
        error:
          "DB06_ASSIGNMENT_FILES_MIGRATIONS_PENDING",
      },
      { status: 503 },
    );
  }

  try {
    const context =
      await getCurrentRequestContext();
    const { assignmentId } = await params;
    const body:unknown=await request.json();
    if(!body||typeof body!=="object"||Array.isArray(body))
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const data=body as Record<string,unknown>;
    // The old /api/v1/upload/presign accepted arbitrary folder strings.
    // vNext deliberately accepts only assignment-submission files bound to
    // this authenticated assignment and delivery; no user-selected R2 key.
    if(data.folder!==undefined && data.folder!=="assignment-submission")
      return NextResponse.json({
        error:"UNSUPPORTED_UPLOAD_FOLDER",
        message:"This folder requires its own authenticated upload grant.",
      },{status:400});
    const grant=await createAssignmentFileUploadGrant(context,assignmentId,{
      deliveryId:data.deliveryId as string,
      originalName:(data.originalName??data.fileName) as string,
      contentType:(data.contentType??data.mimeType) as string,
      sizeBytes:Number(data.sizeBytes??data.fileSize),
    });
    return NextResponse.json({
      grant,receiptId:grant.receiptId,method:grant.method,
      uploadUrl:grant.uploadUrl,expiresAt:grant.expiresAt,
      requiredHeaders:grant.requiredHeaders,
      message:"Upload permission created. Complete the upload and verification before submitting.",
    },{status:201,headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
