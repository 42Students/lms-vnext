"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

type Option = {
  id: string;
  name: string;
  code?: string;
};

type CohortOption = Option & {
  programName: string;
};

async function jsonRequest(
  path: string,
  body: unknown,
) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error ?? "REQUEST_FAILED",
    );
  }

  return payload;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]"
    >
      {children}
    </label>
  );
}

export function AcademicsCreatePanel({
  collegeId,
  departments,
  periods,
  programs,
  cohorts,
}: {
  collegeId: string;
  departments: readonly Option[];
  periods: readonly Option[];
  programs: readonly Option[];
  cohorts: readonly CohortOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] =
    useTransition();

  const [programDepartmentId, setProgramDepartmentId] =
    useState("");
  const [programName, setProgramName] =
    useState("");
  const [programCode, setProgramCode] =
    useState("");
  const [durationTerms, setDurationTerms] =
    useState("8");

  const [periodName, setPeriodName] =
    useState("");
  const [periodCode, setPeriodCode] =
    useState("");
  const [periodStart, setPeriodStart] =
    useState("");
  const [periodEnd, setPeriodEnd] =
    useState("");

  const [cohortProgramId, setCohortProgramId] =
    useState("");
  const [cohortName, setCohortName] =
    useState("");
  const [cohortCode, setCohortCode] =
    useState("");
  const [cohortStartPeriodId, setCohortStartPeriodId] =
    useState("");
  const [cohortEndPeriodId, setCohortEndPeriodId] =
    useState("");

  const [sectionCohortId, setSectionCohortId] =
    useState("");
  const [sectionPeriodId, setSectionPeriodId] =
    useState("");
  const [sectionName, setSectionName] =
    useState("");
  const [sectionCode, setSectionCode] =
    useState("");
  const [sectionCapacity, setSectionCapacity] =
    useState("");

  function run(
    task: () => Promise<unknown>,
    successTitle: string,
    reset: () => void,
  ) {
    startTransition(async () => {
      try {
        await task();
        reset();
        showToast({
          tone: "success",
          title: successTitle,
        });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: "Academic update failed",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  function createProgram(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        jsonRequest("/api/academics/programs", {
          departmentId: programDepartmentId,
          name: programName,
          code: programCode,
          durationTerms: Number(durationTerms),
        }),
      "Program created",
      () => {
        setProgramName("");
        setProgramCode("");
      },
    );
  }

  function createPeriod(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        jsonRequest("/api/academics/periods", {
          collegeId,
          name: periodName,
          code: periodCode,
          startDate: periodStart,
          endDate: periodEnd,
        }),
      "Academic period created",
      () => {
        setPeriodName("");
        setPeriodCode("");
        setPeriodStart("");
        setPeriodEnd("");
      },
    );
  }

  function createCohort(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        jsonRequest("/api/academics/cohorts", {
          programId: cohortProgramId,
          name: cohortName,
          code: cohortCode,
          startPeriodId: cohortStartPeriodId,
          expectedEndPeriodId:
            cohortEndPeriodId || null,
        }),
      "Cohort created",
      () => {
        setCohortName("");
        setCohortCode("");
      },
    );
  }

  function createSection(event: FormEvent) {
    event.preventDefault();
    run(
      () =>
        jsonRequest("/api/academics/sections", {
          cohortId: sectionCohortId,
          academicPeriodId: sectionPeriodId,
          name: sectionName,
          code: sectionCode,
          capacity: sectionCapacity
            ? Number(sectionCapacity)
            : null,
        }),
      "Section created",
      () => {
        setSectionName("");
        setSectionCode("");
        setSectionCapacity("");
      },
    );
  }

  return (
    <section className="grid min-w-0 gap-[var(--lms-space-5)] xl:grid-cols-2">
      <form
        onSubmit={createPeriod}
        className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-5)]"
      >
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
          New academic period
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Create the College calendar window before placing Cohorts or Sections.
        </p>
        <div className="mt-4 grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="academic-period-name">
              Name
            </FieldLabel>
            <Input
              id="academic-period-name"
              value={periodName}
              onChange={(event) =>
                setPeriodName(event.target.value)
              }
              placeholder="Semester 1"
              maxLength={255}
            />
          </div>
          <div>
            <FieldLabel htmlFor="academic-period-code">
              Code
            </FieldLabel>
            <Input
              id="academic-period-code"
              value={periodCode}
              onChange={(event) =>
                setPeriodCode(event.target.value)
              }
              placeholder="2026-S1"
              maxLength={64}
            />
          </div>
          <div>
            <FieldLabel htmlFor="academic-period-start">
              Start date
            </FieldLabel>
            <Input
              id="academic-period-start"
              type="date"
              value={periodStart}
              onChange={(event) =>
                setPeriodStart(event.target.value)
              }
            />
          </div>
          <div>
            <FieldLabel htmlFor="academic-period-end">
              End date
            </FieldLabel>
            <Input
              id="academic-period-end"
              type="date"
              value={periodEnd}
              onChange={(event) =>
                setPeriodEnd(event.target.value)
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            disabled={
              pending ||
              !periodName.trim() ||
              !periodCode.trim() ||
              !periodStart ||
              !periodEnd
            }
          >
            Create period
          </Button>
        </div>
      </form>

      <form
        onSubmit={createProgram}
        className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-5)]"
      >
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
          New program
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Programs are owned by Departments; duration is measured in academic terms.
        </p>
        <div className="mt-4 grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="program-department">
              Department
            </FieldLabel>
            <Select
              id="program-department"
              value={programDepartmentId}
              onChange={(event) =>
                setProgramDepartmentId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select department
              </option>
              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="program-name">
              Name
            </FieldLabel>
            <Input
              id="program-name"
              value={programName}
              onChange={(event) =>
                setProgramName(event.target.value)
              }
              placeholder="Computer Science Engineering"
              maxLength={255}
            />
          </div>
          <div>
            <FieldLabel htmlFor="program-code">
              Code
            </FieldLabel>
            <Input
              id="program-code"
              value={programCode}
              onChange={(event) =>
                setProgramCode(event.target.value)
              }
              placeholder="CSE"
              maxLength={64}
            />
          </div>
          <div>
            <FieldLabel htmlFor="program-duration">
              Duration terms
            </FieldLabel>
            <Input
              id="program-duration"
              type="number"
              min={1}
              max={24}
              value={durationTerms}
              onChange={(event) =>
                setDurationTerms(event.target.value)
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            disabled={
              pending ||
              !programDepartmentId ||
              !programName.trim() ||
              !programCode.trim()
            }
          >
            Create program
          </Button>
        </div>
      </form>

      <form
        onSubmit={createCohort}
        className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-5)]"
      >
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
          New cohort / batch
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Cohorts are long-lived Program intakes; learner term progression is stored separately.
        </p>
        <div className="mt-4 grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="cohort-program">
              Program
            </FieldLabel>
            <Select
              id="cohort-program"
              value={cohortProgramId}
              onChange={(event) =>
                setCohortProgramId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select program
              </option>
              {programs.map((program) => (
                <option
                  key={program.id}
                  value={program.id}
                >
                  {program.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="cohort-name">
              Name
            </FieldLabel>
            <Input
              id="cohort-name"
              value={cohortName}
              onChange={(event) =>
                setCohortName(event.target.value)
              }
              placeholder="2026 Intake"
              maxLength={255}
            />
          </div>
          <div>
            <FieldLabel htmlFor="cohort-code">
              Code
            </FieldLabel>
            <Input
              id="cohort-code"
              value={cohortCode}
              onChange={(event) =>
                setCohortCode(event.target.value)
              }
              placeholder="2026"
              maxLength={64}
            />
          </div>
          <div>
            <FieldLabel htmlFor="cohort-start-period">
              Start period
            </FieldLabel>
            <Select
              id="cohort-start-period"
              value={cohortStartPeriodId}
              onChange={(event) =>
                setCohortStartPeriodId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select start period
              </option>
              {periods.map((period) => (
                <option
                  key={period.id}
                  value={period.id}
                >
                  {period.name}
                  {period.code
                    ? ` · ${period.code}`
                    : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="cohort-end-period">
              Expected end · optional
            </FieldLabel>
            <Select
              id="cohort-end-period"
              value={cohortEndPeriodId}
              onChange={(event) =>
                setCohortEndPeriodId(
                  event.target.value,
                )
              }
            >
              <option value="">
                No expected end yet
              </option>
              {periods.map((period) => (
                <option
                  key={period.id}
                  value={period.id}
                >
                  {period.name}
                  {period.code
                    ? ` · ${period.code}`
                    : ""}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            disabled={
              pending ||
              !cohortProgramId ||
              !cohortName.trim() ||
              !cohortCode.trim() ||
              !cohortStartPeriodId
            }
          >
            Create cohort
          </Button>
        </div>
      </form>

      <form
        onSubmit={createSection}
        className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-5)]"
      >
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
          New section
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Sections are period-specific. Rosters and movement history attach here.
        </p>
        <div className="mt-4 grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="section-cohort">
              Cohort
            </FieldLabel>
            <Select
              id="section-cohort"
              value={sectionCohortId}
              onChange={(event) =>
                setSectionCohortId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select cohort
              </option>
              {cohorts.map((cohort) => (
                <option
                  key={cohort.id}
                  value={cohort.id}
                >
                  {cohort.programName} · {cohort.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="section-period">
              Academic period
            </FieldLabel>
            <Select
              id="section-period"
              value={sectionPeriodId}
              onChange={(event) =>
                setSectionPeriodId(
                  event.target.value,
                )
              }
            >
              <option value="">
                Select period
              </option>
              {periods.map((period) => (
                <option
                  key={period.id}
                  value={period.id}
                >
                  {period.name}
                  {period.code
                    ? ` · ${period.code}`
                    : ""}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="section-name">
              Name
            </FieldLabel>
            <Input
              id="section-name"
              value={sectionName}
              onChange={(event) =>
                setSectionName(event.target.value)
              }
              placeholder="Section A"
              maxLength={255}
            />
          </div>
          <div>
            <FieldLabel htmlFor="section-code">
              Code
            </FieldLabel>
            <Input
              id="section-code"
              value={sectionCode}
              onChange={(event) =>
                setSectionCode(event.target.value)
              }
              placeholder="A"
              maxLength={64}
            />
          </div>
          <div>
            <FieldLabel htmlFor="section-capacity">
              Capacity · optional
            </FieldLabel>
            <Input
              id="section-capacity"
              type="number"
              min={1}
              max={10000}
              value={sectionCapacity}
              onChange={(event) =>
                setSectionCapacity(
                  event.target.value,
                )
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            type="submit"
            disabled={
              pending ||
              !sectionCohortId ||
              !sectionPeriodId ||
              !sectionName.trim() ||
              !sectionCode.trim()
            }
          >
            Create section
          </Button>
        </div>
      </form>
    </section>
  );
}
