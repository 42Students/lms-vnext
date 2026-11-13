import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  listQuizAttempts,
} from "@/modules/courses/quiz-attempt-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
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
      {headers:{"Cache-Control":CACHE.PRIVATE}});
  },
);
