import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import {createTenantDomainInputSchema,tenantDomainPrimaryNextStep} from "@/modules/tenant-domains/validation";
import {
  createTenantDomainWithRuntime,
  listTenantDomainsWithRuntime,
} from "@/modules/tenant-domains/runtime";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context = await getCurrentRequestContext();
    const params=new URL(request.url).searchParams;
    const names=[...params.keys()];
    if(new Set(names).size!==names.length||
       names.some(name=>!["collegeId","page","size"].includes(name)))
      return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
    const collegeId=params.get("collegeId")??"";
    const rawPage=params.get("page");
    const rawSize=params.get("size");
    if((rawPage!==null&&!/^[1-9]\d{0,4}$/.test(rawPage))||
       (rawSize!==null&&!/^[1-9]\d{0,2}$/.test(rawSize))||
       (rawSize!==null&&Number(rawSize)>100))
      return NextResponse.json({error:"INVALID_PAGINATION"},{status:400});
    const domains=await listTenantDomainsWithRuntime(context,collegeId);
    // Older clients deliberately keep the complete scoped domain list.
    if(rawPage===null&&rawSize===null)return NextResponse.json({domains});
    const page=rawPage===null?1:Number(rawPage);
    const size=rawSize===null?50:Number(rawSize);
    const total=domains.length;
    return NextResponse.json({
      domains:domains.slice((page-1)*size,page*size),
      pagination:{page,size,total,pageCount:Math.max(1,Math.ceil(total/size)),
        hasNext:page*size<total},
    });
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  try {
    const context = await getCurrentRequestContext();
    const intent=createTenantDomainInputSchema.parse(body);
    const domain=await createTenantDomainWithRuntime(context,intent);
    return NextResponse.json({domain,compatibilityStatus:"CREATED",
      nextStep:tenantDomainPrimaryNextStep({isPrimary:intent.isPrimary,domainId:domain.id,verified:domain.isVerified}),
      message:intent.isPrimary?"Domain added. Verify DNS before making it primary.":"Domain added.",
    },{status:201});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
