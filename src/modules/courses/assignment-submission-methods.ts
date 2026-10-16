import {z} from "zod";

/** Legacy authoring choices. These are policy choices, not submission type enums. */
export const assignmentMethodSchema=z.enum([
 "WRITTEN_RESPONSE","PDF_UPLOAD","FILE_UPLOAD","REPOSITORY_LINK","EXTERNAL_LINK",
]);
export const assignmentMethodsSchema=z.array(assignmentMethodSchema)
 .min(1).max(5).refine(methods=>new Set(methods).size===methods.length,{
  message:"Choose each submission method at most once",
 });
export type AssignmentMethod=z.infer<typeof assignmentMethodSchema>;
export const ALL_ASSIGNMENT_METHODS:AssignmentMethod[]=[
 "WRITTEN_RESPONSE","PDF_UPLOAD","FILE_UPLOAD","REPOSITORY_LINK","EXTERNAL_LINK",
];
export const ASSIGNMENT_METHOD_LABELS:Record<AssignmentMethod,string>={
 WRITTEN_RESPONSE:"Written Response",PDF_UPLOAD:"PDF Upload",
 FILE_UPLOAD:"File Upload",REPOSITORY_LINK:"Repository Link",
 EXTERNAL_LINK:"Website / External Link",
};
/** Conservative default while migrating: never silently discard permitted types. */
export function normalizeAssignmentMethods(input:unknown):AssignmentMethod[]{
 const parsed=assignmentMethodsSchema.safeParse(input);
 return parsed.success?parsed.data:ALL_ASSIGNMENT_METHODS;
}
