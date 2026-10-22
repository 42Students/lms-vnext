import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {searchAuthorizedCourseSuggestions} from "@/modules/courses/college-course-catalogue-service";

export const runtime="nodejs";
const noStore={"Cache-Control":"private, no-store"};
const querySchema=z.strictObject({
  query:z.string().trim().min(1).max(200),
  limit:z.coerce.number().int().min(1).max(50).default(15),
});

/** Scoped SQL-backed v2 course search. Never expose raw legacy numeric course
 * IDs or serve an unscoped process-global cache to a tenant. */
export async function GET(request:Request){
  try{
    const params=new URL(request.url).searchParams;
    const input=querySchema.parse({
      query:params.get("query")??"",
      limit:params.get("limit")??"15",
    });
    const context=await getCurrentRequestContext();
    const courses=await searchAuthorizedCourseSuggestions(context,{
      q:input.query,limit:input.limit,
    });
    return Response.json({status:"success",data:courses},{headers:noStore});
  }catch(error){
    return apiErrorResponse(error);
  }
}
