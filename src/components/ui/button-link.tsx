import { AppLink, type AppLinkProps } from "@/components/ui/text-link";
import { buttonClasses, type ButtonProps } from "@/components/ui/button";

export type ButtonLinkProps = AppLinkProps & {
  variant?: Exclude<NonNullable<ButtonProps["variant"]>, "bare">;
  size?: NonNullable<ButtonProps["size"]>;
};

/** A link that looks exactly like a Button of the same variant and size. */
export function ButtonLink({ variant = "secondary", size = "md", className, ...props }: ButtonLinkProps) {
  return <AppLink data-slot="button" data-variant={variant} data-size={size} {...props} className={buttonClasses({ variant, size, className })} />;
}
