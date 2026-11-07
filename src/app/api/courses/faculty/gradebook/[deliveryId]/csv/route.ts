import { route } from "@/security/route";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {facultyGradebookCsv,facultyGradebookParamsSchema} from "@/modules/courses/faculty-gradebook-model";
import {getFacultyPublishedGradebook} from "@/modules/courses/faculty-gradebook-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor, params }) => {
    const __ctx = __actor!;
    const query=facultyGradebookParamsSchema.parse(params);
    const data=await getFacultyPublishedGradebook(__ctx,query);
    return new Response("\uFEFF"+facultyGradebookCsv(data.rows),{
      headers:{
        "Content-Type":"text/csv; charset=utf-8",
        "Content-Disposition":'attachment; filename="faculty-section-gradebook.csv"',
        "Cache-Control":"private, no-store, max-age=0",
        "X-Content-Type-Options":"nosniff",
      },
    });
  },
);
