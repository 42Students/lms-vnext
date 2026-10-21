import {GET as getColleges} from "@/app/api/colleges/route";
export const runtime="nodejs";
/** Old v2 directory is a read-only alias over the authorized vNext reader. */
export const GET=getColleges;
