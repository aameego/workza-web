import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import ForgotPasswordPage from "./auth/ForgotPasswordPage";
import AppLayout from "./layouts/AppLayout";
import EmptyScreen from "./pages/EmptyScreen";
import EmployeesPage from "./pages/employees/EmployeesPage";
import AddEmployeePage from "./pages/employees/AddEmployeePage";
import EditEmployeePage from "./pages/employees/EditEmployeePage";
import ViewEmployeePage from "./pages/employees/ViewEmployeePage";

import { getAuthToken } from "./lib/authStorage";
import { APP_NAV_ITEMS } from "./layouts/navConfig";
import { vendorDashboardPath } from "./lib/vendorPath";
import { readSessionUser } from "./layouts/sessionUser";


function RequireAuth({ children }: { children: ReactNode }) {
  if (!getAuthToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function LegacyDashboardRedirect() {
  const user = readSessionUser();
  return <Navigate to={vendorDashboardPath(user)} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/:vendorSlug"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="employees/new" element={<AddEmployeePage />} />
          <Route
            path="employees/:employeeId/edit"
            element={<EditEmployeePage />}
          />
          <Route path="employees/:employeeId" element={<ViewEmployeePage />} />

          <Route path="letters" element={<EmptyScreen />} />
          {APP_NAV_ITEMS.map((item) => (
            <Route
              key={item.path}
              path={item.path.replace(/^\//, "")}
              element={
                item.path === "/employees" ? (
                  <EmployeesPage />
                ) : (
                  <EmptyScreen />
                )
              }
            />
          ))}
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <LegacyDashboardRedirect />
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
