import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

sessionStorage.removeItem("sessionToken"); // clear stale token once on page load

createRoot(document.getElementById("root")).render(<App />);