import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import "./LoginScreen.css";

import bgImage from "../assets/login.png";
import logo from "../assets/landing/workza-logo.png";
import usersIcon from "../assets/user.png";
import attendanceIcon from "../assets/attendance.png";
import payrollIcon from "../assets/payroll.png";
import expenseIcon from "../assets/expense.png";
import performanceIcon from "../assets/performance.png";
import policyIcon from "../assets/policy.png";
import reportsIcon from "../assets/document.png";
import kplogo from "../assets/kpLogo.png";
import mobileBgImage from "../assets/mobile_login.png";

type AuthLayoutProps = {
  children: ReactNode;
};

/** Shared login-shell chrome: hero, form card frame, powered-by footer, feature strip. */
export default function AuthLayout({ children }: AuthLayoutProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 992 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="login-wrapper">
      <div
        className="login-main"
        style={{
          backgroundImage: `url(${isMobile ? mobileBgImage : bgImage})`,
        }}
      >
        <div className="login-overlay" />

        <div className="login-left">
          <div className="floating-pill blue-collar">
            <div className="pill-icon blue-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M17 18h1" />
                <path d="M13 18h1" />
                <path d="M9 18h1" />
              </svg>
            </div>
            <div className="pill-text">
              <span className="pill-title">Blue Collar</span>
              <span className="pill-subtitle">Factory | Plant | Field</span>
            </div>
          </div>

          <div className="floating-pill white-collar">
            <div className="pill-icon green-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="pill-text">
              <span className="pill-title">White Collar</span>
              <span className="pill-subtitle">Office | Remote | Hybrid</span>
            </div>
          </div>

          <Link to="/login" className="brand-logo" aria-label="Workza home">
            <img src={logo} alt="Workza" />
          </Link>

          <div className="hrms-pill">
            <span className="dot" /> HRMS PLATFORM
          </div>

          <h1 className="hero-title">
            One Workforce.
            <br />
            <span className="hero-accent">One Platform.</span>
          </h1>

          <p className="hero-subtitle">
            {isMobile
              ? "From factory floors to office desks, Workza keeps every team moving."
              : "A modern HRMS built for growing organisations – manage your people with clarity, care, and confidence."}
          </p>
        </div>

        <div className="login-right">
          <div className="form-card">
            {children}
            <div className="form-footer">
              <div className="kp-logo-wrapper">
                <p>Powered by</p>
                <img src={kplogo} alt="Karpragati" />
              </div>
              <span className="footer-tagline">
                Blue-collar · White-collar · One Workforce
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-features">
        <div className="feature-heading">
          Everything you need,
          <br />
          in one place.
        </div>
        <div className="feature-icons-list">
          <div className="feature-icon-item">
            <img src={usersIcon} alt="" />
            <span>
              HR & Employee
              <br />
              Management
            </span>
          </div>
          <div className="feature-icon-item">
            <img src={attendanceIcon} alt="" />
            <span>
              Attendance
              <br />
              & Leave
            </span>
          </div>
          <div className="feature-icon-item">
            <img src={payrollIcon} alt="" />
            <span>
              Payroll &<br />
              Salary
            </span>
          </div>
          <div className="feature-icon-item">
            <img src={expenseIcon} alt="" />
            <span>
              Claims &<br />
              Expenses
            </span>
          </div>
          <div className="feature-icon-item">
            <img src={performanceIcon} alt="" />
            <span>
              Performance
              <br />
              & Goals
            </span>
          </div>
          <div className="feature-icon-item">
            <img src={reportsIcon} alt="" />
            <span>
              Reports &<br />
              Analytics
            </span>
          </div>
          <div className="feature-icon-item">
            <img src={policyIcon} alt="" />
            <span>
              Policies &<br />
              Documents
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useIsMobileAuth() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 992 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}
