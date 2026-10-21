import React, { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import Api from "@/api/ApiMethod";
import { validateJobId } from "@/utils/learnerValidation";
import { classifyApplicationLookup } from "@/utils/placementsAppliedLookup";
import { getSafeInternalReturnPath } from "@/utils/navigationContext";
import JobDetailContent from "./JobDetailContent.jsx";

/**
 * Fail-closed gate around the existing job detail. An unsuccessful /applied lookup
 * must never be interpreted as permission to submit another application.
 *
 * Keep the existing detail's UI, receipts and withdrawal flow intact. The gate
 * also protects the Apply card if a second lookup in the legacy detail fails
 * after the first lookup has confirmed that an application exists.
 */
export default function VerifiedJobDetailContent({ basePath = "/learn/my-placements" }) {
  const router = useRouter();
  const learnerId = useSelector((state) => state.loginUser?.id);
  const validatedJobId = useMemo(() => validateJobId(router.query.jobId), [router.query.jobId]);
  const jobsPath = `${basePath}/jobs`;
  const jobsReturnPath = useMemo(
    () =>
      getSafeInternalReturnPath(router.query?.returnTo, {
        fallback: jobsPath,
        allowedPrefixes: [jobsPath],
      }),
    [router.query?.returnTo, jobsPath]
  );
  const identity = router.isReady && learnerId && validatedJobId.valid
    ? `${learnerId}:${validatedJobId.value}` : null;
  const [lookup, setLookup] = useState({ identity: null, status: "loading" });
  const [retry, setRetry] = useState(0);
  const status = identity && lookup.identity === identity ? lookup.status : "loading";

  useEffect(() => {
    if (!identity) return undefined;
    const controller = new AbortController();
    setLookup({ identity, status: "loading" });
    Api.get(`/api/v1/jobs/${validatedJobId.value}/applied/${learnerId}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setLookup({ identity, status: classifyApplicationLookup(response) });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLookup({ identity, status: "unknown" });
      });
    return () => controller.abort();
  }, [identity, learnerId, validatedJobId.value, retry]);

  // The original component already handles invalid links and unauthenticated
  // navigation. Do not intercept or change those paths.
  if (!identity) return <JobDetailContent basePath={basePath} />;

  if (status === "loading" || status === "unknown") {
    return (
      <div className="learn-job-detail-page ljd">
        <main className="ljd-layout ljd-layout--single">
          <section className="ljd-card ljd-state" role={status === "unknown" ? "alert" : "status"}>
            <h1 className="ljd-state__title">
              {status === "loading" ? "Checking your application status" : "Application status unavailable"}
            </h1>
            <p className="ljd-state__desc">
              {status === "loading"
                ? "Checking whether you have already applied before enabling the application form."
                : "We couldn't confirm whether you already applied. Applying is blocked until the status can be checked."}
            </p>
            <div className="ljd-state__actions">
              {status === "unknown" && (
                <Button type="primary" onClick={() => setRetry((value) => value + 1)}>
                  Check status again
                </Button>
              )}
              <Button onClick={() => router.push(`${basePath}/applications`)}>
                View applications
              </Button>
              <Button onClick={() => router.push(jobsReturnPath)}>
                Back to jobs
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (status === "applied") {
    return (
      <div className="placements-verified-applied">
        <JobDetailContent key={`${identity}:applied`} basePath={basePath} />
        <div className="placements-verified-applied__notice" role="status">
          An existing application was confirmed. You can review it under{" "}
          <Button type="link" onClick={() => router.push(`${basePath}/applications`)}>
            Applications
          </Button>.
        </div>
        <style jsx global>{`
          .placements-verified-applied .ljd-apply { display: none !important; }
          .placements-verified-applied:has(.ljd-applied) > .placements-verified-applied__notice {
            display: none;
          }
        `}</style>
      </div>
    );
  }

  return <JobDetailContent key={`${identity}:not-applied`} basePath={basePath} />;
}
