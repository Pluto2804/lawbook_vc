import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // ← THIS LINE WAS MISSING

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
