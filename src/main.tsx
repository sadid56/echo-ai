import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

if (typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent)) {
  document.documentElement.classList.add("is-android");
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
