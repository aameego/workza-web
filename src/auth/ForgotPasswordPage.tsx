import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { EyeOffIcon, EyeOpenIcon } from "./authIcons";
import {
  isResetPasswordReady,
  maskContact,
  validateForgotIdentify,
  validateResetPassword,
} from "./forgotPasswordValidation";
import { sendOtp, updatePassword, verifyOtp } from "../services/authService";
import { ApiError } from "../lib/apiClient";

type Step = "IDENTIFY" | "VERIFY_OTP" | "RESET";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("IDENTIFY");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [otp, setOtp] = useState<string[]>(() => Array(6).fill(""));
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(45);

  useEffect(() => {
    if (step !== "VERIFY_OTP" || timer <= 0) return;
    const interval = window.setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step, timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleRequestOtp = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    const validationError = validateForgotIdentify(vendorCode, emailOrPhone);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp({
        emailOrPhone: emailOrPhone.trim(),
        vendorCode: vendorCode.trim().toUpperCase(),
      });
      setTimer(45);
      setOtp(Array(6).fill(""));
      setStep("VERIFY_OTP");
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to send OTP. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({
        emailOrPhone: emailOrPhone.trim(),
        otp: otpString,
        vendorCode: vendorCode.trim().toUpperCase(),
      });
      setStep("RESET");
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Invalid or expired OTP.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateResetPassword(
      passwordData.newPassword,
      passwordData.confirmPassword,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await updatePassword({
        emailOrPhone: emailOrPhone.trim(),
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
        vendorCode: vendorCode.trim().toUpperCase(),
      });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Could not reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const header =
    step === "VERIFY_OTP"
      ? {
          title: "Enter Verification Details!",
          subtitle: `Enter 6-digit code sent to ${maskContact(emailOrPhone)}.`,
        }
      : step === "RESET"
        ? {
            title: "Reset Password!",
            subtitle: "Change your password by entering your new details.",
          }
        : {
            title: "Forgot Password!",
            subtitle:
              "Recover access to your account by verifying your identity.",
          };

  const resetReady = isResetPasswordReady(
    passwordData.newPassword,
    passwordData.confirmPassword,
  );
  const showMismatchHint =
    passwordData.newPassword.length > 0 &&
    passwordData.confirmPassword.length > 0 &&
    passwordData.newPassword !== passwordData.confirmPassword;

  return (
    <AuthLayout>
      <div className="auth-back">
        {step === "IDENTIFY" ? (
          <Link to="/login" className="forgot-link">
            ← Back to Login
          </Link>
        ) : (
          <button
            type="button"
            className="forgot-link auth-back-button"
            onClick={() =>
              setStep(step === "VERIFY_OTP" ? "IDENTIFY" : "VERIFY_OTP")
            }
          >
            ← Back to details
          </button>
        )}
      </div>

      <div className="form-header">
        <h2>{header.title}</h2>
        <p>{header.subtitle}</p>
      </div>

      {step === "IDENTIFY" && (
        <form onSubmit={handleRequestOtp}>
          <div className="input-group">
            <label htmlFor="forgot-org">Organization Code</label>
            <input
              id="forgot-org"
              type="text"
              placeholder="Enter your organization code"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value.toUpperCase())}
              required
              autoComplete="organization"
            />
          </div>
          <div className="input-group">
            <label htmlFor="forgot-contact">Work Email or Mobile Number</label>
            <input
              id="forgot-contact"
              type="text"
              placeholder="Enter your work email or mobile number"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              autoComplete="username"
            />
            <span className="helper-text helper-text-plain">
              Enter your registered email or mobile number to receive a
              verification OTP
            </span>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button
            type="submit"
            className="btn-login"
            disabled={
              isLoading || !vendorCode.trim() || !emailOrPhone.trim()
            }
          >
            {isLoading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === "VERIFY_OTP" && (
        <form onSubmit={handleVerifyOtp} className="otp-form">
          <div className="input-group">
            <label>Verification Code</label>
            <div className="otp-boxes" role="group" aria-label="6-digit OTP">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  value={digit}
                  placeholder="—"
                  onChange={(e) =>
                    handleOtpChange(e.target.value.slice(-1), index)
                  }
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className={digit ? "otp-box otp-box-filled" : "otp-box"}
                  aria-label={`Digit ${index + 1}`}
                  required
                />
              ))}
            </div>
          </div>

          <div className="otp-resend-row">
            <span>Didn&apos;t receive the code?</span>
            {timer > 0 ? (
              <span className="otp-resend-timer">
                Resend in{" "}
                <span className="otp-resend-pill">
                  0:{timer < 10 ? `0${timer}` : timer}
                </span>
              </span>
            ) : (
              <button
                type="button"
                className="otp-resend-action"
                onClick={() => handleRequestOtp()}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}
          <button
            type="submit"
            className="btn-login"
            disabled={isLoading || otp.join("").length < 6}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}

      {step === "RESET" && (
        <form onSubmit={handleResetPassword}>
          <div className="input-group">
            <label htmlFor="new-password">New Password</label>
            <div className="password-wrapper">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={
                  showNewPassword ? "Hide password" : "Show password"
                }
              >
                {showNewPassword ? <EyeOpenIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <div className="password-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <EyeOpenIcon /> : <EyeOffIcon />}
              </button>
            </div>
            <span className="helper-text helper-text-plain">
              Please choose a strong, secure password.
            </span>
          </div>

          {showMismatchHint && (
            <p className="error-message">Passwords do not match</p>
          )}
          {error && <p className="error-message">{error}</p>}
          <button
            type="submit"
            className="btn-login"
            disabled={isLoading || !resetReady}
          >
            {isLoading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
