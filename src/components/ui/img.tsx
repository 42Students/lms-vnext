import type { ComponentPropsWithoutRef } from "react";

export type ImgProps = Omit<ComponentPropsWithoutRef<"img">, "alt"> & {
  /** Required: pass "" only for purely decorative images. */
  alt: string;
};

/** The one place a raw image element is allowed: lazy, async-decoded, alt required. */
export function Img({ alt, loading = "lazy", decoding = "async", ...props }: ImgProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img data-slot="image" alt={alt} loading={loading} decoding={decoding} {...props} />;
}
