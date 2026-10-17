import {NextResponse} from "next/server";
/** Browser form POSTs receive an inline-message redirect, while API consumers keep status codes. */
export function noticePostError(request:Request,code:string,status:number){
 if(!request.headers.get("accept")?.includes("text/html"))
  return NextResponse.json({error:code},{status});
 const url=new URL("/tpo/announcements",request.url);
 url.searchParams.set("tab","yours");
 url.searchParams.set("noticeError",code);
 return NextResponse.redirect(url,303);
}
