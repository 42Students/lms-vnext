import { z } from "zod";

export const collegeNoticeInboxQuerySchema = z.strictObject({
  unreadOnly: z.enum(["0", "1"]).default("0"),
});

export type CollegeNoticeSource = {
  id: string;
  title: string;
  body: string;
  actionHref: string | null;
  createdAt: Date;
  readAt: Date | null;
};

export function collegeNoticeInboxProjection(rows: readonly CollegeNoticeSource[]) {
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    body: row.body,
    actionHref: row.actionHref,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  }));
}
