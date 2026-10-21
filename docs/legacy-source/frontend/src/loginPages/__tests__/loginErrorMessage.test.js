import fs from "fs";
import path from "path";

// loginErrorMessage lives in Login.js, which pulls in the whole app (router, redux, antd); read the function out of the
// source instead of rendering the page.
const source = fs.readFileSync(path.join(__dirname, "..", "Login.js"), "utf8").split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
const start = source.indexOf("export function loginErrorMessage");
const end = source.indexOf("\n}\n", start) + 2;
// eslint-disable-next-line no-new-func
const loginErrorMessage = new Function(`${source.slice(start, end).replace("export ", "")}; return loginErrorMessage;`)();

const GENERIC = "Something went wrong. Try again in a moment.";

describe("sign-in error messages", () => {
  test.each([
    "NOT_REGISTERED", "NO_ACCOUNT_FOR_DOMAIN", "ACCOUNT_SUSPENDED", "ACCOUNT_UNAVAILABLE", "USER_NOT_FOUND", "TOO_MANY_REQUESTS",
    "TOO_SOON", "OTP_DELIVERY_FAILED", "LOGIN_METHOD_DISABLED", "INVALID_CHOICE", "MOBILE_AUTH_TIMEOUT", "INCORRECT_OTP",
    "OTP_EXPIRED", "EMAIL_OTP_EXPIRED", "INVALID_ATTEMPT", "OTP_ATTEMPTS_EXCEEDED", "WRONG_TENANT", "EMAIL_NOT_FOUND",
    "RECRUITER_COLLEGE_ADDRESS", "INVALID_EMAIL",
  ])("%s has its own sentence", (code) => {
    expect(loginErrorMessage(code)).not.toBe(GENERIC);
  });

  test("a number that isn't registered says so (it used to say 'Unable to send OTP right now')", () => {
    expect(loginErrorMessage("NOT_REGISTERED", { channel: "phone" })).toMatch(/number isn't registered/);
    expect(loginErrorMessage("NOT_REGISTERED", { channel: "email" })).toMatch(/account with that email/);
  });

  test("the disabled method points at the other one", () => {
    expect(loginErrorMessage("LOGIN_METHOD_DISABLED", { channel: "phone" })).toMatch(/email/);
    expect(loginErrorMessage("LOGIN_METHOD_DISABLED", { channel: "email" })).toMatch(/phone/);
  });

  test("an unknown answer gets the general sentence", () => {
    expect(loginErrorMessage("SOMETHING_NEW")).toBe(GENERIC);
    expect(loginErrorMessage(null)).toBe(GENERIC);
  });

  test("the page never shows the word OTP in these messages", () => {
    for (const code of ["OTP_EXPIRED", "INCORRECT_OTP", "OTP_ATTEMPTS_EXCEEDED", "OTP_DELIVERY_FAILED"]) {
      expect(loginErrorMessage(code)).not.toMatch(/\bOTP\b/);
    }
  });
});
