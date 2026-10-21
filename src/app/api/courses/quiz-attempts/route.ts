import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listQuizAttempts,
} from "@/modules/courses/quiz-attempt-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const context =
      await getCurrentRequestContext();
    const url = new URL(request.url);
    const pageRaw=url.searchParams.get("page")??"1";
    if(!/^[1-9][0-9]{0,3}$/.test(pageRaw)||Number(pageRaw)>1000)
      return NextResponse.json({error:"INVALID_PAGE"},{status:400});
    const page=Number(pageRaw);
    const deliveryId=url.searchParams.get("deliveryId");
    if(!deliveryId)return NextResponse.json({error:"SECTION_REQUIRED",message:"Select a Section to view quiz attempts."},{status:400});
    const attempts = await listQuizAttempts(
      context,
      url.searchParams.get("quizId") ?? "",
      deliveryId,
      page,
    );

    return NextResponse.json({attempts:attempts.slice(0,25),page,
      hasMore:attempts.length>25,
      nextPage:attempts.length>25?page+1:null,
      deliveryId},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
