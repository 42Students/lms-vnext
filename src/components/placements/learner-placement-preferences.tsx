"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Preferences = {
  preferredRoleTitles: string[];
  preferredLocations: string[];
  preferredEmploymentTypes: string[];
  preferredWorkMode: string;
  shiftPreference: string;
  minimumAnnualCtcInr: number | null;
  relocationPreference: string;
  notifyMatchingJobs: boolean;
  notifyApplicationUpdates: boolean;
};

const inputClass =
  "min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-[14px] text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-9";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function LearnerPlacementPreferences({
  preferences,
}: {
  preferences: Preferences;
}) {
  const { showToast } = useToast();
  const [roles, setRoles] = useState(
    preferences.preferredRoleTitles.join(", "),
  );
  const [locations, setLocations] = useState(
    preferences.preferredLocations.join(", "),
  );
  const [employmentTypes, setEmploymentTypes] =
    useState<string[]>(
      preferences.preferredEmploymentTypes,
    );
  const [workMode, setWorkMode] = useState(
    preferences.preferredWorkMode,
  );
  const [shiftPreference, setShiftPreference] =
    useState(preferences.shiftPreference);
  const [minimumLpa, setMinimumLpa] = useState(
    preferences.minimumAnnualCtcInr == null
      ? ""
      : String(
          preferences.minimumAnnualCtcInr /
            100_000,
        ),
  );
  const [
    relocationPreference,
    setRelocationPreference,
  ] = useState(
    preferences.relocationPreference,
  );
  const [
    notifyMatchingJobs,
    setNotifyMatchingJobs,
  ] = useState(
    preferences.notifyMatchingJobs,
  );
  const [
    notifyApplicationUpdates,
    setNotifyApplicationUpdates,
  ] = useState(
    preferences.notifyApplicationUpdates,
  );
  const [pending, setPending] = useState(false);

  function toggleEmploymentType(value: string) {
    setEmploymentTypes((current) =>
      current.includes(value)
        ? current.filter(
            (item) => item !== value,
          )
        : [...current, value],
    );
  }

  async function save() {
    setPending(true);
    try {
      if (splitList(roles).length > 20 || splitList(locations).length > 20 ||
          splitList(roles).some(value => value.length > 120) ||
          splitList(locations).some(value => value.length > 120) ||
          (minimumLpa.trim() !== "" &&
            (!Number.isFinite(Number(minimumLpa)) ||
             Number(minimumLpa) < 0 || Number(minimumLpa) > 1000))) {
        throw new Error("Up to 20 roles/locations (120 characters each) and 0–1000 LPA are allowed.");
      }
      const response = await fetch(
        "/api/placements/preferences",
        {
          method: "PUT",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            preferredRoleTitles:
              splitList(roles),
            preferredLocations:
              splitList(locations),
            preferredEmploymentTypes:
              employmentTypes,
            preferredWorkMode: workMode,
            shiftPreference,
            minimumAnnualCtcInr:
              minimumLpa.trim() === ""
                ? null
                : Math.round(
                    Number(minimumLpa) *
                      100_000,
                  ),
            relocationPreference,
            notifyMatchingJobs,
            notifyApplicationUpdates,
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "Could not save placement preferences.",
        );
      }
      showToast({
        tone: "success",
        title: "Preferences saved",
        description:
          "Your placement matching preferences are up to date.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not save preferences",
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
    <section id="placement-job-preferences" className="scroll-mt-24 border-b border-border pb-5">
      <div className="border-b border-border py-4">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Opportunity preferences
        </h2>
        <p className="mt-1 text-sm text-body">
          Tell the placement workspace what kinds of roles should surface first for you.
        </p>
      </div>
      <div className="grid gap-4 py-5 lg:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Preferred role titles
          </span>
          <input
            className={inputClass}
            value={roles}
            onChange={(event) =>
              setRoles(event.target.value)
            }
            placeholder="Backend Engineer, SDE, Data Analyst"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Separate multiple titles with commas.
          </span>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Preferred locations
          </span>
          <input
            className={inputClass}
            value={locations}
            onChange={(event) =>
              setLocations(
                event.target.value,
              )
            }
            placeholder="Hyderabad, Bengaluru, Remote"
          />
        </label>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Employment types
          </span>
          <div className="flex flex-wrap gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2.5">
            {[
              ["FULL_TIME", "Full time"],
              ["INTERNSHIP", "Internship"],
              ["CONTRACT", "Contract"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-2 text-sm text-body"
              >
                <input
                  type="checkbox"
                  checked={employmentTypes.includes(
                    value,
                  )}
                  onChange={() =>
                    toggleEmploymentType(
                      value,
                    )
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Work mode
          </span>
          <select
            className={inputClass}
            value={workMode}
            onChange={(event) =>
              setWorkMode(
                event.target.value,
              )
            }
          >
            <option value="NO_PREFERENCE">
              No preference
            </option>
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
            Shift preference
          </span>
          <select
            className={inputClass}
            value={shiftPreference}
            onChange={(event) =>
              setShiftPreference(
                event.target.value,
              )
            }
          >
            <option value="NO_PREFERENCE">
              No preference
            </option>
            <option value="DAY">
              Day
            </option>
            <option value="NIGHT">
              Night
            </option>
            <option value="FLEXIBLE">
              Flexible
            </option>
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Minimum CTC (LPA)
          </span>
          <input
            className={inputClass}
            type="number"
            min={0}
            step="0.1"
            max={1000}
            value={minimumLpa}
            onChange={(event) =>
              setMinimumLpa(
                event.target.value,
              )
            }
            placeholder="8"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Relocation
          </span>
          <select
            className={inputClass}
            value={relocationPreference}
            onChange={(event) =>
              setRelocationPreference(
                event.target.value,
              )
            }
          >
            <option value="NO_PREFERENCE">
              No preference
            </option>
            <option value="YES">
              Open to relocation
            </option>
            <option value="NO">
              Prefer not to relocate
            </option>
          </select>
        </label>
        <div className="grid gap-2">
          <span className="text-xs font-semibold text-body">
            Notifications
          </span>
          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={notifyMatchingJobs}
              onChange={(event) =>
                setNotifyMatchingJobs(
                  event.target.checked,
                )
              }
            />
            Matching opportunities
          </label>
          <label className="flex items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={
                notifyApplicationUpdates
              }
              onChange={(event) =>
                setNotifyApplicationUpdates(
                  event.target.checked,
                )
              }
            />
            Application updates
          </label>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <Button
          size="sm"
          disabled={
            pending ||
            (minimumLpa.trim() !== "" &&
              (!Number.isFinite(
                Number(minimumLpa),
              ) ||
                Number(minimumLpa) <
                  0))
          }
          onClick={save}
        >
          {pending
            ? "Saving…"
            : "Save preferences"}
        </Button>
      </div>
    </section>
  );
}
