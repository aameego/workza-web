import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout, { useIsMobileAuth } from "./AuthLayout";
import { EyeOffIcon, EyeOpenIcon } from "./authIcons";
import { loginUser } from "../services/authService";
import { vendorDashboardPath } from "../lib/vendorPath";
import { setAuthData, setOrganisations } from "../lib/authStorage";
import { ApiError } from "../lib/apiClient";
import { isSignInReady, validateLoginForm } from "./loginValidation";

export default function LoginPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobileAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    orgCode: "",
    otp: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [is2FA, setIs2FA] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const finalValue = name === "orgCode" ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : finalValue,
    }));
  };

  const signInReady = isSignInReady(formData, is2FA);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateLoginForm(formData, is2FA);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!signInReady) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await loginUser({
        emailOrPhone: formData.identifier,
        password: formData.password,
        vendorCode: formData.orgCode,
        otp: formData.otp,
      });

      if ("twoFactorRequired" in res && res.twoFactorRequired) {
        setIs2FA(true);
        setOtpEmail(res.sendTo || "");
        setOtpSent(true);
        return;
      }

      if (!("token" in res) || !res.token) {
        setError("Login failed");
        return;
      }

      setAuthData(res.token, res.user, formData.rememberMe);
      setOrganisations(res.organisations);
      navigate(vendorDashboardPath(res.user));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Login failed");
      } else if (err instanceof Error) {
        setError(err.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="form-header">
        <h2>Welcome to Workza! 👋</h2>
        <p>Sign in to your Workza HRMS account.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="identifier">Work Email or Mobile Number</label>
          <input
            id="identifier"
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="name@workza.com"
            required
            disabled={is2FA}
            autoComplete="username"
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={is2FA}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOpenIcon /> : <EyeOffIcon />}
            </button>
          </div>
          <div className="forgot-links">
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="orgCode">Organization Code</label>
          <input
            id="orgCode"
            type="text"
            name="orgCode"
            value={formData.orgCode}
            onChange={handleChange}
            placeholder="Enter your organisation code"
            required
            disabled={is2FA}
            autoComplete="organization"
          />
          <span className="helper-text">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Provided by your HR administrator
          </span>
        </div>

        {is2FA && otpSent && (
          <div className="input-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              id="otp"
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              placeholder="Enter 6-Digit OTP"
              maxLength={6}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <span className="helper-text">
              Code sent to: <strong>{otpEmail}</strong>
            </span>
          </div>
        )}

        <label className="remember-me">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          Remember me
        </label>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          className="btn-login"
          disabled={isLoading || !signInReady}
        >
          {isLoading
            ? "Logging in..."
            : is2FA
              ? "Verify & Confirm Login"
              : isMobile
                ? "Sign In →"
                : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
