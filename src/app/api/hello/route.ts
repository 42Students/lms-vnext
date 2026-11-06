import {NextResponse} from "next/server";
import { secured } from "@/security/secure-handler";
/** Legacy stub: all methods respond with 404 and {message:"Not found"}, never 200 Hello. */
export const runtime="nodejs";
export const dynamic="force-dynamic";
function retired(){return NextResponse.json({message:"Not found"},{status:404,headers:{"Cache-Control":"no-store"}});}
export const GET=secured(retired),POST=secured(retired),PUT=secured(retired),PATCH=secured(retired),DELETE=secured(retired),OPTIONS=secured(retired);
function handleHEAD(){return new Response(null,{status:404,headers:{"Cache-Control":"no-store","Content-Type":"application/json"}});}
export const HEAD = secured(handleHEAD);
