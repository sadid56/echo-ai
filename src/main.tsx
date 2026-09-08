import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

if (typeof navigator !== "undefined") {
  const ua = (navigator.userAgent || "").toLowerCase();
  if (ua.includes("android") || /android/i.test(ua)) {
    document.documentElement.classList.add("is-android");
    document.documentElement.setAttribute("data-platform", "android");
  }
}

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    },
    { passive: true },
  );

  document.addEventListener("focusin", () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      if (document.documentElement.scrollTop !== 0) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body.scrollTop !== 0) {
        document.body.scrollTop = 0;
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
