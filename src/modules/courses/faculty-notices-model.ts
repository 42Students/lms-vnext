import { z } from "zod";

/** No promoted Section notice table exists. Never accept a client college ID. */
export const facultyNoticeParamsSchema = z.object({
  deliveryId: z.string().uuid(),
}).strict();

export const FACULTY_SECTION_NOTICES_BLOCKER =
  "The college Section notice board is unavailable: DB10 announcement storage is not yet promoted. Use the authorized Course Discussions page for Section messages.";
