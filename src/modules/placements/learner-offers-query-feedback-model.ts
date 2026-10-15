import { z } from "zod";
const uuid=z.string().uuid();
const schema=z.strictObject({
 status:z.enum(["all","pending","accepted","closed","declined","withdrawn"]).optional(),
 q:z.string().trim().max(80).optional(),
 due:z.enum(["0","1"]).optional(),
 page:z.string().regex(/^[1-9][0-9]{0,3}$/).optional(),
 sort:z.enum(["priority","newest","company"]).optional(),
 kind:z.enum(["all","offer","loi"]).optional(),
 joining:z.enum(["all","joined","pending","deferred","did-not-join","not-recorded"]).optional(),
 focus:uuid.optional(),
});
/** Invalid URL arguments never become authorizations or backend selectors. */
export function learnerOffersQueryHasInvalidFields(input:Record<string,unknown>){
 return !schema.safeParse(input).success;
}
