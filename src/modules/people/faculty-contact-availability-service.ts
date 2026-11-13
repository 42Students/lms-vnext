import "server-only";
import {AuthorizationError,can} from "@/modules/permissions/policy";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {getOwnFacultyProfileWithRuntime} from "@/modules/people/runtime";

import {facultyContactReadQuerySchema,facultyContactStorageAvailability} from "./faculty-contact-availability-model";

import { ROLE } from "@/modules/identity/roles";
export async function getOwnFacultyContactAvailability(context:RequestContext,raw:unknown){
 facultyContactReadQuerySchema.parse(raw);
 const membership=context.membership;
 if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,ROLE.FACULTY)||
 hasMembershipRole(context,ROLE.MENTOR)||hasMembershipRole(context,ROLE.COLLEGE_ADMIN)||
 !can(context,"profile.self.manage",{
  collegeId:membership.collegeId,organizationId:membership.organizationId,
 }))throw new AuthorizationError("profile.self.manage");
 const {person}=await getOwnFacultyProfileWithRuntime(context);
 return {
   ...facultyContactStorageAvailability(),
   displayName:person.user.displayName,
   loginEmail:person.user.email,loginPhone:person.user.phoneE164,
   alternatePhone:null as string|null,contactEmail:null as string|null,
 };
}
