import Link from "next/link";
import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/class-names";

export type AppLinkProps = ComponentPropsWithRef<"a">;

const focusClasses = "outline-none focus-ring";
const linkClasses = "font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-button-primary-hover)]";

function isAppPath(href: string | undefined, props: AppLinkProps) {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/api/")
    && props.download === undefined && props.target === undefined;
}

/** Client-side navigation for app paths; a plain anchor for files, API routes, anchors and external URLs. */
export function AppLink({ href, className, ...props }: AppLinkProps) {
  if (isAppPath(href, props)) return <Link href={href as string} {...props} className={className} />;
  const rel = props.target === "_blank" && !props.rel ? "noopener noreferrer" : props.rel;
  // eslint-disable-next-line jsx-a11y/anchor-has-content -- children come through props
  return <a href={href} {...props} rel={rel} className={className} />;
}

export type TextLinkProps = AppLinkProps & {
  /** "bare" only for links that are cards or rows with their own layout; it is tracked by the link-bare rule. */
  variant?: "link" | "bare";
};

export function TextLink({ variant = "link", className, ...props }: TextLinkProps) {
  return <AppLink data-slot="text-link" data-variant={variant} {...props} className={cx(focusClasses, variant === "link" && linkClasses, className)} />;
}
