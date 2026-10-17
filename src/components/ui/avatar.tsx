import { cx } from "@/lib/class-names";

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
  className?: string;
};
export function avatarInitials(name: string) {
  return name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(part => part[0]?.toLocaleUpperCase("en-IN") ?? "").join("") || "?";
}
export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const classes = cx("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-subtle font-semibold text-foreground", size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm", className);
  return <span data-slot="avatar" className={classes} aria-label={name}>
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" width={size === "sm" ? 32 : 44} height={size === "sm" ? 32 : 44} className="h-full w-full object-cover" />
    ) : <span aria-hidden="true">{avatarInitials(name)}</span>}
  </span>;
}
