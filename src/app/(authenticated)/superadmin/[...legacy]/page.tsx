import { and, eq, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getDb } from "@/db/client";
import { projectInstances, projectTemplates } from "@/db/schema";
import { isSuperAdmin, type RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import { getProjectAdminCollegeId } from "@/modules/projects/admin-college-scope";
import { legacySuperAdminDestination } from "@/modules/admin-ui/legacy-superadmin-destination-model";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_LEGACY_ID = /^[1-9][0-9]{0,9}$/;

/**
 * Template slugs and UUIDs are unambiguous in vNext. Legacy numeric IDs are
 * NOT template IDs: without a migration crosswalk, a number must never be
 * guessed into a different template's UUID.
 */
async function resolveTemplateBookmark(context: RequestContext, token: string) {
  requirePermission(context, "project-template.read");
  if (token.length > 96 || !token || token === "." || token === ".." ||
      NUMERIC_LEGACY_ID.test(token)) return null;
  const match = UUID.test(token)
    ? eq(projectTemplates.id, token)
    : eq(projectTemplates.slug, token);
  const [template] = await getDb()
    .select({ id: projectTemplates.id })
    .from(projectTemplates)
    .where(match)
    .limit(1);
  return template?.id ?? null;
}

/**
 * Workspaces always resolve inside the CURRENT selected Super Admin college.
 * Numeric legacy IDs and slugs are lookup keys, never authorization grants.
 */
async function resolveWorkspaceBookmark(context: RequestContext, token: string) {
  const collegeId = getProjectAdminCollegeId(context);
  if (!collegeId || !token || token.length > 96) return null;
  let lookup: ReturnType<typeof eq>;
  if (UUID.test(token)) lookup = eq(projectInstances.id, token);
  else if (NUMERIC_LEGACY_ID.test(token)) {
    const legacyId = Number(token);
    if (!Number.isSafeInteger(legacyId) || legacyId > 2_147_483_647) return null;
    lookup = eq(projectInstances.legacyProjectId, legacyId);
  } else if (/^[a-z0-9-]+$/i.test(token)) {
    lookup = eq(projectInstances.slug, token);
  } else return null;

  const matches = await getDb().select({ id: projectInstances.id })
    .from(projectInstances)
    .where(and(
      eq(projectInstances.collegeId, collegeId),
      isNull(projectInstances.deletedAt),
      lookup,
    ))
    .limit(2);
  return matches.length === 1 ? matches[0]!.id : null;
}

async function nestedProjectDestination(
  context: RequestContext,
  segments: readonly string[],
): Promise<string | null> {
  if (segments[0]?.toLowerCase() !== "projects") return null;
  if (segments.length === 1) return "/admin/projects/templates";

  const route = segments[1]?.toLowerCase();
  if (segments.length === 2) {
    if (route === "at-risk") return "/admin/projects/at-risk";
    if (route === "audit") return "/admin/projects/audit";
    if (route === "readiness") return "/admin/projects/readiness";
    if (route === "templates") return "/admin/projects/templates";
  }

  if (route === "templates" &&
      (segments.length === 3 ||
       (segments.length === 4 && (segments[3] === "overview" || segments[3] === "colleges")))) {
    const id = await resolveTemplateBookmark(context, segments[2]!);
    if (!id) return null;
    return segments[3] === "colleges"
      ? `/admin/projects/templates/${id}/colleges`
      : `/admin/projects/templates/${id}`;
  }

  if (route === "workspaces" && segments.length === 4 &&
      (segments[3] === "overview" || segments[3] === "resources")) {
    const id = await resolveWorkspaceBookmark(context, segments[2]!);
    return id ? `/admin/projects/${id}/${segments[3]}` : null;
  }
  return null;
}

export default async function LegacySuperAdminRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ legacy: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  const [{ legacy }, query] = await Promise.all([params, searchParams]);
  const type = typeof query.type === "string" ? query.type : undefined;
  const destination = await nestedProjectDestination(context, legacy) ??
    legacySuperAdminDestination(legacy, type);
  if (!destination) notFound();

  // Pass only supported, bounded navigation state. A forged query college may
  // not switch the signed-in user's selected college (or global Admin scope).
  const search = new URLSearchParams();
  if (typeof query.q === "string" && query.q.length <= 100) {
    search.set("q", query.q);
  }
  if (typeof query.from === "string" && /^[a-z0-9_-]{1,64}$/i.test(query.from)) {
    search.set("from", query.from);
  }
  const selectedCollegeId = context.adminScope?.collegeId;
  if (selectedCollegeId &&
      (query.collegeId === selectedCollegeId || query.college === selectedCollegeId)) {
    search.set("collegeId", selectedCollegeId);
  }
  return redirect(destination + (search.size ? "?" + search.toString() : ""));
}
