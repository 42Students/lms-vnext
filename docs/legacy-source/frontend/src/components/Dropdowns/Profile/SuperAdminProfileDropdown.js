import { Dropdown } from "antd";
import Image from "next/image";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { loaderAction, clearAllUserState } from "@/redux/store";
import { logoutFromBackend, clearAllTokens } from "@/utils/authUtils";

// Same visual chrome as ProfileDropdown (learner/faculty/college-admin) — .ln-profile avatar
// trigger, .ln-head-dropdown-menu overlay — but deliberately simplified: superadmin's identity
// (userId 0) has no Faculty/Learner row, so there's no profile to fetch, no completeness ring,
// and no "My Account" page to link to. Just the avatar + Logout.
const SuperAdminProfileDropdown = () => {
  const dispatch = useDispatch();
  const [openDropdown, setOpenDropdown] = useState(false);

  const handleLogout = async () => {
    setOpenDropdown(false);
    dispatch(loaderAction.showProgress());
    await logoutFromBackend();
    clearAllTokens();
    dispatch(clearAllUserState({}));
    window.location.href = "/superadmin-login";
  };

  return (
    <div>
      <Dropdown
        trigger={["click"]}
        open={openDropdown}
        overlayClassName="ln-profile-dropdown-overlay"
        placement="bottomRight"
        onOpenChange={(val) => setOpenDropdown(val)}
        dropdownRender={() => (
          <div className="ln-head-dropdown-menu">
            <p className="clrgray7AE fnt-13 fw-600 mb-4">Manage Account</p>
            <div className="pt-3 pb-1">
              <button
                className="ln-account-logout bt-n d-flex align-items-center"
                onClick={handleLogout}
              >
                <Image
                  className="me-3"
                  src="/assets/images/common/power.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                />
                <span className="fnt-14 fw-600 clrRed576">Logout</span>
              </button>
            </div>
          </div>
        )}
      >
        <button
          type="button"
          className="ln-profile ms-4"
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={openDropdown}
        >
          <div className="ln-profile__avatar-wrap">
            <div className="ln-profile__icon">
              <Image
                src="/assets/images/avatar/profile_big.png"
                alt="Profile"
                width={45}
                height={45}
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            </div>
          </div>
        </button>
      </Dropdown>
    </div>
  );
};

export default SuperAdminProfileDropdown;
