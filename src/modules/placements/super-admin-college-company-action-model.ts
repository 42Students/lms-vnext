import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const superAdminCollegeCompanyActionSchema=z.strictObject({
 relationshipId:zUuid,
 action:z.enum(["ARCHIVE","RESTORE"]),
 confirmed:z.literal(true),
});
