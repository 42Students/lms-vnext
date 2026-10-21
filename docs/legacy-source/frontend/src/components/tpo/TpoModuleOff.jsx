import { Result } from "antd";

/** True when an API answer says the college does not have the Placements module (super admin switch). */
export const isPlacementsOff = (res) => Boolean(res && !res.success && res.status === 403
  && /not switched on|does not use placements|not available at your college/i.test(String(res.message || res.data?.message || "")));

/**
 * Covers the TPO workspace below the header when the college does not have Placements. Nothing is deleted:
 * when 42Students switches it back on, everything is where it was.
 */
export default function TpoModuleOff() {
  return (
    <div className="tpo-module-off" role="alert" data-testid="tpo-module-off">
      <Result
        status="info"
        title="Placements is switched off for this college"
        subTitle="Nothing has been deleted. When 42Students switches Placements back on, your drives, students and recruiters are all where you left them. Your college admin can contact 42Students about it."
      />
    </div>
  );
}
