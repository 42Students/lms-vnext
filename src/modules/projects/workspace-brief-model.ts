import {z} from "zod";
export const workspaceBriefSchema=z.strictObject({
 goal:z.string().trim().max(2000),
 description:z.string().trim().max(4000),
 deliverables:z.array(z.string().trim().min(1).max(500)).max(50),
 completionConditions:z.array(z.string().trim().min(1).max(500)).max(50),
 personas:z.array(z.string().trim().min(1).max(500)).max(50),
});
export const updateWorkspaceBriefSchema=z.strictObject({
 brief:workspaceBriefSchema,
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
export type WorkspaceBrief=z.infer<typeof workspaceBriefSchema>;
export const emptyWorkspaceBrief:WorkspaceBrief={
 goal:"",description:"",deliverables:[],completionConditions:[],personas:[],
};
export function parseWorkspaceBrief(value:unknown):WorkspaceBrief {
 const result=workspaceBriefSchema.safeParse(value);
 return result.success?result.data:emptyWorkspaceBrief;
}
