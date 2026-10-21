import { OrgConst } from "@/common/subDomains";
import { createSlice } from "@reduxjs/toolkit";
//admin: 1111, student: 1234, teacher: 1235
export const loggedinUserSlice = createSlice({
  name: "loggedinUser",
  initialState: {
    isUserLoggedIn: false,
    currOrg: OrgConst.ALL,
  },
  reducers: {
    handleUserData: (state, actionObj) => {
      // const {
      //   payload: { key, value },
      // } = actionObj;
      // state.loginUser[key] = value;
      return {
        ...state,
        ...actionObj?.payload,
      };
    },
    setIsUserLoggedIn: (state, actionObj) => {
      return {
        ...state,
        isUserLoggedIn: actionObj?.payload,
      };
    },
    clearUser: (state, actionObj) => {
      return { isUserLoggedIn: false, ...actionObj?.payload };
    },
  },
});
