import { z } from "zod";

export const departmentIdSchema = z.string().uuid();
export const collegeIdSchema = z.string().uuid();

export const departmentNameSchema = z
  .string()
  .trim()
  .min(1, "Department name is required")
  .max(255, "Department name must be 255 characters or less");

export const createDepartmentInputSchema = z.object({
  collegeId: collegeIdSchema,
  name: departmentNameSchema,
});

export const renameDepartmentInputSchema = z.object({
  name: departmentNameSchema,
});

export type CreateDepartmentInput = z.infer<
  typeof createDepartmentInputSchema
>;
export type RenameDepartmentInput = z.infer<
  typeof renameDepartmentInputSchema
>;
