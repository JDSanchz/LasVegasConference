import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "./App";
import "./styles.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/dashboard/*"
          element={
            <Suspense fallback={null}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
