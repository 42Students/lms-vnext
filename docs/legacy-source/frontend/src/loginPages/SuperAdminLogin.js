import { useEffect, useRef, useState } from "react";
import { Checkbox, Form, Input } from "antd";
import { getOTP, getVerifyOTP } from "@/api/Services/otp";
import Loader from "@/components/Loader/loader";
import { message } from "antd";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { loginUserAction } from "@/redux/store";
import CustomButton from "@/components/Global/Button/button";
import { storeAuthResponse, getAndClearLogoutReason, getAndClearSessionReturnPath, isLoggedIn, clearAllTokens } from "@/utils/authUtils";
import { getTenantBootstrap } from "@/api/Services/TenantService";
import { saveTenantBootstrapToStorage, getTenantCollegeId } from "@/utils/tenantUtils";

// Note: phone number authorization is enforced by the backend (app.super-admin-phones config).
// No client-side allowlist — backend will reject unauthorized numbers.

const SuperAdminLoginPage = ({ onLoginSuccess }) => {
  const dispatch = useDispatch();
  const [isOTPTriggered, setOTPTriggered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumValid, setphoneNumValid] = useState(true);
  const [loaderSpin, setLoaderSpin] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const key = "updatable";
  const router = useRouter();
  const loginUser = useSelector(state => state.loginUser);
  const [termsChecked, setTermsChecked] = useState(false);
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    getTenantBootstrap()
      .then((b) => saveTenantBootstrapToStorage(b))
      .catch(() => {});
    if (typeof window !== "undefined") {
      const logoutReason = getAndClearLogoutReason();
      if (logoutReason === "session_expired") {
        message.info("Your session expired. Please log in again.", 4);
      }
      const redirectKey = "superadmin_login_redirect_attempted";
      const alreadyAttempted = sessionStorage.getItem(redirectKey) === "1";

      // Prefer centralised check: requires refresh token + userData
      if (isLoggedIn()) {
        sessionStorage.setItem(redirectKey, "1");

        // Avoid infinite spinner if /superadmin redirects back due to missing cookie/session
        let finished = false;
        const done = () => {
          finished = true;
          setLoaderSpin(false);
        };
        const onErr = () => {
          // If we already tried redirecting once in this tab and we still ended up here,
          // clear stale local state and show login.
          if (alreadyAttempted) {
            clearAllTokens();
          }
          done();
        };

        // Router navigation promises can occasionally hang during refresh/fast-refresh.
        // Fail open to showing the login form instead of keeping the preloader forever.
        const fallbackTimer = setTimeout(() => {
          if (!finished) onErr();
        }, 8000);

        router
          .replace({ pathname: "/superadmin/dashboard" })
          .then(done)
          .catch(onErr)
          .finally(() => clearTimeout(fallbackTimer));
      } else {
        // Ensure we don't keep a stale redirect loop marker
        sessionStorage.removeItem(redirectKey);
        setLoaderSpin(false);
      }
    }
  }, []);

  return (
    <>
      {!loaderSpin ? (
        <section className="Login-Section">
          {contextHolder}
          <div className="row w-100 mt-5 justify-content-md-end ">
            <div className="col-8 col-md-3 ms-5 ln-login-form">
              <div className="ln-form-bg">
                <Form
                  name={isOTPTriggered ? "login" : "sendOtp"}
                  labelCol={{
                    span: 8,
                  }}
                  onFinish={e => {
                    if (isOTPTriggered) {
                      VerifyOTP(e);
                    }
                  }}
                  wrapperCol={{
                    span: 24,
                  }}
                  style={{
                    maxWidth: 600,
                  }}
                  initialValues={{
                    remember: true,
                  }}
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
                          rules={[
                            {
                              required: true,
                              message: "",
                            },
                          ]}
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
                                e.target.value.length <= 10 &&
                                  setPhoneNumber(e.target.value);
                                setphoneNumValid(true);
                              }}
                            />
                            {!phoneNumValid && (
                              <p id="phone-error" style={{ color: "red" }} role="alert">
                                Please Enter registered mobile number
                              </p>
                            )}
                          </>
                        </Form.Item>
                      </div>
                      <CustomButton
                        onClick={() => handleSendOtp()}
                        title={"Send OTP"}
                        buttonType={"primary"}
                        loading={loading}
                        // Prevent accidental full-form submit / route changes during OTP start
                        htmlType="button"
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
                          rules={[
                            {
                              required: true,
                              message: "Please input OTP!",
                            },
                          ]}
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
                      <Checkbox
                        className="login-checkbox ln-login-tc"
                        onChange={e => setTermsChecked(e.target.checked)}
                        >
                        <span className="white">
                          By clicking here, I agree to 42 LMS&apos;{" "}
                          <a
                            href="/assets/static/terms-and-conditions-view.html"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Terms &amp; Conditions
                          </a>
                          .
                        </span>
                      </Checkbox>
                      <Form.Item
                        className="mt-2"
                        wrapperCol={{
                          span: 16,
                        }}
                      >
                        <CustomButton
                          disabled={!termsChecked}
                          title={"Login"}
                          buttonType={"primary"}
                          loading={loading}
                          htmlType="submit"
                        />
                      </Form.Item>
                    </div>
                  )}
                </Form>
                <div className="ln-login-tc mt-4 text-center">
                  <p className="white">
                    <a
                      href="/assets/static/terms-and-conditions-view.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms &amp; Conditions
                    </a>
                    <span> | </span>
                    <a
                      href="/assets/static/privacy-policy-view.html"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy Policy
                    </a>
                  </p>
                  <p className="white">
                    JRSPF Technologies Pvt. Ltd. All rights reserved.
                  </p>
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

  function VerifyOTP(values) {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setLoaderSpin(true);
    const UserOTP = values.OTP;
    const collegeId = getTenantCollegeId();
    getVerifyOTP({ phoneNumber: phoneNumber, otp: UserOTP, superAdmin: true, ...(collegeId ? { collegeId } : {}) })
      .then(res => {
        if (res.data.status === "OK") {
          // Store JWT tokens and get user data from AuthResponse
          const authData = res.data.data;
          const userData = storeAuthResponse(authData);
          
          // Use user from AuthResponse or fallback
          const loginData = userData || authData;
          
          // Update Redux state
          dispatch(loginUserAction.setIsUserLoggedIn(true));
          dispatch(loginUserAction.handleUserData(loginData));
          
          const savedPath = getAndClearSessionReturnPath();
          const savedPathname = typeof savedPath === "string" ? savedPath.split(/[?#]/, 1)[0] : "";
          const postLoginPath =
            savedPathname === "/superadmin" || savedPathname.startsWith("/superadmin/")
              ? savedPath
              : "/superadmin/dashboard";

          // If parent provided callback, keep its existing lifecycle; otherwise restore the
          // exact protected page (including query/hash) that expired.
          if (onLoginSuccess) {
            onLoginSuccess(postLoginPath);
          } else {
            router.push(postLoginPath);
          }
        }
      })
      .catch(error => {
        messageApi.open({
          key,
          type: "error",
          content: "OTP InValid!",
          duration: 2,
        });
        setLoaderSpin(false);
      })
      .finally(() => {
        verifyingRef.current = false;
        setLoaderSpin(false);
      });
  }

  async function handleSendOtp() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setLoading(true);
    const collegeId = getTenantCollegeId();
    getOTP({ phoneNumber: phoneNumber, superAdmin: true, ...(collegeId ? { collegeId } : {}) })
      .then(res => {
        if (res.data.status === "OK") {
          setLoading(false);
          messageApi.open({
            key,
            type: "success",
            content: "OTP Sent!",
            duration: 2,
          });
          setOTPTriggered(true);
        }
      })
      .catch(error => {
        setphoneNumValid(false);
        setLoading(false);
      })
      .finally(() => {
        sendingRef.current = false;
      });
  }
};

export default SuperAdminLoginPage;
