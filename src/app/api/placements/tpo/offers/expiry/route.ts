import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { tpoOfferExpiryCsv } from "@/modules/placements/tpo-offer-expiry-model";
import { getTpoOfferExpiryWatchlist } from "@/modules/placements/tpo-offer-expiry-service";
import {tpoReportHasRepeatedSearchParams} from "@/modules/placements/tpo-report-url-guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (process.env.DB09_TPO_API_READY !== "DB09_VERIFIED") {
    return NextResponse.json({ error: "DB09_MIGRATIONS_PENDING" }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }
  try {
    const context = await getCurrentRequestContext();
    const parameters=new URL(request.url).searchParams;
    if(tpoReportHasRepeatedSearchParams(parameters))
      return NextResponse.json({error:"Invalid expiry filters. Clear filters and try again."},{
        status:400,headers:{"Cache-Control":"private, no-store, max-age=0",
          "X-Content-Type-Options":"nosniff",Vary:"Cookie"},
      });
    const query = Object.fromEntries(parameters.entries());
    const report = await getTpoOfferExpiryWatchlist(context, query);
    return new Response("\uFEFF" + tpoOfferExpiryCsv(report), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tpo-offer-expiry-watchlist.csv"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
        "X-Export-Truncated": String(report.truncated),
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
}
