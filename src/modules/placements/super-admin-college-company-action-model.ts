import {z} from "zod";
export const superAdminCollegeCompanyActionSchema=z.strictObject({
 relationshipId:z.uuid(),
 action:z.enum(["ARCHIVE","RESTORE"]),
 confirmed:z.literal(true),
});
