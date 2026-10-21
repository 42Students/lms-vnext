import { OrgConst } from "@/common/subDomains";
import { createSlice } from "@reduxjs/toolkit";
//admin: 1111, student: 1234, teacher: 1235
export const appSlice = createSlice({
  name: "appSlice",
  initialState: {
    activeMenuItem: "courses",
    profileImageUrl: null, // For syncing profile image across components
    profilePercentage: null, // Profile completeness % – used by navbar avatar ring
  },
  reducers: {
    setActiveMenuItem: (state, actionObj) => {
      state.activeMenuItem = actionObj?.payload;
    },
    // Action to update profile image URL (dispatched when profile picture is uploaded)
    setProfileImageUrl: (state, actionObj) => {
      state.profileImageUrl = actionObj?.payload;
    },
    // Action to update profile completeness percentage (from Sidebar, used by navbar)
    setProfilePercentage: (state, actionObj) => {
      state.profilePercentage = actionObj?.payload;
    },
    resetState: () => ({
      activeMenuItem: "courses",
      profileImageUrl: null,
      profilePercentage: null,
    }),
  },
});
