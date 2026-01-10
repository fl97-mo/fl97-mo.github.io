import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

import { UIProvider } from "./app/store/ui";

createRoot(document.getElementById("root")!).render(
  <UIProvider>
    <App />
  </UIProvider>
);

requestAnimationFrame(() => {
  document.documentElement.dataset.mounted = "1";
});
