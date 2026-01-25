import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import SessionTimeoutModal from "./components/auth/SessionTimeoutModal";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <SessionTimeoutModal />
    </AuthProvider>
  </React.StrictMode>
);
