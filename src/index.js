import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.css";
import "assets/scss/paper-dashboard.scss?v=1.3.0";
import "assets/demo/demo.css";
import "perfect-scrollbar/css/perfect-scrollbar.css";

import CitizenLayout from "layouts/CitizenLayout.js";
import IndustryLayout from "layouts/IndustryLayout.js";
import EducationLayout from "layouts/EducationLayout.js";
import PolicyIndustryLayout from "layouts/PolicyIndustryLayout.js";
import PolicyEducationLayout from "layouts/PolicyEducationLayout.js";
import InitLayout from "layouts/InitLayout.js";
import InitPage from "views/InitPage.js";
import Login from "views/Login.js";
import Register from "views/Register.js";
import ForgotPasswordPage from "ForgotPasswordPage";
import PasswordResetPage from "PasswordResetPage";
import ProtectedRoute from "ProtectedRoute.js";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Protect these routes */}
        <Route path="/citizen/*" element={<ProtectedRoute element={<CitizenLayout />} />} />
        <Route path="/industry/*" element={<ProtectedRoute element={<IndustryLayout />} />} />
        <Route path="/education/*" element={<ProtectedRoute element={<EducationLayout />} />} />
        <Route path="/policy-industry/*" element={<ProtectedRoute element={<PolicyIndustryLayout />} />} />
        <Route path="/policy-education/*" element={<ProtectedRoute element={<PolicyEducationLayout />} />} />

        {/* Redirects */}
        <Route path="/citizen" element={<Navigate to="/citizen/account" replace />} />
        <Route path="/industry" element={<Navigate to="/industry/account" replace />} />
        <Route path="/education" element={<Navigate to="/education/account" replace />} />
        <Route path="/policy-industry" element={<Navigate to="/policy-industry/account" replace />} />
        <Route path="/policy-education" element={<Navigate to="/policy-education/account" replace />} />

        {/* Public Routes */}
        <Route path="/" element={<InitLayout />} >
          <Route index element={<InitPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<PasswordResetPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);