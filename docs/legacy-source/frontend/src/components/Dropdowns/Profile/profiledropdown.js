import { Dropdown, Progress } from "antd";
import Image from "next/image";
import Link from "next/link";
import Loader from "@/components/Loader/loader";
import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { appAction, loaderAction, clearAllUserState } from "@/redux/store";
import {
  getFacultyDetails,
  getStudentDetails,
} from "@/api/Services/UserServices";
import { useEffect } from "react";
import { OrgConst } from "@/common/subDomains";
import { useFacultyProfileApis, getProfilePath } from "@/utils/roleUtils";
import { logoutFromBackend, clearAllTokens } from "@/utils/authUtils";
import { getStatusColor, getProfileHoverMessage } from "@/utils/profileUtils";
import { isRecruiterType } from "@/config/roles";
import ResilientAvatar from "@/components/Common/ResilientAvatar";

const ProfileDropdown = ({ clerk = false }) => {
  const loginUser = useSelector(state => state.loginUser);
  // Listen to profile image updates from Redux (syncs with profile page uploads)
  const profileImageUrl = useSelector(state => state.app?.profileImageUrl);
  // Profile completeness % – shown as ring around avatar
  const profilePercentage = useSelector(state => state.app?.profilePercentage);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [userDetails, setUserDetails] = useState();
  const useFacultyApis = useFacultyProfileApis(loginUser);

  // Fetch user details on mount and when login user changes
  const fetchUserDetails = useCallback(() => {
    if (loginUser?.id) {
      // recruiter (industry) accounts are neither faculty nor learners: their name comes with the session
      // (GET /api/v1/recruiter/me), and the learner/faculty profile APIs are fenced off for them.
      if (isRecruiterType(loginUser?.userType)) {
        setUserDetails((prev) => ({ ...prev, firstName: loginUser.firstName, lastName: loginUser.lastName }));
        return;
      }
      // Use getFacultyDetails for faculty profile
      if (useFacultyApis) {
        getFacultyDetails({ facultyId: loginUser.id }).then(userRes => {
          setUserDetails(prev => ({ ...prev, ...userRes?.data }));
        }).catch(() => {}); // Header dropdown is non-critical -- keep showing whatever we had
      } else {
        getStudentDetails({ learnerId: loginUser.id }).then(userRes => {
          setUserDetails(prev => ({ ...prev, ...userRes?.data }));
        }).catch(() => {}); // Header dropdown is non-critical -- keep showing whatever we had
      }
    }
  }, [loginUser?.id, loginUser?.userType, loginUser?.firstName, loginUser?.lastName, useFacultyApis]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Re-fetch when profile image is updated from profile page
  useEffect(() => {
    if (profileImageUrl) {
      // Update local state immediately for instant feedback
      setUserDetails(prev => prev ? { ...prev, website: profileImageUrl } : prev);
    }
  }, [profileImageUrl]);

  const dispatch = useDispatch();

  const notification = [
    {
      firstname: "umesh",
      message: "recently left a comment on",
      secondname: "sumesh",
    },
    {
      firstname: "Jones Ferdinand",
      message: "Hello Stephen!",
    },

    {
      firstname: "umesh",
      message: "recently left a comment on",
      secondname: "sumesh",
    },
    {
      firstname: "Jones Ferdinand",
      message: "Hello Stephen!",
    },
  ];

  const Logout = async () => {
    dispatch(loaderAction.showProgress());

    // Invalidate server-side refresh/cookie state before dropping local tokens.
    await logoutFromBackend();

    // Clear all Redux slices (attendance, course, quiz, contacts, app, search, sequence, loginUser)
    const orgPayload =
      loginUser?.currOrg == OrgConst.JNTU ? { currOrg: OrgConst.JNTU }
      : loginUser?.currOrg == OrgConst.DGIPUC ? { currOrg: OrgConst.DGIPUC }
      : { currOrg: OrgConst.ALL };
    clearAllTokens();
    dispatch(clearAllUserState(orgPayload));
  };

  return (
    <div>
      <Dropdown
        trigger={["click"]}
        open={openDropdown}
        overlayClassName="ln-profile-dropdown-overlay"
        placement="bottomRight"
        onOpenChange={val => {
          setOpenDropdown(val);
        }}
        dropdownRender={menu => (
          <div className={"ln-head-dropdown-menu"}>
            {!clerk && profilePercentage != null && Number.isFinite(profilePercentage) && profilePercentage < 100 && (
              <div className="ln-profile-dropdown-banner">
                <div className="ln-profile-dropdown-banner__row">
                  <span className="ln-profile-dropdown-banner__percent">{Math.min(100, Math.max(0, profilePercentage))}%</span>
                  <span className="ln-profile-dropdown-banner__sep" aria-hidden>·</span>
                  <span className="ln-profile-dropdown-banner__msg">{getProfileHoverMessage(profilePercentage).sub}</span>
                </div>
                <Link href={getProfilePath(loginUser)} onClick={() => { setOpenDropdown(false); dispatch(appAction.setActiveMenuItem("profile")); }} className="ln-profile-dropdown-banner__cta">
                  Complete profile
                </Link>
              </div>
            )}
            {!clerk && (
              <p className="clrgray7AE fnt-13 fw-600 mb-4">Manage Account</p>
            )}
            <div className="ln-account-info brd-btm-1 brd-btm-4F9 pb-2">
              {!clerk && (
                <Link
                  className="fl-panel-module-list__link ln-account-info__item mb-3 bt-n d-flex align-items-center"
                  href={getProfilePath(loginUser)}
                  onClick={() => {
                    setOpenDropdown(false);
                    dispatch(appAction.setActiveMenuItem("profile"));
                  }}
                >
                  <Image
                    className="me-3"
                    src="/assets/images/common/myAccount.svg"
                    alt=""
                    aria-hidden="true"
                    width={16}
                    height={16}
                  />
                  <span className="clrFour fnt-14 fw-600">My Account</span>
                </Link>
              )}

              {/* <button className="ln-account-info__item mb-3 bt-n d-flex align-items-center">
                <Image
                  className="me-3"
                  src="/assets/images/common/existing-student.svg"
                  alt="Logo"
                  width={16}
                  height={16}
                />

                <span className="clrFour fnt-14 fw-600">Exit Student View</span>
              </button> */}
            </div>
            <div className="pt-3 pb-1">
              <button
                className="ln-account-logout bt-n d-flex align-items-center"
                onClick={async () => {
                  setOpenDropdown(false);
                  await Logout();
                  const url = getLogoutUrl();
                  if (url.startsWith("http")) {
                    window.location.href = url;
                  } else {
                    window.location.replace(url);
                  }
                }}
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
              {profilePercentage != null && Number.isFinite(profilePercentage) && (
                <Progress
                  type="circle"
                  percent={Math.min(100, Math.max(0, profilePercentage))}
                  size={52}
                  strokeWidth={4}
                  showInfo={false}
                  strokeColor={getStatusColor(profilePercentage)}
                  className="ln-profile__progress-ring"
                />
              )}
              <div className="ln-profile__icon">
                <ResilientAvatar
                  src={userDetails?.website}
                  name={[userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") || "Profile"}
                  alt="Profile"
                  size={45}
                />
              </div>
            </div>
          </button>
      </Dropdown>
    </div>
  );

  function getLogoutUrl() {
    switch (loginUser?.currOrg) {
      case OrgConst.JNTU:
        return "https://emedha.jntukelearn.in/";
      case OrgConst.DGIPUC:
        return "http://dgi.42lms.com/";
      default:
        return "/";
    }
  }
};

export default ProfileDropdown;
