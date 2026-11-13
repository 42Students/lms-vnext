import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCollegePersonEditor,saveCollegePersonEditor} from "@/modules/people/college-directory-person-editor-service";

import { privateJson } from "@/security/responses";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {membershipId}=params;
    const kind=z.enum(["FACULTY","LEARNER"]).parse(new URL(request.url).searchParams.get("kind"));
    const person=await getCollegePersonEditor(context,membershipId,kind);
    return privateJson({person});
  },
);
export const PATCH = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const {membershipId}=params;
    return NextResponse.json({person:await saveCollegePersonEditor(
      context,membershipId,await boundedRequestJson(request))});
  },
);
