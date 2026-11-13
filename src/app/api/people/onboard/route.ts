import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { requireRecentDeviceAuthentication } from "@/auth/recent-device-auth";
import { requirePermission } from "@/modules/permissions/policy";
import { onboardPersonInputSchema } from "@/modules/people/validation";
import { readBoundedAuthJson, AuthRequestBodyTooLarge } from "@/modules/auth/bounded-json";
import { onboardPersonWithRuntime } from "@/modules/people/runtime";

import {z} from "zod";

import { ROLE } from "@/modules/identity/roles";
import { noStoreJson } from "@/security/responses";
export const runtime = "nodejs";

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    let body: unknown;
    try {
      body = await readBoundedAuthJson(request, 8_192);
    } catch (error) {
      const tooLarge=error instanceof AuthRequestBodyTooLarge;
      return NextResponse.json(
        { error: tooLarge?"REQUEST_TOO_LARGE":"INVALID_REQUEST" },
        { status: tooLarge?413:400 },
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
    if(facultyProfile&&(!Array.isArray(parsed.data["roles"])||!parsed.data["roles"].includes(ROLE.FACULTY)))
      return NextResponse.json({error:"FACULTY_ROLE_REQUIRED"},{status:400});
    const validatedPerson = onboardPersonInputSchema.parse(body);
    if (validatedPerson.roles.some(role =>
      role === ROLE.COLLEGE_ADMIN || role === ROLE.TPO)) {
      requirePermission(context, "admin-scope.select");
    }
    await requireRecentDeviceAuthentication(context.user.id);
    const person = await onboardPersonWithRuntime(context, body, facultyProfile);
    return noStoreJson({ person,profileIncomplete:false });
  },
);
