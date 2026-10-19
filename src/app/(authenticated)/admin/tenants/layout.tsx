import "@/styles/college-admin-north-star.css";

/** Super Admin tenants reuse the College Admin visual skin, not a new canvas. */
export default function TenantSkinLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="lms-college-portal">{children}</div>;
}
