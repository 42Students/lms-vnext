"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export type PlacementCompanyChoice = {
  relationshipId: string;
  name: string;
  primaryDomain: string | null;
  isTrusted: boolean;
};

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";
const textareaClass =
  "min-h-28 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function requestJson(
  url: string,
  method: "POST" | "PUT",
  body: unknown,
) {
  const response = await fetch(url, {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as
    | Record<string, unknown>
    | null;
  if (!response.ok) {
    const code =
      typeof payload?.error === "string"
        ? payload.error
        : "REQUEST_FAILED";
    throw new Error(
      code
        .toLowerCase()
        .split("_")
        .map(
          (part) =>
            part.charAt(0).toUpperCase() +
            part.slice(1),
        )
        .join(" "),
    );
  }
  return payload ?? {};
}

function nullableDecimal(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function nullableInteger(
  value: string,
  multiplier = 1,
) {
  const parsed = nullableDecimal(value);
  return parsed === null
    ? null
    : Math.round(parsed * multiplier);
}

export function PlacementJobCreateForm({
  collegeId,
  companies,
  basePath,
}: {
  collegeId: string;
  companies: readonly PlacementCompanyChoice[];
  basePath: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [companyMode, setCompanyMode] =
    useState<"EXISTING" | "NEW">(
      companies.length > 0
        ? "EXISTING"
        : "NEW",
    );
  const [
    companyRelationshipId,
    setCompanyRelationshipId,
  ] = useState(
    companies[0]?.relationshipId ?? "",
  );
  const [pending, setPending] =
    useState(false);
  const [publishNow, setPublishNow] =
    useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPending(true);

    try {
      const data = new FormData(
        event.currentTarget,
      );
      let relationshipId =
        companyRelationshipId;

      if (companyMode === "NEW") {
        const companyResult =
          await requestJson(
            "/api/placements/companies",
            "POST",
            {
              collegeId,
              name: String(
                data.get("companyName") ??
                  "",
              ).trim(),
              websiteUrl:
                String(
                  data.get(
                    "companyWebsite",
                  ) ?? "",
                ).trim() || undefined,
              primaryDomain:
                String(
                  data.get("companyDomain") ??
                    "",
                ).trim() || undefined,
              isTrusted:
                data.get("companyTrusted") ===
                "on",
            },
          );
        const relationship =
          companyResult.relationship as
            | { id?: string }
            | undefined;
        if (!relationship?.id) {
          throw new Error(
            "Company relationship was not returned",
          );
        }
        relationshipId = relationship.id;
      }

      if (!relationshipId) {
        throw new Error(
          "Choose or create an employer",
        );
      }

      const applicationMode = String(
        data.get("applicationMode") ??
          "INTERNAL",
      );
      const deadlineRaw = String(
        data.get("applicationDeadline") ??
          "",
      );
      const jobResult = await requestJson(
        "/api/placements/jobs",
        "POST",
        {
          collegeId,
          companyRelationshipId:
            relationshipId,
          title: String(
            data.get("title") ?? "",
          ).trim(),
          description: String(
            data.get("description") ?? "",
          ).trim(),
          employmentType: String(
            data.get("employmentType") ??
              "FULL_TIME",
          ),
          workMode: String(
            data.get("workMode") ??
              "ONSITE",
          ),
          locations: splitList(
            String(
              data.get("locations") ?? "",
            ),
          ),
          openings: nullableInteger(
            String(
              data.get("openings") ?? "",
            ),
          ),
          minimumAnnualCtcInr:
            nullableInteger(
              String(
                data.get("minimumLpa") ??
                  "",
              ),
              100_000,
            ),
          maximumAnnualCtcInr:
            nullableInteger(
              String(
                data.get("maximumLpa") ??
                  "",
              ),
              100_000,
            ),
          applicationMode,
          externalApplicationUrl:
            applicationMode === "INTERNAL"
              ? null
              : String(
                  data.get(
                    "externalApplicationUrl",
                  ) ?? "",
                ).trim() || null,
          applicationDeadline:
            deadlineRaw
              ? new Date(
                  deadlineRaw,
                ).toISOString()
              : null,
        },
      );

      const jobId =
        typeof jobResult.id === "string"
          ? jobResult.id
          : null;
      if (!jobId) {
        throw new Error(
          "Created job id was not returned",
        );
      }

      await requestJson(
        `/api/placements/jobs/${jobId}/eligibility-policy`,
        "PUT",
        {
          allowedProgramIds: [],
          allowedCohortIds: [],
          minCgpa: nullableDecimal(
            String(
              data.get("minCgpa") ?? "",
            ),
          ),
          maxActiveBacklogs:
            nullableInteger(
              String(
                data.get(
                  "maxActiveBacklogs",
                ) ?? "",
              ),
            ),
          maxPastBacklogs:
            nullableInteger(
              String(
                data.get(
                  "maxPastBacklogs",
                ) ?? "",
              ),
            ),
          minTenthPercentage:
            nullableDecimal(
              String(
                data.get(
                  "minTenthPercentage",
                ) ?? "",
              ),
            ),
          minTwelfthPercentage:
            nullableDecimal(
              String(
                data.get(
                  "minTwelfthPercentage",
                ) ?? "",
              ),
            ),
          minDiplomaPercentage:
            nullableDecimal(
              String(
                data.get(
                  "minDiplomaPercentage",
                ) ?? "",
              ),
            ),
          minUndergraduatePercentage:
            nullableDecimal(
              String(
                data.get(
                  "minUndergraduatePercentage",
                ) ?? "",
              ),
            ),
          maxGapYears: nullableInteger(
            String(
              data.get("maxGapYears") ?? "",
            ),
          ),
          allowedPassingYears:
            splitList(
              String(
                data.get(
                  "passingYears",
                ) ?? "",
              ),
            ).map(Number),
          missingEvidencePolicy: String(
            data.get(
              "missingEvidencePolicy",
            ) ?? "ALLOW_WITH_FLAG",
          ),
        },
      );

      if (publishNow) {
        await requestJson(
          `/api/placements/jobs/${jobId}/status`,
          "POST",
          { action: "PUBLISH" },
        );
      }

      showToast({
        tone: "success",
        title: publishNow
          ? "Opportunity published"
          : "Draft opportunity created",
        description:
          "Continue in the drive workspace to configure rounds and run the hiring process.",
      });
      router.push(
        `${basePath}/jobs/${jobId}`,
      );
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not create opportunity",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Employer
          </h2>
          <p className="mt-1 text-sm text-body">
            Reuse college relationship memory or create a canonical employer relationship once.
          </p>
        </div>
        <div className="grid gap-4 p-5">
          {companies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                type="button"
                variant={
                  companyMode ===
                  "EXISTING"
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  setCompanyMode(
                    "EXISTING",
                  )
                }
              >
                Existing employer
              </Button>
              <Button
                size="sm"
                type="button"
                variant={
                  companyMode === "NEW"
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  setCompanyMode("NEW")
                }
              >
                New employer
              </Button>
            </div>
          ) : null}

          {companyMode === "EXISTING" ? (
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-body">
                Employer
              </span>
              <select
                className={inputClass}
                required
                value={
                  companyRelationshipId
                }
                onChange={(event) =>
                  setCompanyRelationshipId(
                    event.target.value,
                  )
                }
              >
                {companies.map((company) => (
                  <option
                    key={
                      company.relationshipId
                    }
                    value={
                      company.relationshipId
                    }
                  >
                    {company.name}
                    {company.isTrusted
                      ? " · trusted"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  Company name
                </span>
                <input
                  className={inputClass}
                  name="companyName"
                  required
                  maxLength={200}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  Primary domain
                </span>
                <input
                  className={inputClass}
                  name="companyDomain"
                  placeholder="example.com"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  Website
                </span>
                <input
                  className={inputClass}
                  name="companyWebsite"
                  type="url"
                  placeholder="https://example.com"
                />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-body">
                <input
                  name="companyTrusted"
                  type="checkbox"
                />
                Mark relationship as trusted
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Opportunity
          </h2>
          <p className="mt-1 text-sm text-body">
            Create the learner-facing job opportunity and application window.
          </p>
        </div>
        <div className="grid gap-4 p-5 lg:grid-cols-2">
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Job title
            </span>
            <input
              className={inputClass}
              name="title"
              required
              maxLength={200}
              placeholder="Software Development Engineer"
            />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Description
            </span>
            <textarea
              className={textareaClass}
              name="description"
              required
              maxLength={20000}
              placeholder="Role, responsibilities, requirements and hiring context."
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Employment type
            </span>
            <select
              className={inputClass}
              name="employmentType"
              defaultValue="FULL_TIME"
            >
              <option value="FULL_TIME">
                Full time
              </option>
              <option value="INTERNSHIP">
                Internship
              </option>
              <option value="CONTRACT">
                Contract
              </option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Work mode
            </span>
            <select
              className={inputClass}
              name="workMode"
              defaultValue="ONSITE"
            >
              <option value="ONSITE">
                Onsite
              </option>
              <option value="HYBRID">
                Hybrid
              </option>
              <option value="REMOTE">
                Remote
              </option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Locations
            </span>
            <input
              className={inputClass}
              name="locations"
              placeholder="Hyderabad, Bengaluru"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Openings
            </span>
            <input
              className={inputClass}
              name="openings"
              type="number"
              min={1}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Minimum CTC (LPA)
            </span>
            <input
              className={inputClass}
              name="minimumLpa"
              type="number"
              min={0}
              step="0.1"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Maximum CTC (LPA)
            </span>
            <input
              className={inputClass}
              name="maximumLpa"
              type="number"
              min={0}
              step="0.1"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Application mode
            </span>
            <select
              className={inputClass}
              name="applicationMode"
              defaultValue="INTERNAL"
            >
              <option value="INTERNAL">
                LMS application
              </option>
              <option value="HYBRID">
                LMS or employer form
              </option>
              <option value="EXTERNAL_ONLY">
                Employer form only
              </option>
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Employer application URL
            </span>
            <input
              className={inputClass}
              name="externalApplicationUrl"
              type="url"
              placeholder="Required for hybrid/external-only"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Application deadline
            </span>
            <input
              className={inputClass}
              name="applicationDeadline"
              type="datetime-local"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Eligibility
          </h2>
          <p className="mt-1 text-sm text-body">
            Configure explainable numeric requirements now. Program/cohort scoping can remain empty when the opportunity is open across the college.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["minCgpa", "Minimum CGPA", "0.01"],
            [
              "maxActiveBacklogs",
              "Max active backlogs",
              "1",
            ],
            [
              "maxPastBacklogs",
              "Max past backlogs",
              "1",
            ],
            [
              "maxGapYears",
              "Max gap years",
              "1",
            ],
            [
              "minTenthPercentage",
              "Minimum 10th %",
              "0.01",
            ],
            [
              "minTwelfthPercentage",
              "Minimum 12th %",
              "0.01",
            ],
            [
              "minDiplomaPercentage",
              "Minimum diploma %",
              "0.01",
            ],
            [
              "minUndergraduatePercentage",
              "Minimum UG %",
              "0.01",
            ],
          ].map(
            ([name, label, step]) => (
              <label key={name}>
                <span className="mb-1.5 block text-xs font-semibold text-body">
                  {label}
                </span>
                <input
                  className={inputClass}
                  name={name}
                  type="number"
                  min={0}
                  step={step}
                />
              </label>
            ),
          )}
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Passing years
            </span>
            <input
              className={inputClass}
              name="passingYears"
              placeholder="2026, 2027"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Missing evidence
            </span>
            <select
              className={inputClass}
              name="missingEvidencePolicy"
              defaultValue="ALLOW_WITH_FLAG"
            >
              <option value="ALLOW_WITH_FLAG">
                Allow with missing-data flag
              </option>
              <option value="REQUIRE_COMPLETE">
                Require complete evidence
              </option>
            </select>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm font-semibold text-body">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(event) =>
              setPublishNow(
                event.target.checked,
              )
            }
          />
          Publish immediately after creation
        </label>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Creating…"
            : publishNow
              ? "Create & publish"
              : "Create draft"}
        </Button>
      </section>
    </form>
  );
}
