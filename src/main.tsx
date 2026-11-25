
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./lib/firebase";
  import "./styles/index.css";

// Redirect legacy hash routes before the app reads the current route.
if (window.location.hash.startsWith("#/")) {
  window.history.replaceState(
    null,
    "",
    `${window.location.hash.slice(1)}${window.location.search}`
  );
}

  createRoot(document.getElementById("root")!).render(<App />);
  
