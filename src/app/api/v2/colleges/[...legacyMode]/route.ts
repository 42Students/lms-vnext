import {NextResponse} from "next/server";
import {GET as getColleges} from "@/app/api/colleges/route";
export const runtime="nodejs";
const modes=new Set(["search","popular","names","states","state","city",
 "categories","category","select","stats","exists","refresh"]);
export async function GET(request:Request,{params}:{
 params:Promise<{legacyMode:string[]}>
}){
 const {legacyMode}=await params;
 if(legacyMode.length!==1||!modes.has(legacyMode[0]!))
  return NextResponse.json({error:"INVALID_MODE"},{status:404});
 const url=new URL(request.url);
 url.searchParams.set("mode",legacyMode[0]!);
 return getColleges(new Request(url.toString(),request));
}
