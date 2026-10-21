import Api from "../ApiMethod";
import { getOTPUrl, getPinUrl, getVerifyPinUrl } from "../serviceUrl";
import { getVerifyOTPUrl } from "../serviceUrl";

export async function getOTP({ isStudent = false, ...queryParams }) {
  return Api.get(isStudent ? getPinUrl : getOTPUrl, { params: queryParams });
}

export async function getPin(queryParams) {
  return Api.get(getPinUrl, { params: queryParams });
}

export async function getVerifyOTP({ isStudent = false, ...queryParams }) {
  return Api.get(isStudent ? getVerifyPinUrl : getVerifyOTPUrl, { params: queryParams });
}

export async function getVerifyPin(queryParams) {
  return Api.get(getVerifyPinUrl, { params: queryParams });
}
