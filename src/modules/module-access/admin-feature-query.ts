import {z} from "zod";
export const adminFeatureQuerySchema=z.strictObject({
 q:z.string().trim().max(100).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
 sort:z.enum(["NAME","CODE"]).default("NAME"),
 module:z.enum(["projects","placements","electives"]).optional(),
 storedState:z.enum(["ALL","ON","OFF"]).default("ALL"),
 locks:z.enum(["ALL","LOCKED"]).default("ALL"),
});
export type AdminFeatureQuery=z.infer<typeof adminFeatureQuerySchema>;
