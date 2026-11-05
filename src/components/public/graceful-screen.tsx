"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { friendlyReference } from "@/lib/friendly-error";
import styles from "./public-screen.module.css";
import { Img } from "@/components/ui/img";
import { TextLink } from "@/components/ui/text-link";
import { Heading } from "@/components/ui/heading";

/** Shared error, forbidden, offline and maintenance screen; copy and recovery stay intact. */
export function GracefulScreen({ title, message, homeHref = "/dashboard", retry, requestId, homeLabel = "Go to home" }: {
  title: string;
  message: string;
  homeHref?: string;
  retry?: () => void;
  requestId?: string | null;
  homeLabel?: string;
}) {
  const reference = friendlyReference(requestId);
  // /dashboard is the central, permission-aware home. Explicit homepage
  // links supplied by public 404 callers must not discard signed-in role scope.
  const destination = homeHref.startsWith("/")&&!homeHref.startsWith("//")&&homeHref!=="/"
    ? homeHref : "/dashboard";
  const legacyStatus = title === "Page not found" || title === "Server Error";
  const statusCode = title === "Page not found" ? 404 : title === "Server Error" ? 500 : null;
  function goBack() {
    // history.length alone does not guarantee the previous document is same
    // origin. A direct visit or cross-site entry must return to safe role home.
    try {
      const referer = document.referrer ? new URL(document.referrer) : null;
      if(referer?.origin===window.location.origin && window.history.length>1){
        window.history.back();return;
      }
    } catch { /* fall through */ }
    window.location.assign(destination);
  }
  return (
    <main className={legacyStatus
      ? statusCode===500 ? styles["legacyErrorPage"]+" "+styles["legacyServerError"] : styles["legacyErrorPage"]
      : styles["page"]}>
      {!legacyStatus ? <header className={styles["header"]}>
        <TextLink variant="bare" href={destination} className={styles["brand"]} aria-label="42LMS home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={styles["legacyLogo"]} />
        </TextLink>
      </header> : null}
      <div className={styles["center"]}>
        <section className={styles["card"]} aria-labelledby="public-screen-title">
          {legacyStatus?<div className={styles["legacyHeading"]}>
            <span className={styles["statusNumeral"]} aria-hidden="true">{statusCode}</span>
            <Heading level={1} id="public-screen-title" className={styles["legacyTitle"]}>
              {statusCode===404?"Page Not Found":"Server Error"}
            </Heading>
          </div>:<>
            <div aria-hidden="true" className={styles["icon"]}>!</div>
            <PageHeader id="public-screen-title" title={title} />
          </>}
          <p className={styles["message"]}>{message}</p>
          {!legacyStatus && reference ? (
            <div className={styles["reference"]}>
              <span>{reference}</span>
              <Button variant="secondary" size="sm" type="button" className={styles["copy"]}
                onClick={() => { if (requestId) void navigator.clipboard?.writeText(requestId).catch(() => {}); }}>
                Copy reference
              </Button>
            </div>
          ) : null}
          <div className={styles["actions"]}>
            {legacyStatus?<Button variant="bare" type="button" className={styles["secondary"]}
              onClick={goBack}>Go back</Button>:null}
            <TextLink variant="bare" href={destination} className={styles["primary"]}>
              {statusCode===500?"Go to Home":homeLabel}
            </TextLink>
            {retry ? <Button type="button" onClick={retry} className={styles["secondary"]}>Try again</Button> : null}
          </div>
          {legacyStatus && reference ? <p className={styles["reference"]}>Reference: {reference}</p> : null}
        </section>
      </div>
      {!legacyStatus ? <footer className={styles["footer"]}>
        <span>© {new Date().getFullYear()} 42LMS · JRSPF Technologies Pvt. Ltd.</span>
        <nav className={styles["footerLinks"]} aria-label="Footer">
          <Link href="/privacy-policy">Privacy</Link>
          <TextLink href="/assets/static/terms-and-conditions-view.html">Terms</TextLink>
        </nav>
      </footer> : null}
    </main>
  );
}
