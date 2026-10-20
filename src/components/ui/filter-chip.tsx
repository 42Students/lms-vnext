"use client";

import type {ButtonProps} from "@/components/ui/button";
import type {ReactNode} from "react";
import Link from "next/link";
import {isSafeInternalHref} from "@/lib/safe-internal-href";
import {Button} from "@/components/ui/button";
import {cx} from "@/lib/class-names";

/** Shared compact legacy chip for boolean filters and aria-pressed toggles.
 * Unlike a Badge, this remains a real keyboard-operable button.
 * To render a route tab, use the shared Tabs component instead.
 */
export type FilterChipProps=Omit<ButtonProps,"variant"|"size"> & {
 tone?:"neutral"|"info"|"success"|"warning"|"error";
};
const tones={
 neutral:"border-[var(--lms-canvas-border)] bg-white text-[var(--lms-body-text)]",
 info:"border-[var(--lms-canvas-border)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
 success:"border-[var(--lms-canvas-border)] bg-[var(--lms-success-subtle)] text-[var(--lms-success-text)]",
 warning:"border-[var(--lms-canvas-border)] bg-[var(--lms-warning-subtle)] text-[var(--lms-warning-text)]",
 error:"border-[var(--lms-canvas-border)] bg-[var(--lms-error-subtle)] text-[var(--lms-error-text)]",
} as const;

export function FilterChip({
 className,children,tone="neutral",type="button",...props
}:FilterChipProps){
 const selected=props["aria-pressed"]===true||props["aria-pressed"]==="true";
 return <Button {...props} type={type} variant="secondary" size="sm"
   data-slot="filter-chip" data-selected={selected}
   className={cx(
    "min-h-11 rounded-[6px] border px-[12px] py-0 text-[12px] font-bold leading-[18px] md:min-h-8 md:px-[15px] md:py-[2px]",
    "hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:opacity-50",
    tones[tone],
    selected&&"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
    className,
   )}>{children}</Button>;
}

/** Route-backed quick filters must remain links, not buttons simulating navigation.
 * This shares the same source-backed geometry as FilterChip without losing
 * colored indicator children or bookmarked search parameters.
 */
export type FilterChipLinkProps={
 href:string;
 children:ReactNode;
 selected?:boolean;
 tone?:FilterChipProps["tone"];
 className?:string;
 title?:string;
 "aria-label"?:string;
};
export function FilterChipLink({
 href,children,selected=false,tone="neutral",className,title,
 "aria-label":ariaLabel,
}:FilterChipLinkProps){
 const classes=cx(
  "inline-flex min-h-11 max-w-full items-center justify-center rounded-[6px] border px-[12px] py-0 text-[12px] font-bold leading-[18px] md:min-h-8 md:px-[15px] md:py-[2px]",
  "transition-colors hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] motion-reduce:transition-none",
  tones[tone],
  selected&&"border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]",
  className,
 );
 if(!isSafeInternalHref(href))return <span data-slot="filter-chip" aria-disabled="true"
  aria-label={ariaLabel} title={title} className={cx(classes,"cursor-not-allowed opacity-50")}>{children}</span>;
 return <Link href={href} data-slot="filter-chip" data-selected={selected}
  aria-current={selected?"page":undefined} aria-label={ariaLabel}
  title={title} className={classes}>{children}</Link>;
}
