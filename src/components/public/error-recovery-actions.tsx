"use client";

import { Button } from "@/components/ui/button";
import styles from "./public-screen.module.css";
import { TextLink } from "@/components/ui/text-link";

export function ErrorRecoveryActions({ retry }: { retry?: () => void }) {
  return (
    <div role="group" aria-label="Recovery actions" className={styles["actions"]}>
      {retry ? <Button type="button" onClick={retry} className={styles["primary"]}>Try again</Button> : null}
      <Button variant="secondary" type="button" onClick={() => window.history.back()} className={styles["secondary"]}>Go back</Button>
      <TextLink variant="bare" href="/" className={styles["secondary"]}>Go to Home</TextLink>
    </div>
  );
}
