import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { StatusBadge } from "@/components/ui/status-badge";
import {TpoCompanyVisibilityEditor} from "@/components/tpo/tpo-company-visibility-editor";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  describeTpoCompanyVisibility,
} from "@/modules/placements/tpo-company-visibility-model";
import {
  getCompanyVisibilitySettings,
} from "@/modules/placements/tpo-policy-service";

export const dynamic = "force-dynamic";

export default async function TpoWhatCompaniesSeePage() {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  // The reader independently requires placements.manage
  // for this exact college and verifies the active
  // college through the centralized placement scope.
  const visibility =
    await getCompanyVisibilitySettings(
      context,
      context.membership.collegeId,
    );

  const settings =
    describeTpoCompanyVisibility(visibility);

  const sourceLabel =
    settings.source === "PERSISTED"
      ? "Saved for your college"
      : "Standard college settings";

  return (
    <div className="space-y-6">
      <TpoSettingsNav active="see" />

      <section className="space-y-2">
        <h2 className="m-0 text-xl font-semibold text-foreground">
          What Companies See
        </h2>
        <p className="text-sm leading-6 text-body">
          Review the data-sharing permissions configured
          for recruiters viewing learner information
          through your college&apos;s placement workflows.
          Edit the sharing policy below and save your choices.
        </p>
      </section>

      <TpoCompanyVisibilityEditor collegeId={context.membership.collegeId}
       version={visibility.version}
       initial={{showCgpaExact:visibility.showCgpaExact,showTenthTwelfth:visibility.showTenthTwelfth,
        showProjectLinks:visibility.showProjectLinks,showAssessmentScores:visibility.showAssessmentScores,
        showAttendance:visibility.showAttendance}}/>
      <section
        aria-label="Company visibility policy source"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-base font-semibold text-foreground">
              College sharing policy
            </h3>
            <p className="mt-1 text-sm leading-6 text-body">
              {settings.source === "PERSISTED"
                ? "These choices are saved for your college."
                : "These are the standard college settings until your team saves its own choices."}
            </p>
          </div>

          <StatusBadge
            tone={
              settings.source === "PERSISTED"
                ? "success"
                : "info"
            }
          >
            {sourceLabel}
          </StatusBadge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Sharing flags enabled
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {settings.enabledCount}
            </p>
          </div>

          <div className="rounded-lg bg-surface-subtle p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Sharing flags disabled
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {settings.disabledCount}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="company-visibility-fields"
        className="space-y-3"
      >
        <div>
          <h3
            id="company-visibility-fields"
            className="m-0 text-lg font-semibold text-foreground"
          >
            Recruiter-visible fields
          </h3>
          <p className="mt-1 text-sm leading-6 text-body">
            Each flag determines whether the college&apos;s
            sharing policy permits the corresponding
            information to appear in a recruiter-facing
            view when that information is available.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {settings.fields.map((field) => (
            <article
              key={field.key}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h4 className="m-0 text-base font-semibold text-foreground">
                  {field.label}
                </h4>

                <StatusBadge
                  tone={
                    field.enabled
                      ? "success"
                      : "neutral"
                  }
                >
                  {field.enabled
                    ? "Allowed"
                    : "Not shared"}
                </StatusBadge>
              </div>

              <p className="mt-3 text-sm leading-6 text-body">
                {field.explanation}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Sharing policy:
                </span>

                <StatusBadge
                  tone={
                    field.source === "PERSISTED"
                      ? "success"
                      : "info"
                  }
                >
                  {field.source === "PERSISTED"
                    ? "Persisted"
                    : "Standard college settings"}
                </StatusBadge>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-label="Company visibility methodology"
        className="rounded-xl border border-border bg-surface-subtle p-4 text-sm leading-6 text-body"
      >
        <h3 className="m-0 text-sm font-semibold text-foreground">
          How these settings work
        </h3>

        <p className="mt-2">
          An allowed flag is permission to include
          available information; it does not guarantee
          that every learner has supplied that
          information or that every recruiter view
          displays it. A disabled flag represents the
          college&apos;s intended sharing restriction.
        </p>

        <p className="mt-2">
          These settings do not grant access to a
          recruiter by themselves. Company
          relationships, recruiter authorization,
          consent, and any applicable share permissions
          remain separate controls.
        </p>
      </section>

    </div>
  );
}
