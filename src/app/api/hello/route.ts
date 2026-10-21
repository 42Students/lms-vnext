import {NextResponse} from "next/server";
/** Legacy stub: all methods respond with 404 and {message:"Not found"}, never 200 Hello. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
function retired(){return NextResponse.json({message:"Not found"},{status:404,headers:{"Cache-Control":"no-store"}});}
export const GET=retired,POST=retired,PUT=retired,PATCH=retired,DELETE=retired,OPTIONS=retired;
export function HEAD(){return new Response(null,{status:404,headers:{"Cache-Control":"no-store","Content-Type":"application/json"}});}
