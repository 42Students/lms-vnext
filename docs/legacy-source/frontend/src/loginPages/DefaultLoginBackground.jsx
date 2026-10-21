// The default illustration + diagonal accent shared by every login surface that doesn't supply
// its own background (Login.js when no tenant background is set, SuperAdminLogin, DgipucLogin).
// Two layers defined purely in percentages (not a single `background-size: cover` raster image)
// so the diagonal's horizontal position stays in sync with the form's grid position at every
// viewport size -- `cover` scaling shifts the diagonal's on-screen location independently of the
// form, which made the white "Mobile Number" label / "Resend OTP" text at some common desktop
// resolutions (e.g. 1440x900, 1920x1200) sit over the wrong (white) side and be invisible.
//
// Do NOT render this on a login surface that already sets its own `.login-page` background (e.g.
// JntuLogin's `.login-page--jntu` cover photo) -- these are absolutely-positioned layers that
// paint above the element's own CSS background and would hide it.
export default function DefaultLoginBackground() {
  return (
    <>
      <div className="login-page__diagonal" aria-hidden />
      <div className="login-page__illustration" aria-hidden />
    </>
  );
}
