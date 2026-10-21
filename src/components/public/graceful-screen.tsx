"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { friendlyReference } from "@/lib/friendly-error";
import styles from "./public-screen.module.css";

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
  const destination = homeHref === "/" ? "/dashboard" : homeHref;
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href={destination} className={styles.brand} aria-label="42LMS home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={styles.legacyLogo} />
        </Link>
      </header>
      <div className={styles.center}>
        <section className={styles.card} aria-labelledby="public-screen-title">
          <div aria-hidden="true" className={styles.icon}>!</div>
          <PageHeader id="public-screen-title" title={title} />
          <p className={styles.message}>{message}</p>
          {reference ? (
            <div className={styles.reference}>
              <span>{reference}</span>
              <Button variant="secondary" size="sm" type="button" className={styles.copy}
                onClick={() => { if (requestId) void navigator.clipboard?.writeText(requestId).catch(() => {}); }}>
                Copy reference
              </Button>
            </div>
          ) : null}
          <div className={styles.actions}>
            {retry ? <Button type="button" onClick={retry} className={styles.primary}>Try again</Button> : null}
            <Link href={destination} className={retry ? styles.secondary : styles.primary}>{homeLabel}</Link>
          </div>
        </section>
      </div>
      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} 42LMS · JRSPF Technologies Pvt. Ltd.</span>
        <nav className={styles.footerLinks} aria-label="Footer">
          <Link href="/privacy-policy">Privacy</Link>
          <a href="/assets/static/terms-and-conditions-view.html">Terms</a>
        </nav>
      </footer>
    </main>
  );
}
