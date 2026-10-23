import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

// Hide the loading screen once the app has drawn its first screen.
requestAnimationFrame(() => requestAnimationFrame(() => {
  const el = document.getElementById("splash");
  if (el) { el.classList.add("hide"); setTimeout(() => el.remove(), 350); }
}));

// Lets Android Chrome offer "Install app" and keeps the app shell available offline.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
