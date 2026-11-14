import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const adminMembershipDetailIdSchema=zUuid;
export type AdminMembershipDetailFact={
 id:string;userId:string;name:string|null;collegeName:string;
 platformStatus:"ACTIVE"|"DISABLED";membershipStatus:string;roles:readonly string[];
 email:string|null;phoneE164:string|null;createdAt:Date;updatedAt:Date;
};
export function projectAdminMembershipDetail(fact:AdminMembershipDetailFact,selected:string|null,college:string) {
 const contactVisible=Boolean(selected&&selected===college);
 return {...fact,contactVisible,email:contactVisible?fact.email:null,phoneE164:contactVisible?fact.phoneE164:null};
}
