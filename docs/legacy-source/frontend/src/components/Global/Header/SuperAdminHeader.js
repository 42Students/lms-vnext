import { LinearProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { MenuOutlined } from "@ant-design/icons";
import { useState, useRef, memo } from "react";
import { Select } from "antd";
import SuperAdminMobileMenuDrawer from "../MobileMenuDrawer/SuperAdminMobileMenuDrawer";
import SuperAdminProfileDropdown from "@/components/Dropdowns/Profile/SuperAdminProfileDropdown";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

// Superadmin's own copy of DashboardHeader (src/components/Global/Header/Header.js), sharing the
// exact same markup/SCSS classes (ln-dashboard-header, ln-org-switcher, ln-profile, etc.) so it
// renders visually identical to learner/faculty/college-admin's topbar. Kept as a separate file
// rather than adding an isSuperAdmin branch to the shared Header — Header.js is already a large,
// heavily role-branched file used by two other panels, and superadmin's needs (an arbitrary
// college picker instead of "my own memberships", no course search, no notifications) are
// different enough that a copy is safer than threading a fourth role through it.
const SuperAdminHeader = () => {
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const loading = useSelector((state) => state.loader.isLoading);
  const { colleges, collegesLoading, collegesError, selectedCollegeId, handleCollegeChange, scopeApplying } = useSuperAdminScope();
  // AntD Select (showSearch, single mode) reuses the selected option's own label text as the
  // search box's contents when reopened, which then filters the option list down to just that
  // one match. Controlling searchValue ourselves and clearing it on open keeps the full college
  // list visible every time the dropdown is opened, not just the currently selected college.
  const [collegeSearchText, setCollegeSearchText] = useState("");

  const collegeOptions = (colleges || []).map((c) => ({
    value: c.id ?? c.collegeId,
    label: c.name ?? c.collegeName,
  }));

  const handleCollegeDropdownOpenChange = (open) => {
    if (open) setCollegeSearchText("");
  };

  return (
    <>
      {loading && <LinearProgress />}
      <SuperAdminMobileMenuDrawer
        open={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        onAfterClose={() => menuButtonRef.current?.focus()}
      />
      <div className="ln-dashboard-header bg-white ln-head ln-head--pd30 d-flex justify-content-between p-3">
        <div className="ln-mob-ham col-1">
          <button
            ref={menuButtonRef}
            type="button"
            className="ln-mob-ham-btn"
            aria-label="Open navigation menu"
            aria-expanded={menuDrawerOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuDrawerOpen(true)}
            style={{ minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <MenuOutlined
              aria-hidden="true"
              style={{ color: "#84828B", fontSize: "23px" }}
              className="menu-side-icon ms-2 pb-1"
            />
          </button>
        </div>

        <div className="ln-org-text-mob d-flex gap-1 align-items-center justify-content-center">
          <Select
            size="small"
            className="ln-org-switcher ln-org-switcher--mobile"
            popupClassName="ln-org-switcher-dropdown"
            dropdownStyle={{ minWidth: "min(420px, 92vw)", maxWidth: "92vw" }}
            getPopupContainer={() => document.body}
            placement="bottomRight"
            style={{ minWidth: 128 }}
            allowClear
            value={selectedCollegeId ?? undefined}
            loading={collegesLoading || scopeApplying}
            disabled={collegesLoading || scopeApplying || Boolean(collegesError)}
            status={collegesError ? "error" : undefined}
            onChange={handleCollegeChange}
            onDropdownVisibleChange={handleCollegeDropdownOpenChange}
            searchValue={collegeSearchText}
            onSearch={setCollegeSearchText}
            placeholder={collegesError ? "Load failed" : "All colleges"}
            showSearch
            optionFilterProp="label"
            options={collegeOptions}
          />
        </div>

        <div className="gap-3 d-flex justify-content-end align-items-center ms-auto">
          <div className="ln-org-text-desk d-flex align-items-center">
            <Select
              size="small"
              className="ln-org-switcher"
              popupClassName="ln-org-switcher-dropdown"
              dropdownStyle={{ minWidth: "min(460px, 92vw)", maxWidth: "92vw" }}
              getPopupContainer={() => document.body}
              placement="bottomRight"
              style={{ minWidth: 220, maxWidth: 320 }}
              allowClear
              value={selectedCollegeId ?? undefined}
              loading={collegesLoading || scopeApplying}
              disabled={collegesLoading || scopeApplying || Boolean(collegesError)}
              status={collegesError ? "error" : undefined}
              onChange={handleCollegeChange}
              onDropdownVisibleChange={handleCollegeDropdownOpenChange}
              searchValue={collegeSearchText}
              onSearch={setCollegeSearchText}
              placeholder={collegesError ? "Load failed - refresh" : "All colleges"}
              showSearch
              optionFilterProp="label"
              options={collegeOptions}
            />
          </div>
          <div className="d-flex gap-1 justify-content-center align-items-center">
            <SuperAdminProfileDropdown />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(SuperAdminHeader);
