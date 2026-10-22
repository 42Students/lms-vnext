"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import styles from "./public-screen.module.css";

/** Keep the existing bounded loading recovery, but render it in the auth canvas. */
export function PublicPageLoading({ label = "Loading your page..." }: { label?: string }) {
  return (
    <main className={`${styles["page"]} min-w-0`}>
      <header className={`${styles["header"]} min-w-0`}>
        <Link href="/" className={styles["brand"]} aria-label="42LMS home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/legacy-42lms-logo.svg" alt="42LMS" className={styles["legacyLogo"]} />
        </Link>
      </header>
      <div className={`${styles["center"]} min-w-0`}>
        <section className={`${styles["card"]} min-w-0`} aria-label={label}>
          <PageHeader title={label} />
          <div className={`${styles["loadingHost"]} min-w-0`} role="status" aria-live="polite" aria-label={label}>
            <GracefulPageLoading label={label} />
          </div>
        </section>
      </div>
      <footer className={`${styles["footer"]} min-w-0`}>
        <span>© {new Date().getFullYear()} 42LMS · JRSPF Technologies Pvt. Ltd.</span>
        <nav className={styles["footer"]Links} aria-label="Footer">
          <Link href="/privacy-policy">Privacy</Link>
          <a href="/assets/static/terms-and-conditions-view.html">Terms</a>
        </nav>
      </footer>
    </main>
  );
}
