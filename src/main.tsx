import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

import { UIProvider } from "./app/store/ui";

createRoot(document.getElementById("root")!).render(
  <UIProvider>
    <App />
  </UIProvider>
);

const revealApp = () => {
  document.documentElement.dataset.mounted = "1";
};

const waitForRetroFont = async () => {
  if (!document.fonts?.load) return;

  await Promise.race([
    document.fonts.load('20px "VT323"'),
    new Promise((resolve) => window.setTimeout(resolve, 900)),
  ]);
};

waitForRetroFont()
  .catch(() => {})
  .finally(() => {
    requestAnimationFrame(revealApp);
  });
