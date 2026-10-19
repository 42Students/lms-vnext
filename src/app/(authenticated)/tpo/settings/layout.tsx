import type { ReactNode } from "react";

/** Each TPO Settings screen owns its shared PageHeader. The authenticated
 * ancestor provides the only white canvas; never duplicate either surface.
 */
export default function TpoSettingsLayout({children}:{children:ReactNode}){
 return <div className="min-w-0 space-y-6">{children}</div>;
}
