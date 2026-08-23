import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";

import "./styles/global.css";

// Sem router: a loja é a única página "de verdade", e /admin apenas
// troca o que é renderizado no mesmo index.html.
const ehAdmin = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {ehAdmin ? <AdminApp /> : <App />}
  </React.StrictMode>
);