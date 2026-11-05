import Link from "next/link";
import type { ComponentPropsWithoutRef, ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

type NextLinkProps = ComponentPropsWithRef<typeof Link>;
export type AppLinkProps = Omit<NextLinkProps, "href"> & { href?: NextLinkProps["href"] };

const focusClasses = "outline-none focus-ring";
const linkClasses = "font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-button-primary-hover)]";
const NEXT_ONLY = ["prefetch", "replace", "scroll", "shallow", "locale", "legacyBehavior", "onNavigate", "passHref"] as const;

/** Client-side navigation for app paths; a plain anchor for files, API routes, anchors and external URLs. */
export function AppLink({ href, className, ...props }: AppLinkProps) {
  const anchorProps = props as ComponentPropsWithoutRef<"a">;
  const appPath = href !== undefined && (typeof href !== "string"
    || (href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/") && anchorProps.download === undefined && anchorProps.target === undefined));
  if (appPath) return <Link href={href as NextLinkProps["href"]} {...props} className={className} />;
  const rest: Record<string, unknown> = { ...props };
  for (const key of NEXT_ONLY) delete rest[key];
  const a = rest as ComponentPropsWithoutRef<"a">;
  const rel = a.target === "_blank" && !a.rel ? "noopener noreferrer" : a.rel;
  // eslint-disable-next-line jsx-a11y/anchor-has-content -- children come through props
  return <a href={href as string | undefined} {...a} rel={rel} className={className} />;
}

export type TextLinkProps = AppLinkProps & {
  /** "bare" only for links that are cards or rows with their own layout; it is tracked by the link-bare rule. */
  variant?: "link" | "bare";
};

export function TextLink({ variant = "link", className, ...props }: TextLinkProps) {
  return <AppLink data-slot="text-link" data-variant={variant} {...props} className={cx(focusClasses, variant === "link" && linkClasses, className)} />;
}
