import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { onboardPersonWithRuntime } from "@/modules/people/runtime";

import {z} from "zod";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }

  try {
    const context = await getCurrentRequestContext();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const facultyProfileSchema=z.strictObject({
      kind:z.literal("FACULTY"),primaryDepartmentId:z.string().uuid(),
      // Administrative role grants must use membership roles, never a
      // string designation that appears to confer protected authorization.
      employmentType:z.string().trim().min(1).max(128).refine(
        value=>!["ADMIN","TPO","COLLEGE_ADMIN"].includes(value.toUpperCase()),
        "Select a faculty designation, not an account authorization role"),
      academicTitle:z.string().trim().max(128).default(""),
      gender:z.enum(["","Male","Female","Other","Prefer not to say"]).default(""),
      dateOfBirth:z.union([z.iso.date(),z.literal("")]).default(""),
      address:z.string().trim().max(1000).default(""),
      bio:z.string().trim().max(3000).default(""),
      contactPhone:z.string().trim().max(32).default(""),
      contactEmail:z.union([z.email(),z.literal("")]).default(""),
    });
    const parsed=z.object({facultyProfile:facultyProfileSchema.optional()}).passthrough().safeParse(body);
    if(!parsed.success)return NextResponse.json({error:"INVALID_FACULTY_PROFILE",
      message:"Check the department, faculty type and profile information."},{status:400});
    const facultyProfile=parsed.data.facultyProfile;
    if(facultyProfile&&(!Array.isArray(parsed.data["roles"])||!parsed.data["roles"].includes("FACULTY")))
      return NextResponse.json({error:"FACULTY_ROLE_REQUIRED"},{status:400});
    // Membership, role grant and optional faculty department/profile now
    // commit together. Never return an active partially registered teacher.
    const person = await onboardPersonWithRuntime(context, body, facultyProfile);
    return NextResponse.json({ person,profileIncomplete:false },{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return apiErrorResponse(error);
  }
}
