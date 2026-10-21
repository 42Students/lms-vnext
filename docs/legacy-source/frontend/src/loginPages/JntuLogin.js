import { useEffect, useRef, useState } from "react";
import { Form, Input } from "antd";
import { getOTP, getVerifyOTP } from "@/api/Services/otp";
import Loader from "@/components/Loader/loader";
import { message } from "antd";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { loginUserAction } from "@/redux/store";
import CustomButton from "@/components/Global/Button/button";
import Image from "next/image";
import { storeAuthResponse, isLoggedIn, getStoredUserData, clearAllTokens } from "@/utils/authUtils";
import { getTenantBootstrap } from "@/api/Services/TenantService";
import { saveTenantBootstrapToStorage, getTenantCollegeId } from "@/utils/tenantUtils";
import { getFacultyBasePath } from "@/utils/facultyRouteUtils";
import { homePathForRole, isStrictPortalRole, resolveRoleFromUser } from "@/config/roles";

export default function JntuLogin() {
  const dispatch = useDispatch();
  const [isOTPTriggered, setOTPTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumValid, setphoneNumValid] = useState(true);
  const [loaderSpin, setLoaderSpin] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const router = useRouter();
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    getTenantBootstrap()
      .then((b) => saveTenantBootstrapToStorage(b))
      .catch(() => {});
    const redirectKey = "jntu_login_redirect_attempted";
    const alreadyAttempted = sessionStorage.getItem(redirectKey) === "1";
    if (isLoggedIn()) {
      sessionStorage.setItem(redirectKey, "1");
      const currentUserObject = getStoredUserData();
      const done = () => setLoaderSpin(false);
      const onErr = () => {
        if (alreadyAttempted) clearAllTokens();
        done();
      };
      if (isStrictPortalRole(resolveRoleFromUser(currentUserObject))) {
        // recruiter / TPO: straight to their own portal (src/config/roles.js).
        router.replace({ pathname: homePathForRole(resolveRoleFromUser(currentUserObject)) }).then(done).catch(onErr);
      } else if (currentUserObject?.userType === "FACULTY") {
        const isAdmin = currentUserObject.facultyType === "ADMIN" || currentUserObject.role === "ADMIN";
        const path = isAdmin
          ? "/college-admin/dashboard"
          : currentUserObject.facultyType === "MENTOR"
            ? "/mentor/projects"
            : "/teacher/courses";
        router.replace({ pathname: path }).then(done).catch(onErr);
      } else if (currentUserObject?.userType === "LEARNER") {
        router.replace({ pathname: "/learn/courses" }).then(done).catch(onErr);
      } else {
        done();
      }
    } else {
      sessionStorage.removeItem(redirectKey);
      setLoaderSpin(false);
    }
  }, []);

  return (
    <>
      {!loaderSpin ? (
        <section className="Login-Section">
          {contextHolder}
          <div className="d-flex justify-content-md-end">
            <div className="col col-md-3 bg-white ln-login-flap px-2">
              <div className="ln-flap-cont">
                <div className="text-center">
                  <Image
                    src="/assets/images/login/jntu-logo.png"
                    height={135}
                    width={140}
                    alt="JNTU Logo"
                  />
                </div>

                <Form
                  className="px-3 mt-3"
                  name={isOTPTriggered ? "login" : "sendOtp"}
                  labelCol={{ span: 8 }}
                  onFinish={e => {
                    if (isOTPTriggered) VerifyOTP(e);
                  }}
                  wrapperCol={{ span: 24 }}
                  style={{ maxWidth: 600 }}
                  initialValues={{ remember: true }}
                  autoComplete="off"
                >
                  {!isOTPTriggered ? (
                    <div>
                      <div>
                        <label htmlFor="phone-input" className="ln-lb2 fnt-24 ln-login-lb">
                          Mobile Number
                        </label>
                        <Form.Item
                          name="Mobile_Number"
                          rules={[{ required: true, message: "Mobile number is required" }]}
                        >
                          <>
                            <Input
                              id="phone-input"
                              type="tel"
                              inputMode="numeric"
                              autoFocus
                              aria-describedby="phone-error"
                              value={phoneNumber}
                              placeholder="Enter mobile number"
                              className="ln-login-input"
                              onWheel={e => e.target.blur()}
                              onChange={e => {
                                const digits = e.target.value.replace(/\D/g, "");
                                if (digits.length <= 10) setPhoneNumber(digits);
                              }}
                            />
                            {!phoneNumValid && (
                              <p id="phone-error" className="form-error" role="alert">
                                Please enter a registered mobile number
                              </p>
                            )}
                          </>
                        </Form.Item>
                      </div>
                      <CustomButton
                        onClick={handleSendOtp}
                        title="Send OTP"
                        buttonType="primary"
                        loading={loading}
                        htmlType="submit"
                      />
                    </div>
                  ) : (
                    <div>
                      <div>
                        <label htmlFor="otp-input" className="ln-lb2 ln-login-lb">
                          OTP sent to your Mobile Number
                        </label>
                        <Form.Item
                          name="OTP"
                          rules={[{ required: true, message: "Please enter the OTP" }]}
                        >
                          <Input
                            id="otp-input"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            className="ln-login-input"
                            placeholder="Enter OTP"
                            onWheel={e => e.target.blur()}
                          />
                        </Form.Item>
                      </div>
                      <Form.Item wrapperCol={{ span: 16 }}>
                        <CustomButton
                          title="Login"
                          buttonType="primary"
                          loading={loading}
                          htmlType="submit"
                        />
                      </Form.Item>
                    </div>
                  )}
                </Form>
                <div className="mt-5 pt-5 text-center">
                  <p className="black">
                    <a
                      className="black"
                      href="/assets/static/terms-and-conditions-view.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms &amp; Conditions
                    </a>
                    <span> | </span>
                    <a
                      className="black"
                      href="/assets/static/privacy-policy-view.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                  </p>
                  <p className="black">Powered by 42 LMS. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="ln-page-loader">
          <Loader />
        </div>
      )}
    </>
  );

  async function VerifyOTP(values) {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    try {
      const collegeId = getTenantCollegeId();
      const res = await getVerifyOTP({ phoneNumber, otp: values.OTP, ...(collegeId ? { collegeId } : {}) });
      if (res?.data?.status === "OK") {
        const authData = res.data.data;
        const userData = storeAuthResponse(authData);
        const loginData = userData || authData;
        dispatch(loginUserAction.setIsUserLoggedIn(true));
        dispatch(loginUserAction.handleUserData(loginData));
        if (isStrictPortalRole(resolveRoleFromUser(loginData))) {
          router.push({ pathname: homePathForRole(resolveRoleFromUser(loginData)) });
        } else if (loginData.userType === "FACULTY") {
          if (loginData.facultyType === "ADMIN" || loginData.role === "ADMIN") {
            router.push({ pathname: "/college-admin/dashboard" });
          } else {
            router.push({ pathname: `${getFacultyBasePath(router.pathname, loginData.facultyType)}/projects` });
          }
        } else if (loginData.userType === "LEARNER") {
          router.push({ pathname: "/learn/courses" });
        } else {
          setLoading(false);
          verifyingRef.current = false;
        }
      } else {
        messageApi.error({ content: res?.data?.message || "Verification failed. Please try again.", duration: 3 });
        setLoading(false);
        verifyingRef.current = false;
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Invalid OTP. Please try again.";
      messageApi.error({ content: msg, duration: 3 });
      setLoading(false);
      verifyingRef.current = false;
    }
  }

  async function handleSendOtp() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    setphoneNumValid(true);
    try {
      const collegeId = getTenantCollegeId();
      const res = await getOTP({ phoneNumber, ...(collegeId ? { collegeId } : {}) });
      if (res?.data?.status === "OK") {
        messageApi.success({ content: "OTP sent!", duration: 2 });
        setOTPTriggered(true);
      } else {
        setphoneNumValid(false);
      }
    } catch {
      setphoneNumValid(false);
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }
}
